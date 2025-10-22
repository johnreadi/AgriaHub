<?php
/**
 * Middleware de Performance pour l'API AGRIA ROUEN
 * Intègre automatiquement tous les composants d'optimisation
 */

class PerformanceMiddleware {
    private $performanceMonitor;
    private $compressionManager;
    private $cacheManager;
    private $queryOptimizer;
    private $config;
    private $requestData;
    
    public function __construct($performanceMonitor, $compressionManager, $cacheManager, $queryOptimizer, $config = []) {
        $this->performanceMonitor = $performanceMonitor;
        $this->compressionManager = $compressionManager;
        $this->cacheManager = $cacheManager;
        $this->queryOptimizer = $queryOptimizer;
        $this->config = array_merge([
            'enable_compression' => true,
            'enable_caching' => true,
            'enable_monitoring' => true,
            'enable_query_optimization' => true,
            'cache_ttl' => 300,
            'compression_threshold' => 1024, // Compresser si > 1KB
            'slow_query_threshold' => 1000, // 1 seconde
            'memory_limit_warning' => 128 * 1024 * 1024, // 128MB
            'response_time_warning' => 2000 // 2 secondes
        ], $config);
    }
    
    /**
     * Traitement avant la requête
     */
    public function before($request) {
        // Démarrer le monitoring
        if ($this->config['enable_monitoring']) {
            $this->requestData = $this->performanceMonitor->startRequest(
                $request['path'] ?? $_SERVER['REQUEST_URI'],
                $request['method'] ?? $_SERVER['REQUEST_METHOD']
            );
        }
        
        // Vérifier les limites de ressources
        $this->checkResourceLimits();
        
        // Configurer l'optimisation des requêtes
        if ($this->config['enable_query_optimization']) {
            $this->queryOptimizer->setSlowQueryThreshold($this->config['slow_query_threshold']);
        }
        
        // Ajouter les en-têtes de performance
        $this->addPerformanceHeaders();
        
        return $request;
    }
    
    /**
     * Traitement après la requête
     */
    public function after($request, $response) {
        // Optimiser la réponse
        $response = $this->optimizeResponse($response);
        
        // Compresser si nécessaire
        if ($this->config['enable_compression']) {
            $response = $this->compressResponse($response);
        }
        
        // Terminer le monitoring
        if ($this->config['enable_monitoring'] && $this->requestData) {
            $statusCode = $response['status_code'] ?? 200;
            $errorMessage = $response['error'] ?? null;
            
            $metrics = $this->performanceMonitor->endRequest(
                $this->requestData,
                $statusCode,
                $errorMessage
            );
            
            // Ajouter les métriques aux en-têtes de réponse
            $this->addMetricsHeaders($response, $metrics);
            
            // Vérifier les alertes
            $this->checkPerformanceAlerts($metrics);
        }
        
        return $response;
    }
    
