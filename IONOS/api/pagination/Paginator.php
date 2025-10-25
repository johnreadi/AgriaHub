<?php

class Paginator {
    private $db;
    private $cache;
    private $defaultLimit = 20;
    private $maxLimit = 100;
    
    public function __construct($database, $cacheManager = null) {
        $this->db = $database;
        $this->cache = $cacheManager;
    }
    
    /**
     * Paginer une requête SQL
     */
    public function paginate($query, $params = [], $options = []) {
        $page = max(1, intval($options['page'] ?? 1));
        $limit = $this->validateLimit($options['limit'] ?? $this->defaultLimit);
        $offset = ($page - 1) * $limit;
        
        // Clé de cache pour cette requête
        $cacheKey = $this->generateCacheKey($query, $params, $page, $limit);
        
        // Vérifier le cache si disponible
        if ($this->cache && isset($options['cache']) && $options['cache']) {
            $cached = $this->cache->get($cacheKey);
            if ($cached !== null) {
                return $cached;
            }
        }
        
        // Compter le total d'éléments
        $totalCount = $this->getTotalCount($query, $params, $options);
        
        // Calculer les métadonnées de pagination
        $totalPages = ceil($totalCount / $limit);
        $hasNext = $page < $totalPages;
        $hasPrev = $page > 1;
        
        // Modifier la requête pour ajouter LIMIT et OFFSET
        $paginatedQuery = $this->addLimitOffset($query, $limit, $offset);
        
        // Exécuter la requête paginée
        $data = $this->db->fetchAll($paginatedQuery, $params);
        
        // Préparer le résultat
        $result = [
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $totalCount,
                'total_pages' => $totalPages,
                'has_next' => $hasNext,
                'has_prev' => $hasPrev,
                'next_page' => $hasNext ? $page + 1 : null,
                'prev_page' => $hasPrev ? $page - 1 : null,
                'from' => $totalCount > 0 ? $offset + 1 : 0,
                'to' => min($offset + $limit, $totalCount)
            ],
            'links' => $this->generateLinks($page, $totalPages, $options)
        ];
        
        // Mettre en cache si configuré
        if ($this->cache && isset($options['cache']) && $options['cache']) {
            $cacheTTL = $options['cache_ttl'] ?? 300; // 5 minutes par défaut
            $this->cache->set($cacheKey, $result, $cacheTTL);
        }
        
