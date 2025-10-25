<?php

class QueryOptimizer {
    private $db;
    private $cache;
    private $slowQueryThreshold = 1000; // 1 seconde en millisecondes
    private $queryLog = [];
    
    public function __construct($database, $cacheManager = null) {
        $this->db = $database;
        $this->cache = $cacheManager;
    }
    
    /**
     * Exécuter une requête avec optimisation automatique
     */
    public function execute($query, $params = [], $options = []) {
        $startTime = microtime(true);
        $queryHash = $this->getQueryHash($query, $params);
        
        // Vérifier le cache si activé
        if ($this->cache && ($options['cache'] ?? false)) {
            $cacheKey = "query:{$queryHash}";
            $cached = $this->cache->get($cacheKey);
            
            if ($cached !== null) {
                $this->logQuery($query, $params, 0, 'cache_hit');
                return $cached;
            }
        }
        
        // Analyser et optimiser la requête si nécessaire
        $optimizedQuery = $this->optimizeQuery($query, $options);
        
        // Exécuter la requête
        try {
            if ($options['fetch_mode'] ?? 'all' === 'one') {
                $result = $this->db->fetchOne($optimizedQuery, $params);
            } else {
                $result = $this->db->fetchAll($optimizedQuery, $params);
            }
            
            $executionTime = (microtime(true) - $startTime) * 1000;
            
            // Mettre en cache si configuré
            if ($this->cache && ($options['cache'] ?? false)) {
                $cacheTTL = $options['cache_ttl'] ?? 300;
                $this->cache->set($cacheKey, $result, $cacheTTL);
            }
            
            // Logger la requête
            $this->logQuery($optimizedQuery, $params, $executionTime, 'success');
            
            // Alerter si requête lente
            if ($executionTime > $this->slowQueryThreshold) {
                $this->handleSlowQuery($optimizedQuery, $params, $executionTime);
            }
            
            return $result;
            
        } catch (Exception $e) {
            $executionTime = (microtime(true) - $startTime) * 1000;
            $this->logQuery($optimizedQuery, $params, $executionTime, 'error', $e->getMessage());
            throw $e;
        }
    }
    
    /**
     * Optimiser une requête SQL
     */
    private function optimizeQuery($query, $options = []) {
        $originalQuery = $query;
        
        // Normaliser la requête
        $query = $this->normalizeQuery($query);
        
        // Appliquer les optimisations
        $query = $this->addIndexHints($query, $options);
        $query = $this->optimizeJoins($query);
        $query = $this->optimizeWhere($query);
        $query = $this->optimizeOrderBy($query);
        $query = $this->addQueryHints($query, $options);
        
        // Logger si la requête a été modifiée
        if ($query !== $originalQuery) {
            logInfo('Requête optimisée', [
                'original' => $originalQuery,
                'optimized' => $query
            ]);
        }
        
        return $query;
    }
    
    /**
     * Normaliser la requête (espaces, casse, etc.)
     */
    private function normalizeQuery($query) {
        // Supprimer les espaces multiples
        $query = preg_replace('/\s+/', ' ', trim($query));
        
        // Normaliser les mots-clés SQL
        $keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
                    'INNER JOIN', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET'];
        
        foreach ($keywords as $keyword) {
            $query = preg_replace('/\b' . preg_quote($keyword, '/') . '\b/i', $keyword, $query);
        }
        
        return $query;
    }
    
    /**
     * Ajouter des hints d'index si spécifiés
     */
    private function addIndexHints($query, $options) {
        if (!isset($options['index_hints'])) {
            return $query;
        }
        
        foreach ($options['index_hints'] as $table => $indexes) {
            $hint = is_array($indexes) ? implode(', ', $indexes) : $indexes;
            $pattern = '/FROM\s+' . preg_quote($table, '/') . '\b/i';
            $replacement = "FROM {$table} USE INDEX ({$hint})";
            $query = preg_replace($pattern, $replacement, $query);
        }
        
        return $query;
    }
    
    /**
     * Optimiser les JOINs
     */
    private function optimizeJoins($query) {
        // Convertir les jointures implicites en jointures explicites
        // WHERE a.id = b.a_id -> INNER JOIN b ON a.id = b.a_id
        
        // Réorganiser l'ordre des JOINs (tables plus petites en premier)
        // Cette optimisation nécessiterait des statistiques sur les tables
        
        return $query;
    }
    
    /**
     * Optimiser les clauses WHERE
     */
    private function optimizeWhere($query) {
        // Réorganiser les conditions WHERE pour mettre les plus sélectives en premier
        // Convertir OR en UNION si approprié
        // Optimiser les conditions sur les colonnes indexées
        
        return $query;
    }
    
    /**
     * Optimiser ORDER BY
     */
    private function optimizeOrderBy($query) {
        // Vérifier si ORDER BY peut utiliser un index
        // Suggérer des index composites si nécessaire
        
        return $query;
    }
    