    /**
     * Gestion des erreurs avec monitoring
     */
    public function handleError($error, $request) {
        if ($this->config['enable_monitoring'] && $this->requestData) {
            $this->performanceMonitor->endRequest(
                $this->requestData,
                500,
                $error['message'] ?? 'Unknown error'
            );
        }
        
        // Logger l'erreur avec contexte de performance
        $this->logErrorWithContext($error, $request);
        
        return [
            'status_code' => 500,
            'body' => json_encode([
                'error' => 'Internal Server Error',
                'message' => ENVIRONMENT === 'development' ? $error['message'] : 'Une erreur est survenue'
            ]),
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Error-ID' => uniqid('err_')
            ]
        ];
    }
    
    /**
     * Optimiser la réponse
     */
    private function optimizeResponse($response) {
        if (!isset($response['body'])) {
            return $response;
        }
        
        $body = $response['body'];
        
        // Minifier le JSON si possible
        if (isset($response['headers']['Content-Type']) && 
            strpos($response['headers']['Content-Type'], 'application/json') !== false) {
            
            $decoded = json_decode($body, true);
            if ($decoded !== null) {
                $body = json_encode($decoded, JSON_UNESCAPED_UNICODE);
            }
        }
        
        // Optimiser les images SVG
        if (isset($response['headers']['Content-Type']) && 
            strpos($response['headers']['Content-Type'], 'image/svg') !== false) {
            $body = $this->optimizeSvg($body);
        }
        
        $response['body'] = $body;
        return $response;
    }
    
    /**
     * Compresser la réponse
     */
    private function compressResponse($response) {
        if (!isset($response['body']) || 
            strlen($response['body']) < $this->config['compression_threshold']) {
            return $response;
        }
        
        $contentType = $response['headers']['Content-Type'] ?? 'text/plain';
        
        try {
            $compressed = $this->compressionManager->compressResponse(
                $response['body'],
                $contentType
            );
            
            if ($compressed && strlen($compressed) < strlen($response['body'])) {
                $response['body'] = $compressed;
                
                // Ajouter les en-têtes de compression
                $encoding = $this->compressionManager->negotiateEncoding($_SERVER['HTTP_ACCEPT_ENCODING'] ?? '');
                if ($encoding) {
                    $response['headers']['Content-Encoding'] = $encoding;
                    $response['headers']['Vary'] = 'Accept-Encoding';
                }
            }
        } catch (Exception $e) {
            // Logger l'erreur de compression mais continuer
            error_log("Erreur de compression: " . $e->getMessage());
        }
        
        return $response;
    }
    
    /**
     * Vérifier les limites de ressources
     */
    private function checkResourceLimits() {
        $memoryUsage = memory_get_usage(true);
        
        if ($memoryUsage > $this->config['memory_limit_warning']) {
            $this->performanceMonitor->recordAlert(
                'high_memory_usage',
                'warning',
                "Utilisation mémoire élevée: " . number_format($memoryUsage / 1024 / 1024, 2) . "MB"
            );
        }
        
        // Vérifier la charge système
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            if ($load[0] > 2.0) { // Charge élevée
                $this->performanceMonitor->recordAlert(
                    'high_system_load',
                    'warning',
                    "Charge système élevée: " . round($load[0], 2)
                );
            }
        }
    }
    
    /**
     * Ajouter les en-têtes de performance
     */
    private function addPerformanceHeaders() {
        // En-têtes de cache
        header('Cache-Control: public, max-age=300');
        header('ETag: "' . md5($_SERVER['REQUEST_URI']) . '"');
        
        // En-têtes de sécurité pour les performances
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        
        // En-têtes de compression
        if ($this->config['enable_compression']) {
            header('Vary: Accept-Encoding');
        }
    }
    
    /**
     * Ajouter les métriques aux en-têtes
     */
    private function addMetricsHeaders(&$response, $metrics) {
        if (!isset($response['headers'])) {
            $response['headers'] = [];
        }
        
        // Ajouter les métriques de performance
        $response['headers']['X-Response-Time'] = round($metrics['response_time'], 2) . 'ms';
        $response['headers']['X-Memory-Usage'] = number_format($metrics['memory_used'] / 1024, 2) . 'KB';
        
        // Ajouter l'ID de requête pour le debugging
        $response['headers']['X-Request-ID'] = $this->requestData['request_id'] ?? uniqid('req_');
        
        // Ajouter les informations de cache si disponibles
        if (isset($metrics['cache_hits'])) {
            $response['headers']['X-Cache-Hits'] = $metrics['cache_hits'];
        }
        
        // Ajouter les informations de base de données
        if (isset($metrics['db_queries'])) {
            $response['headers']['X-DB-Queries'] = $metrics['db_queries'];
        }
    }
    
    /**
     * Vérifier les alertes de performance
     */
    private function checkPerformanceAlerts($metrics) {
        // Alerte temps de réponse
        if ($metrics['response_time'] > $this->config['response_time_warning']) {
            $this->performanceMonitor->recordAlert(
                'slow_response',
                'warning',
                "Temps de réponse lent: " . round($metrics['response_time'], 2) . "ms"
            );
        }
        
        // Alerte utilisation mémoire
        if ($metrics['memory_used'] > $this->config['memory_limit_warning']) {
            $this->performanceMonitor->recordAlert(
                'high_memory_request',
                'warning',
                "Requête consommant beaucoup de mémoire: " . 
                number_format($metrics['memory_used'] / 1024 / 1024, 2) . "MB"
            );
        }
    }
    
    /**
     * Logger les erreurs avec contexte de performance
     */
    private function logErrorWithContext($error, $request) {
        $context = [
            'error' => $error,
            'request' => [
                'method' => $request['method'] ?? $_SERVER['REQUEST_METHOD'],
                'path' => $request['path'] ?? $_SERVER['REQUEST_URI'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
            ],
            'performance' => [
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true),
                'execution_time' => microtime(true) - ($_SERVER['REQUEST_TIME_FLOAT'] ?? microtime(true))
            ]
        ];
        
        error_log("Performance Error: " . json_encode($context));
    }
    
    /**
     * Optimiser le SVG
     */
    private function optimizeSvg($svg) {
        // Supprimer les commentaires
        $svg = preg_replace('/<!--.*?-->/s', '', $svg);
        
        // Supprimer les espaces inutiles
        $svg = preg_replace('/\s+/', ' ', $svg);
        
        // Supprimer les attributs inutiles
        $svg = preg_replace('/\s*(xmlns:.*?=".*?")\s*/', '', $svg);
        
        return trim($svg);
    }
    
    /**
     * Middleware pour les requêtes API
     */
    public static function handle($request, $next) {
        global $performanceMonitor, $compressionManager, $cacheManager, $queryOptimizer;
        
        $middleware = new self(
            $performanceMonitor,
            $compressionManager,
            $cacheManager,
            $queryOptimizer
        );
        
        try {
            // Traitement avant
            $request = $middleware->before($request);
            
            // Exécuter la requête
            $response = $next($request);
            
            // Traitement après
            $response = $middleware->after($request, $response);
            
            return $response;
            
        } catch (Exception $e) {
            return $middleware->handleError([
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], $request);
        }
    }
    
    /**
     * Obtenir les statistiques de performance
     */
    public function getPerformanceStats() {
        if (!$this->config['enable_monitoring']) {
            return null;
        }
        
        return [
            'monitoring' => $this->performanceMonitor->getMetricsSummary(),
            'cache' => $this->cacheManager->getStats(),
            'compression' => $this->compressionManager->getStats(),
            'queries' => $this->queryOptimizer->getQueryStats()
        ];
    }
    
    /**
     * Réinitialiser les statistiques
     */
    public function resetStats() {
        if ($this->config['enable_monitoring']) {
            $this->performanceMonitor->resetMetrics();
        }
    }
}
?>