        return $result;
    }
    
    /**
     * Pagination avec curseur (pour de très grandes datasets)
     */
    public function cursorPaginate($query, $params = [], $options = []) {
        $limit = $this->validateLimit($options['limit'] ?? $this->defaultLimit);
        $cursor = $options['cursor'] ?? null;
        $cursorColumn = $options['cursor_column'] ?? 'id';
        $direction = strtoupper($options['direction'] ?? 'ASC');
        
        // Modifier la requête pour le curseur
        if ($cursor) {
            $operator = $direction === 'ASC' ? '>' : '<';
            $query = $this->addCursorCondition($query, $cursorColumn, $operator);
            $params[] = $cursor;
        }
        
        // Ajouter ORDER BY et LIMIT
        $query = $this->addOrderByAndLimit($query, $cursorColumn, $direction, $limit + 1);
        
        // Exécuter la requête
        $data = $this->db->fetchAll($query, $params);
        
        // Déterminer s'il y a une page suivante
        $hasNext = count($data) > $limit;
        if ($hasNext) {
            array_pop($data); // Retirer l'élément supplémentaire
        }
        
        // Déterminer le curseur suivant
        $nextCursor = null;
        if ($hasNext && !empty($data)) {
            $lastItem = end($data);
            $nextCursor = $lastItem[$cursorColumn] ?? null;
        }
        
        return [
            'data' => $data,
            'pagination' => [
                'per_page' => $limit,
                'has_next' => $hasNext,
                'next_cursor' => $nextCursor,
                'cursor_column' => $cursorColumn
            ]
        ];
    }
    
    /**
     * Pagination optimisée pour les recherches
     */
    public function searchPaginate($searchQuery, $searchParams = [], $options = []) {
        $page = max(1, intval($options['page'] ?? 1));
        $limit = $this->validateLimit($options['limit'] ?? $this->defaultLimit);
        $offset = ($page - 1) * $limit;
        
        // Utiliser une estimation pour de meilleures performances sur de grandes datasets
        $useEstimate = $options['estimate_total'] ?? false;
        
        if ($useEstimate && $page > 1) {
            // Pour les pages suivantes, estimer le total basé sur la première page
            $totalCount = $this->getEstimatedTotal($searchQuery, $searchParams, $limit);
        } else {
            // Compter précisément pour la première page
            $totalCount = $this->getTotalCount($searchQuery, $searchParams, $options);
        }
        
        // Optimisation: si on dépasse largement le total estimé, arrêter
        if ($offset >= $totalCount && $totalCount > 0) {
            return [
                'data' => [],
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => $totalCount,
                    'total_pages' => ceil($totalCount / $limit),
                    'has_next' => false,
                    'has_prev' => $page > 1,
                    'from' => 0,
                    'to' => 0
                ]
            ];
        }
        
        // Exécuter la requête de recherche paginée
        $paginatedQuery = $this->addLimitOffset($searchQuery, $limit, $offset);
        $data = $this->db->fetchAll($paginatedQuery, $searchParams);
        
        $totalPages = ceil($totalCount / $limit);
        
        return [
            'data' => $data,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $totalCount,
                'total_pages' => $totalPages,
                'has_next' => $page < $totalPages,
                'has_prev' => $page > 1,
                'next_page' => $page < $totalPages ? $page + 1 : null,
                'prev_page' => $page > 1 ? $page - 1 : null,
                'from' => count($data) > 0 ? $offset + 1 : 0,
                'to' => $offset + count($data),
                'estimated' => $useEstimate
            ]
        ];
    }
    
    /**
     * Valider et limiter la taille de page
     */
    private function validateLimit($limit) {
        $limit = max(1, intval($limit));
        return min($limit, $this->maxLimit);
    }
    
    /**
     * Générer une clé de cache unique
     */
    private function generateCacheKey($query, $params, $page, $limit) {
        $key = md5($query . serialize($params) . $page . $limit);
        return "pagination:{$key}";
    }
    
    /**
     * Obtenir le nombre total d'éléments
     */
    private function getTotalCount($query, $params, $options = []) {
        // Vérifier le cache pour le count
        $countCacheKey = "count:" . md5($query . serialize($params));
        
        if ($this->cache && isset($options['cache_count']) && $options['cache_count']) {
            $cached = $this->cache->get($countCacheKey);
            if ($cached !== null) {
                return $cached;
            }
        }
        
        // Extraire la partie SELECT et FROM de la requête
        $countQuery = $this->buildCountQuery($query);
        
        try {
            $result = $this->db->fetchOne($countQuery, $params);
            $count = $result['total'] ?? 0;
            
            // Mettre en cache le count
            if ($this->cache && isset($options['cache_count']) && $options['cache_count']) {
                $cacheTTL = $options['count_cache_ttl'] ?? 600; // 10 minutes
                $this->cache->set($countCacheKey, $count, $cacheTTL);
            }
            
            return $count;
        } catch (Exception $e) {
            logError('Erreur lors du comptage', [
                'query' => $countQuery,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }
    
    /**
     * Estimer le total basé sur les résultats de la première page
     */
    private function getEstimatedTotal($query, $params, $limit) {
        // Utiliser EXPLAIN pour obtenir une estimation
        $explainQuery = "EXPLAIN " . $query;
        
        try {
            $result = $this->db->fetchOne($explainQuery, $params);
            return $result['rows'] ?? $limit * 10; // Estimation par défaut
        } catch (Exception $e) {
            return $limit * 10; // Fallback
        }
    }
    
    /**
     * Construire une requête COUNT à partir de la requête originale
     */
    private function buildCountQuery($query) {
        // Supprimer ORDER BY, LIMIT, OFFSET pour le count
        $query = preg_replace('/\s+ORDER\s+BY\s+.+$/i', '', $query);
        $query = preg_replace('/\s+LIMIT\s+\d+(\s+OFFSET\s+\d+)?$/i', '', $query);
        
        // Si la requête contient GROUP BY, on doit compter différemment
        if (preg_match('/\s+GROUP\s+BY\s+/i', $query)) {
            return "SELECT COUNT(*) as total FROM ({$query}) as grouped_query";
        }
        
        // Remplacer SELECT ... par SELECT COUNT(*)
        $countQuery = preg_replace('/^SELECT\s+.+?\s+FROM/i', 'SELECT COUNT(*) as total FROM', $query);
        
        return $countQuery;
    }
    
    /**
     * Ajouter LIMIT et OFFSET à la requête
     */
    private function addLimitOffset($query, $limit, $offset) {
        return $query . " LIMIT {$limit} OFFSET {$offset}";
    }
    
    /**
     * Ajouter une condition de curseur à la requête
     */
    private function addCursorCondition($query, $cursorColumn, $operator) {
        // Ajouter WHERE ou AND selon la structure de la requête
        if (stripos($query, 'WHERE') !== false) {
            return $query . " AND {$cursorColumn} {$operator} ?";
        } else {
            return $query . " WHERE {$cursorColumn} {$operator} ?";
        }
    }
    
    /**
     * Ajouter ORDER BY et LIMIT pour la pagination par curseur
     */
    private function addOrderByAndLimit($query, $cursorColumn, $direction, $limit) {
        // Vérifier si ORDER BY existe déjà
        if (stripos($query, 'ORDER BY') === false) {
            $query .= " ORDER BY {$cursorColumn} {$direction}";
        }
        
        return $query . " LIMIT {$limit}";
    }
    
    /**
     * Générer les liens de navigation
     */
    private function generateLinks($currentPage, $totalPages, $options = []) {
        $baseUrl = $options['base_url'] ?? '';
        $queryParams = $options['query_params'] ?? [];
        
        $links = [
            'first' => $this->buildUrl($baseUrl, array_merge($queryParams, ['page' => 1])),
            'last' => $this->buildUrl($baseUrl, array_merge($queryParams, ['page' => $totalPages])),
            'prev' => null,
            'next' => null
        ];
        
        if ($currentPage > 1) {
            $links['prev'] = $this->buildUrl($baseUrl, array_merge($queryParams, ['page' => $currentPage - 1]));
        }
        
        if ($currentPage < $totalPages) {
            $links['next'] = $this->buildUrl($baseUrl, array_merge($queryParams, ['page' => $currentPage + 1]));
        }
        
        return $links;
    }
    
    /**
     * Construire une URL avec des paramètres
     */
    private function buildUrl($baseUrl, $params) {
        if (empty($baseUrl)) {
            return null;
        }
        
        $queryString = http_build_query($params);
        return $baseUrl . ($queryString ? '?' . $queryString : '');
    }
    
    /**
     * Obtenir des statistiques de pagination
     */
    public function getStats() {
        if (!$this->cache) {
            return ['cache' => 'disabled'];
        }
        
        return [
            'cache' => 'enabled',
            'cache_stats' => $this->cache->getStats(),
            'default_limit' => $this->defaultLimit,
            'max_limit' => $this->maxLimit
        ];
    }
    
    /**
     * Vider le cache de pagination
     */
    public function clearCache($pattern = 'pagination:*') {
        if (!$this->cache) {
            return false;
        }
        
        // Note: Cette méthode dépend de l'implémentation du cache
        // Pour Redis, on pourrait utiliser SCAN avec le pattern
        return $this->cache->flush();
    }
    
    /**
     * Configuration des limites
     */
    public function setDefaultLimit($limit) {
        $this->defaultLimit = max(1, intval($limit));
    }
    
    public function setMaxLimit($limit) {
        $this->maxLimit = max(1, intval($limit));
    }
}

/**
 * Classe utilitaire pour la pagination rapide
 */
class QuickPaginator {
    /**
     * Pagination simple pour les cas d'usage basiques
     */
    public static function simple($query, $params, $page, $limit, $db) {
        $paginator = new Paginator($db);
        return $paginator->paginate($query, $params, [
            'page' => $page,
            'limit' => $limit
        ]);
    }
    
    /**
     * Pagination avec cache pour les requêtes fréquentes
     */
    public static function cached($query, $params, $page, $limit, $db, $cache, $ttl = 300) {
        $paginator = new Paginator($db, $cache);
        return $paginator->paginate($query, $params, [
            'page' => $page,
            'limit' => $limit,
            'cache' => true,
            'cache_ttl' => $ttl,
            'cache_count' => true,
            'count_cache_ttl' => $ttl * 2
        ]);
    }
    
    /**
     * Pagination par curseur pour les flux en temps réel
     */
    public static function cursor($query, $params, $cursor, $limit, $db, $cursorColumn = 'id') {
        $paginator = new Paginator($db);
        return $paginator->cursorPaginate($query, $params, [
            'cursor' => $cursor,
            'limit' => $limit,
            'cursor_column' => $cursorColumn
        ]);
    }
}