<?php

class PerformanceMonitor {
    private $cache;
    private $db;
    private $startTime;
    private $metrics = [];
    private $thresholds;
    private $alerts = [];
    
    public function __construct($database = null, $cacheManager = null, $config = []) {
        $this->db = $database;
        $this->cache = $cacheManager;
        $this->startTime = microtime(true);
        
        // Seuils par défaut
        $this->thresholds = array_merge([
            'response_time' => 1000, // 1 seconde
            'memory_usage' => 128 * 1024 * 1024, // 128MB
            'cpu_usage' => 80, // 80%
            'error_rate' => 5, // 5%
            'slow_query' => 1000, // 1 seconde
            'cache_hit_rate' => 80 // 80%
        ], $config['thresholds'] ?? []);
        
        // Initialiser les métriques
        $this->initializeMetrics();
    }
    
    /**
     * Initialiser les métriques de base
     */
    private function initializeMetrics() {
        $this->metrics = [
            'requests' => [
                'total' => 0,
                'success' => 0,
                'errors' => 0,
                'response_times' => []
            ],
            'memory' => [
                'peak' => 0,
                'current' => 0,
                'limit' => ini_get('memory_limit')
            ],
            'database' => [
                'queries' => 0,
                'slow_queries' => 0,
                'query_times' => [],
                'connections' => 0
            ],
            'cache' => [
                'hits' => 0,
                'misses' => 0,
                'sets' => 0,
                'deletes' => 0
            ],
            'system' => [
                'cpu_usage' => 0,
                'load_average' => 0,
                'disk_usage' => 0
            ]
        ];
    }
    
    /**
     * Démarrer le monitoring d'une requête
     */
    public function startRequest($endpoint = null, $method = null) {
        $this->startTime = microtime(true);
        
        $this->metrics['requests']['total']++;
        
        // Enregistrer les métriques système
        $this->recordSystemMetrics();
        
        return [
            'start_time' => $this->startTime,
            'endpoint' => $endpoint,
            'method' => $method,
            'memory_start' => memory_get_usage(true)
        ];
    }
    
    /**
     * Terminer le monitoring d'une requête
     */
    public function endRequest($requestData, $statusCode = 200, $error = null) {
        $endTime = microtime(true);
        $responseTime = ($endTime - $requestData['start_time']) * 1000; // en millisecondes
        $memoryUsed = memory_get_usage(true) - $requestData['memory_start'];
        
        // Enregistrer les métriques de la requête
        $this->metrics['requests']['response_times'][] = $responseTime;
        
        if ($statusCode >= 200 && $statusCode < 400) {
            $this->metrics['requests']['success']++;
        } else {
            $this->metrics['requests']['errors']++;
        }
        
        // Vérifier les seuils
        $this->checkThresholds($responseTime, $memoryUsed, $statusCode, $error);
        
        // Logger les métriques
        $this->logRequestMetrics($requestData, $responseTime, $memoryUsed, $statusCode, $error);
        
        // Mettre à jour les métriques en cache
        $this->updateCachedMetrics();
        
        return [
            'response_time' => $responseTime,
            'memory_used' => $memoryUsed,
            'status_code' => $statusCode
        ];
    }
    
    /**
     * Enregistrer une requête de base de données
     */
    public function recordDatabaseQuery($query, $executionTime, $error = null) {
        $this->metrics['database']['queries']++;
        $this->metrics['database']['query_times'][] = $executionTime;
        
        if ($executionTime > $this->thresholds['slow_query']) {
            $this->metrics['database']['slow_queries']++;
            
            $this->addAlert('slow_query', [
                'query' => substr($query, 0, 200) . '...',
                'execution_time' => $executionTime,
                'threshold' => $this->thresholds['slow_query']
            ]);
        }
        
        if ($error) {
            logError('Erreur de base de données', [
                'query' => $query,
                'execution_time' => $executionTime,
                'error' => $error
            ]);
        }
    }
    