    /**
     * Ajouter des hints de requête MySQL
     */
    private function addQueryHints($query, $options) {
        $hints = [];
        
        // Hints de performance
        if ($options['use_index_merge'] ?? false) {
            $hints[] = 'USE_INDEX_MERGE';
        }
        
        if ($options['no_index_merge'] ?? false) {
            $hints[] = 'NO_INDEX_MERGE';
        }
        
        if ($options['straight_join'] ?? false) {
            $hints[] = 'STRAIGHT_JOIN';
        }
        
        if (!empty($hints)) {
            $hintString = '/*+ ' . implode(', ', $hints) . ' */ ';
            $query = preg_replace('/^SELECT\s+/i', 'SELECT ' . $hintString, $query);
        }
        
        return $query;
    }
    
    /**
     * Analyser le plan d'exécution d'une requête
     */
    public function explainQuery($query, $params = []) {
        try {
            $explainQuery = "EXPLAIN FORMAT=JSON " . $query;
            $result = $this->db->fetchOne($explainQuery, $params);
            
            $plan = json_decode($result['EXPLAIN'], true);
            
            return [
                'query' => $query,
                'plan' => $plan,
                'analysis' => $this->analyzePlan($plan),
                'suggestions' => $this->generateSuggestions($plan, $query)
            ];
            
        } catch (Exception $e) {
            logError('Erreur lors de l\'analyse EXPLAIN', [
                'query' => $query,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }
    
    /**
     * Analyser le plan d'exécution
     */
    private function analyzePlan($plan) {
        $analysis = [
            'total_cost' => 0,
            'table_scans' => 0,
            'index_usage' => [],
            'join_types' => [],
            'warnings' => []
        ];
        
        $this->analyzePlanRecursive($plan['query_block'] ?? $plan, $analysis);
        
        return $analysis;
    }
    
    /**
     * Analyser récursivement le plan d'exécution
     */
    private function analyzePlanRecursive($node, &$analysis) {
        if (isset($node['table'])) {
            $table = $node['table'];
            
            // Vérifier le type d'accès
            $accessType = $table['access_type'] ?? 'unknown';
            
            if ($accessType === 'ALL') {
                $analysis['table_scans']++;
                $analysis['warnings'][] = "Table scan détecté sur {$table['table_name']}";
            }
            
            if (isset($table['key'])) {
                $analysis['index_usage'][] = [
                    'table' => $table['table_name'],
                    'index' => $table['key'],
                    'key_length' => $table['key_length'] ?? null
                ];
            }
            
            // Coût estimé
            if (isset($table['rows_examined_per_scan'])) {
                $analysis['total_cost'] += $table['rows_examined_per_scan'];
            }
        }
        
        // Analyser les jointures
        if (isset($node['nested_loop'])) {
            foreach ($node['nested_loop'] as $join) {
                if (isset($join['table'])) {
                    $joinType = $join['table']['access_type'] ?? 'unknown';
                    $analysis['join_types'][] = $joinType;
                }
            }
        }
        
        // Récursion pour les sous-requêtes
        if (isset($node['subqueries'])) {
            foreach ($node['subqueries'] as $subquery) {
                $this->analyzePlanRecursive($subquery, $analysis);
            }
        }
    }
    
    /**
     * Générer des suggestions d'optimisation
     */
    private function generateSuggestions($plan, $query) {
        $suggestions = [];
        
        $analysis = $this->analyzePlan($plan);
        
        // Suggestions basées sur l'analyse
        if ($analysis['table_scans'] > 0) {
            $suggestions[] = [
                'type' => 'index',
                'priority' => 'high',
                'message' => 'Considérez ajouter des index pour éviter les table scans'
            ];
        }
        
        if ($analysis['total_cost'] > 10000) {
            $suggestions[] = [
                'type' => 'performance',
                'priority' => 'medium',
                'message' => 'Requête coûteuse, considérez la pagination ou la mise en cache'
            ];
        }
        
        // Suggestions basées sur la structure de la requête
        if (preg_match('/SELECT\s+\*/i', $query)) {
            $suggestions[] = [
                'type' => 'best_practice',
                'priority' => 'low',
                'message' => 'Évitez SELECT *, spécifiez les colonnes nécessaires'
            ];
        }
        
        if (preg_match('/ORDER BY.*RAND\(\)/i', $query)) {
            $suggestions[] = [
                'type' => 'performance',
                'priority' => 'high',
                'message' => 'ORDER BY RAND() est très lent, utilisez une alternative'
            ];
        }
        
        return $suggestions;
    }
    
    /**
     * Obtenir un hash unique pour une requête
     */
    private function getQueryHash($query, $params) {
        return md5($query . serialize($params));
    }
    
    /**
     * Logger une requête
     */
    private function logQuery($query, $params, $executionTime, $status, $error = null) {
        $logEntry = [
            'timestamp' => date('Y-m-d H:i:s'),
            'query' => $query,
            'params' => $params,
            'execution_time' => $executionTime,
            'status' => $status,
            'error' => $error
        ];
        
        $this->queryLog[] = $logEntry;
        
        // Garder seulement les 1000 dernières requêtes en mémoire
        if (count($this->queryLog) > 1000) {
            array_shift($this->queryLog);
        }
        
        // Logger les requêtes lentes ou en erreur
        if ($status === 'error' || $executionTime > $this->slowQueryThreshold) {
            logWarning('Requête problématique', $logEntry);
        }
    }
    
    /**
     * Gérer les requêtes lentes
     */
    private function handleSlowQuery($query, $params, $executionTime) {
        // Analyser automatiquement les requêtes lentes
        $analysis = $this->explainQuery($query, $params);
        
        logWarning('Requête lente détectée', [
            'query' => $query,
            'execution_time' => $executionTime,
            'analysis' => $analysis
        ]);
        
        // Optionnel: envoyer une alerte
        if ($executionTime > $this->slowQueryThreshold * 5) {
            $this->sendSlowQueryAlert($query, $executionTime, $analysis);
        }
    }
    
    /**
     * Envoyer une alerte pour requête très lente
     */
    private function sendSlowQueryAlert($query, $executionTime, $analysis) {
        // Implémentation d'alerte (email, webhook, etc.)
        logError('Requête critique très lente', [
            'query' => $query,
            'execution_time' => $executionTime,
            'suggestions' => $analysis['suggestions'] ?? []
        ]);
    }
    
    /**
     * Obtenir les statistiques des requêtes
     */
    public function getQueryStats() {
        $stats = [
            'total_queries' => count($this->queryLog),
            'slow_queries' => 0,
            'cache_hits' => 0,
            'errors' => 0,
            'avg_execution_time' => 0,
            'top_slow_queries' => []
        ];
        
        $totalTime = 0;
        $slowQueries = [];
        
        foreach ($this->queryLog as $entry) {
            $totalTime += $entry['execution_time'];
            
            if ($entry['status'] === 'cache_hit') {
                $stats['cache_hits']++;
            } elseif ($entry['status'] === 'error') {
                $stats['errors']++;
            } elseif ($entry['execution_time'] > $this->slowQueryThreshold) {
                $stats['slow_queries']++;
                $slowQueries[] = $entry;
            }
        }
        
        if ($stats['total_queries'] > 0) {
            $stats['avg_execution_time'] = $totalTime / $stats['total_queries'];
        }
        
        // Top 10 des requêtes les plus lentes
        usort($slowQueries, function($a, $b) {
            return $b['execution_time'] <=> $a['execution_time'];
        });
        
        $stats['top_slow_queries'] = array_slice($slowQueries, 0, 10);
        
        return $stats;
    }
    
    /**
     * Vider les logs de requêtes
     */
    public function clearQueryLog() {
        $this->queryLog = [];
    }
    
    /**
     * Configurer le seuil de requête lente
     */
    public function setSlowQueryThreshold($milliseconds) {
        $this->slowQueryThreshold = max(100, intval($milliseconds));
    }
    
    /**
     * Obtenir les suggestions d'index basées sur les requêtes récentes
     */
    public function getIndexSuggestions() {
        $suggestions = [];
        $queryPatterns = [];
        
        // Analyser les patterns de requêtes
        foreach ($this->queryLog as $entry) {
            if ($entry['execution_time'] > $this->slowQueryThreshold) {
                $pattern = $this->extractQueryPattern($entry['query']);
                $queryPatterns[$pattern] = ($queryPatterns[$pattern] ?? 0) + 1;
            }
        }
        
        // Générer des suggestions basées sur les patterns fréquents
        foreach ($queryPatterns as $pattern => $frequency) {
            if ($frequency >= 5) { // Seuil de fréquence
                $suggestions[] = [
                    'pattern' => $pattern,
                    'frequency' => $frequency,
                    'suggestion' => $this->generateIndexSuggestion($pattern)
                ];
            }
        }
        
        return $suggestions;
    }
    
    /**
     * Extraire le pattern d'une requête
     */
    private function extractQueryPattern($query) {
        // Remplacer les valeurs par des placeholders
        $pattern = preg_replace('/\b\d+\b/', '?', $query);
        $pattern = preg_replace("/'[^']*'/", '?', $pattern);
        $pattern = preg_replace('/"[^"]*"/', '?', $pattern);
        
        return $pattern;
    }
    
    /**
     * Générer une suggestion d'index pour un pattern
     */
    private function generateIndexSuggestion($pattern) {
        // Analyser le pattern pour suggérer des index
        // Cette fonction pourrait être beaucoup plus sophistiquée
        
        if (preg_match('/WHERE\s+(\w+)\s*=/', $pattern, $matches)) {
            return "Considérez créer un index sur la colonne: {$matches[1]}";
        }
        
        if (preg_match('/ORDER BY\s+(\w+)/', $pattern, $matches)) {
            return "Considérez créer un index sur la colonne de tri: {$matches[1]}";
        }
        
        return "Analysez cette requête pour des opportunités d'optimisation";
    }
}