    /**
     * Enregistrer une opération de cache
     */
    public function recordCacheOperation($operation, $key, $hit = null) {
        switch ($operation) {
            case 'get':
                if ($hit) {
                    $this->metrics['cache']['hits']++;
                } else {
                    $this->metrics['cache']['misses']++;
                }
                break;
            case 'set':
                $this->metrics['cache']['sets']++;
                break;
            case 'delete':
                $this->metrics['cache']['deletes']++;
                break;
        }
        
        // Vérifier le taux de hit du cache
        $this->checkCacheHitRate();
    }
    
    /**
     * Enregistrer les métriques système
     */
    private function recordSystemMetrics() {
        // Utilisation mémoire
        $this->metrics['memory']['current'] = memory_get_usage(true);
        $this->metrics['memory']['peak'] = max(
            $this->metrics['memory']['peak'],
            memory_get_peak_usage(true)
        );
        
        // Charge système (Linux/Unix seulement)
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            $this->metrics['system']['load_average'] = $load[0] ?? 0;
        }
        
        // Utilisation CPU (approximation)
        $this->metrics['system']['cpu_usage'] = $this->getCpuUsage();
        
        // Utilisation disque
        $this->metrics['system']['disk_usage'] = $this->getDiskUsage();
    }
    
    /**
     * Obtenir l'utilisation CPU (approximation)
     */
    private function getCpuUsage() {
        static $lastCpuTime = null;
        static $lastTime = null;
        
        if (function_exists('getrusage')) {
            $usage = getrusage();
            $currentCpuTime = $usage['ru_utime.tv_sec'] + $usage['ru_stime.tv_sec'];
            $currentTime = microtime(true);
            
            if ($lastCpuTime !== null && $lastTime !== null) {
                $cpuDiff = $currentCpuTime - $lastCpuTime;
                $timeDiff = $currentTime - $lastTime;
                
                if ($timeDiff > 0) {
                    $cpuUsage = ($cpuDiff / $timeDiff) * 100;
                    $lastCpuTime = $currentCpuTime;
                    $lastTime = $currentTime;
                    return min(100, max(0, $cpuUsage));
                }
            }
            
            $lastCpuTime = $currentCpuTime;
            $lastTime = $currentTime;
        }
        
        return 0;
    }
    
    /**
     * Obtenir l'utilisation disque
     */
    private function getDiskUsage() {
        $path = __DIR__;
        $totalBytes = disk_total_space($path);
        $freeBytes = disk_free_space($path);
        
        if ($totalBytes && $freeBytes) {
            return (($totalBytes - $freeBytes) / $totalBytes) * 100;
        }
        
        return 0;
    }
    
    /**
     * Vérifier les seuils et générer des alertes
     */
    private function checkThresholds($responseTime, $memoryUsed, $statusCode, $error) {
        // Temps de réponse
        if ($responseTime > $this->thresholds['response_time']) {
            $this->addAlert('slow_response', [
                'response_time' => $responseTime,
                'threshold' => $this->thresholds['response_time']
            ]);
        }
        
        // Utilisation mémoire
        if ($this->metrics['memory']['current'] > $this->thresholds['memory_usage']) {
            $this->addAlert('high_memory', [
                'memory_usage' => $this->metrics['memory']['current'],
                'threshold' => $this->thresholds['memory_usage']
            ]);
        }
        
        // Utilisation CPU
        if ($this->metrics['system']['cpu_usage'] > $this->thresholds['cpu_usage']) {
            $this->addAlert('high_cpu', [
                'cpu_usage' => $this->metrics['system']['cpu_usage'],
                'threshold' => $this->thresholds['cpu_usage']
            ]);
        }
        
        // Taux d'erreur
        $errorRate = $this->getErrorRate();
        if ($errorRate > $this->thresholds['error_rate']) {
            $this->addAlert('high_error_rate', [
                'error_rate' => $errorRate,
                'threshold' => $this->thresholds['error_rate']
            ]);
        }
    }
    
    /**
     * Vérifier le taux de hit du cache
     */
    private function checkCacheHitRate() {
        $hitRate = $this->getCacheHitRate();
        
        if ($hitRate < $this->thresholds['cache_hit_rate']) {
            $this->addAlert('low_cache_hit_rate', [
                'hit_rate' => $hitRate,
                'threshold' => $this->thresholds['cache_hit_rate']
            ]);
        }
    }
    
    /**
     * Ajouter une alerte
     */
    private function addAlert($type, $data) {
        $alert = [
            'type' => $type,
            'timestamp' => time(),
            'data' => $data,
            'severity' => $this->getAlertSeverity($type)
        ];
        
        $this->alerts[] = $alert;
        
        // Garder seulement les 100 dernières alertes
        if (count($this->alerts) > 100) {
            array_shift($this->alerts);
        }
        
        // Logger l'alerte
        logWarning("Alerte de performance: {$type}", $alert);
        
        // Envoyer une notification si critique
        if ($alert['severity'] === 'critical') {
            $this->sendCriticalAlert($alert);
        }
    }
    
    /**
     * Déterminer la sévérité d'une alerte
     */
    private function getAlertSeverity($type) {
        $severityMap = [
            'slow_response' => 'warning',
            'high_memory' => 'critical',
            'high_cpu' => 'warning',
            'high_error_rate' => 'critical',
            'slow_query' => 'warning',
            'low_cache_hit_rate' => 'info'
        ];
        
        return $severityMap[$type] ?? 'info';
    }
    
    /**
     * Envoyer une alerte critique
     */
    private function sendCriticalAlert($alert) {
        // Implémentation d'envoi d'alerte (email, webhook, etc.)
        logError('ALERTE CRITIQUE', $alert);
    }
    
    /**
     * Logger les métriques de requête
     */
    private function logRequestMetrics($requestData, $responseTime, $memoryUsed, $statusCode, $error) {
        $logData = [
            'endpoint' => $requestData['endpoint'],
            'method' => $requestData['method'],
            'response_time' => $responseTime,
            'memory_used' => $memoryUsed,
            'status_code' => $statusCode,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        if ($error) {
            $logData['error'] = $error;
        }
        
        logInfo('Métriques de requête', $logData);
    }
    
    /**
     * Mettre à jour les métriques en cache
     */
    private function updateCachedMetrics() {
        if (!$this->cache) {
            return;
        }
        
        $summary = $this->getMetricsSummary();
        $this->cache->set('performance_metrics', $summary, 60); // 1 minute
    }
    
    /**
     * Obtenir un résumé des métriques
     */
    public function getMetricsSummary() {
        return [
            'requests' => [
                'total' => $this->metrics['requests']['total'],
                'success_rate' => $this->getSuccessRate(),
                'error_rate' => $this->getErrorRate(),
                'avg_response_time' => $this->getAverageResponseTime(),
                'p95_response_time' => $this->getPercentileResponseTime(95),
                'p99_response_time' => $this->getPercentileResponseTime(99)
            ],
            'memory' => [
                'current' => $this->formatBytes($this->metrics['memory']['current']),
                'peak' => $this->formatBytes($this->metrics['memory']['peak']),
                'limit' => $this->metrics['memory']['limit']
            ],
            'database' => [
                'total_queries' => $this->metrics['database']['queries'],
                'slow_queries' => $this->metrics['database']['slow_queries'],
                'avg_query_time' => $this->getAverageQueryTime(),
                'slow_query_rate' => $this->getSlowQueryRate()
            ],
            'cache' => [
                'hit_rate' => $this->getCacheHitRate(),
                'total_operations' => $this->getTotalCacheOperations()
            ],
            'system' => [
                'cpu_usage' => round($this->metrics['system']['cpu_usage'], 2) . '%',
                'load_average' => round($this->metrics['system']['load_average'], 2),
                'disk_usage' => round($this->metrics['system']['disk_usage'], 2) . '%'
            ],
            'alerts' => [
                'total' => count($this->alerts),
                'critical' => count(array_filter($this->alerts, function($a) {
                    return $a['severity'] === 'critical';
                }))
            ]
        ];
    }
    
    /**
     * Calculer le taux de succès
     */
    private function getSuccessRate() {
        $total = $this->metrics['requests']['total'];
        if ($total === 0) return 100;
        
        return round(($this->metrics['requests']['success'] / $total) * 100, 2);
    }
    
    /**
     * Calculer le taux d'erreur
     */
    private function getErrorRate() {
        $total = $this->metrics['requests']['total'];
        if ($total === 0) return 0;
        
        return round(($this->metrics['requests']['errors'] / $total) * 100, 2);
    }
    
    /**
     * Calculer le temps de réponse moyen
     */
    private function getAverageResponseTime() {
        $times = $this->metrics['requests']['response_times'];
        if (empty($times)) return 0;
        
        return round(array_sum($times) / count($times), 2);
    }
    
    /**
     * Calculer un percentile de temps de réponse
     */
    private function getPercentileResponseTime($percentile) {
        $times = $this->metrics['requests']['response_times'];
        if (empty($times)) return 0;
        
        sort($times);
        $index = ceil(($percentile / 100) * count($times)) - 1;
        
        return round($times[$index] ?? 0, 2);
    }
    
    /**
     * Calculer le temps de requête moyen
     */
    private function getAverageQueryTime() {
        $times = $this->metrics['database']['query_times'];
        if (empty($times)) return 0;
        
        return round(array_sum($times) / count($times), 2);
    }
    
    /**
     * Calculer le taux de requêtes lentes
     */
    private function getSlowQueryRate() {
        $total = $this->metrics['database']['queries'];
        if ($total === 0) return 0;
        
        return round(($this->metrics['database']['slow_queries'] / $total) * 100, 2);
    }
    
    /**
     * Calculer le taux de hit du cache
     */
    private function getCacheHitRate() {
        $hits = $this->metrics['cache']['hits'];
        $misses = $this->metrics['cache']['misses'];
        $total = $hits + $misses;
        
        if ($total === 0) return 100;
        
        return round(($hits / $total) * 100, 2);
    }
    
    /**
     * Obtenir le total des opérations de cache
     */
    private function getTotalCacheOperations() {
        return $this->metrics['cache']['hits'] + 
               $this->metrics['cache']['misses'] + 
               $this->metrics['cache']['sets'] + 
               $this->metrics['cache']['deletes'];
    }
    
    /**
     * Formater les octets en format lisible
     */
    private function formatBytes($bytes) {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
    
    /**
     * Obtenir les alertes récentes
     */
    public function getRecentAlerts($limit = 10) {
        return array_slice(array_reverse($this->alerts), 0, $limit);
    }
    
    /**
     * Réinitialiser les métriques
     */
    public function resetMetrics() {
        $this->initializeMetrics();
        $this->alerts = [];
        
        if ($this->cache) {
            $this->cache->delete('performance_metrics');
        }
    }
    
    /**
     * Exporter les métriques
     */
    public function exportMetrics($format = 'json') {
        $data = [
            'summary' => $this->getMetricsSummary(),
            'raw_metrics' => $this->metrics,
            'alerts' => $this->alerts,
            'thresholds' => $this->thresholds,
            'export_time' => date('Y-m-d H:i:s')
        ];
        
        switch ($format) {
            case 'json':
                return json_encode($data, JSON_PRETTY_PRINT);
            case 'csv':
                return $this->exportToCsv($data);
            default:
                return $data;
        }
    }
    
    /**
     * Exporter en CSV
     */
    private function exportToCsv($data) {
        $csv = "Metric,Value\n";
        
        foreach ($data['summary'] as $category => $metrics) {
            if (is_array($metrics)) {
                foreach ($metrics as $key => $value) {
                    $csv .= "{$category}.{$key}," . (is_numeric($value) ? $value : '"' . $value . '"') . "\n";
                }
            } else {
                $csv .= "{$category}," . (is_numeric($metrics) ? $metrics : '"' . $metrics . '"') . "\n";
            }
        }
        
        return $csv;
    }
    
    /**
     * Middleware de monitoring
     */
    public function middleware($request, $response, $next) {
        $requestData = $this->startRequest(
            $request->getUri()->getPath(),
            $request->getMethod()
        );
        
        try {
            $response = $next($request, $response);
            $statusCode = $response->getStatusCode();
            
            $this->endRequest($requestData, $statusCode);
            
            return $response;
        } catch (Exception $e) {
            $this->endRequest($requestData, 500, $e->getMessage());
            throw $e;
        }
    }
}