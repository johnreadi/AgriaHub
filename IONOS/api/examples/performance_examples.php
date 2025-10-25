<?php
/**
 * Exemples d'utilisation des composants d'optimisation des performances
 * AGRIA ROUEN - API PHP Optimisée
 */

require_once '../config.php';

/**
 * Exemple 1: Utilisation du cache pour les données fréquemment consultées
 */
function exempleCache() {
    global $cacheManager, $database;
    
    echo "<h2>Exemple 1: Mise en cache des données</h2>\n";
    
    // Récupérer les utilisateurs avec cache
    $users = $cacheManager->remember('users_list', function() use ($database) {
        echo "Requête exécutée (pas de cache)\n";
        return $database->fetchAll("SELECT id, nom, email FROM users LIMIT 10");
    }, 300); // Cache pendant 5 minutes
    
    echo "Utilisateurs récupérés: " . count($users) . "\n";
    
    // Deuxième appel - devrait utiliser le cache
    $usersFromCache = $cacheManager->remember('users_list', function() use ($database) {
        echo "Cette ligne ne devrait pas s'afficher si le cache fonctionne\n";
        return $database->fetchAll("SELECT id, nom, email FROM users LIMIT 10");
    }, 300);
    
    echo "Utilisateurs du cache: " . count($usersFromCache) . "\n";
}

/**
 * Exemple 2: Pagination efficace avec cache
 */
function exemplePagination() {
    global $paginator, $database;
    
    echo "<h2>Exemple 2: Pagination avec cache</h2>\n";
    
    // Pagination simple
    $result = $paginator->paginate(
        "SELECT * FROM users ORDER BY created_at DESC",
        [],
        [
            'page' => 1,
            'limit' => 10,
            'cache' => true,
            'cache_ttl' => 300
        ]
    );
    
    echo "Page 1: " . count($result['data']) . " utilisateurs\n";
    echo "Total: " . $result['pagination']['total'] . " utilisateurs\n";
    echo "Pages totales: " . $result['pagination']['total_pages'] . "\n";
    
    // Pagination par curseur pour de meilleures performances
    $cursorResult = $paginator->cursorPaginate(
        "SELECT * FROM users ORDER BY id",
        [],
        [
            'limit' => 10,
            'cursor_column' => 'id'
        ]
    );
    
    echo "Pagination par curseur: " . count($cursorResult['data']) . " utilisateurs\n";
    if ($cursorResult['pagination']['has_next']) {
        echo "Curseur suivant: " . $cursorResult['pagination']['next_cursor'] . "\n";
    }
}

/**
 * Exemple 3: Optimisation des requêtes avec analyse
 */
function exempleOptimisationRequetes() {
    global $queryOptimizer;
    
    echo "<h2>Exemple 3: Optimisation des requêtes</h2>\n";
    
    // Exécuter une requête avec optimisation
    $query = "SELECT u.*, p.nom as profil FROM users u LEFT JOIN profils p ON u.profil_id = p.id WHERE u.actif = 1";
    
    $result = $queryOptimizer->execute($query, [], [
        'cache' => true,
        'cache_ttl' => 600,
        'index_hints' => [
            'users' => 'idx_actif'
        ]
    ]);
    
    echo "Résultats optimisés: " . count($result) . "\n";
    
    // Analyser le plan d'exécution
    $analysis = $queryOptimizer->explainQuery($query);
    if ($analysis) {
        echo "Analyse de la requête:\n";
        echo "- Coût total: " . $analysis['analysis']['total_cost'] . "\n";
        echo "- Table scans: " . $analysis['analysis']['table_scans'] . "\n";
        echo "- Suggestions: " . count($analysis['suggestions']) . "\n";
        
        foreach ($analysis['suggestions'] as $suggestion) {
            echo "  * " . $suggestion['message'] . " (Priorité: " . $suggestion['priority'] . ")\n";
        }
    }
    
    // Statistiques des requêtes
    $stats = $queryOptimizer->getQueryStats();
    echo "Statistiques:\n";
    echo "- Total requêtes: " . $stats['total_queries'] . "\n";
    echo "- Requêtes lentes: " . $stats['slow_queries'] . "\n";
    echo "- Hits cache: " . $stats['cache_hits'] . "\n";
    echo "- Temps moyen: " . round($stats['avg_execution_time'], 2) . "ms\n";
}

/**
 * Exemple 4: Compression des réponses
 */
function exempleCompression() {
    global $compressionManager;
    
    echo "<h2>Exemple 4: Compression des réponses</h2>\n";
    
    // Simuler une réponse JSON volumineuse
    $data = [];
    for ($i = 0; $i < 1000; $i++) {
        $data[] = [
            'id' => $i,
            'nom' => 'Utilisateur ' . $i,
            'email' => 'user' . $i . '@example.com',
            'description' => str_repeat('Lorem ipsum dolor sit amet, consectetur adipiscing elit. ', 10)
        ];
    }
    
    $jsonResponse = json_encode($data);
    $originalSize = strlen($jsonResponse);
    
    echo "Taille originale: " . number_format($originalSize) . " octets\n";
    
    // Compresser la réponse
    $compressed = $compressionManager->compressResponse(
        $jsonResponse,
        'application/json',
        ['cache_key' => 'large_dataset_' . md5($jsonResponse)]
    );
    
    $compressedSize = strlen($compressed);
    $ratio = round((1 - $compressedSize / $originalSize) * 100, 1);
    
    echo "Taille compressée: " . number_format($compressedSize) . " octets\n";
    echo "Ratio de compression: " . $ratio . "%\n";
    echo "Octets économisés: " . number_format($originalSize - $compressedSize) . "\n";
    
    // Test de compression sur différents contenus
    $testContents = [
        'JSON' => json_encode(['test' => 'data', 'array' => range(1, 100)]),
        'HTML' => str_repeat('<div>Contenu HTML répétitif</div>', 100),
        'CSS' => str_repeat('body { margin: 0; padding: 0; } .class { color: red; }', 50),
        'JavaScript' => str_repeat('function test() { console.log("test"); }', 30)
    ];
    
    echo "\nTests de compression par type:\n";
    foreach ($testContents as $type => $content) {
        $test = $compressionManager->testCompression($content);
        if ($test['success']) {
            echo "- {$type}: {$test['compression_ratio']}% de compression\n";
        }
    }
}

/**
 * Exemple 5: Monitoring des performances
 */
function exempleMonitoring() {
    global $performanceMonitor;
    
    echo "<h2>Exemple 5: Monitoring des performances</h2>\n";
    
    // Simuler une requête
    $requestData = $performanceMonitor->startRequest('/api/users', 'GET');
    
    // Simuler du travail
    usleep(100000); // 100ms
    
    // Simuler une requête de base de données
    $performanceMonitor->recordDatabaseQuery(
        "SELECT * FROM users WHERE actif = 1",
        50 // 50ms
    );
    
    // Simuler des opérations de cache
    $performanceMonitor->recordCacheOperation('get', 'users_list', true); // hit
    $performanceMonitor->recordCacheOperation('get', 'other_data', false); // miss
    $performanceMonitor->recordCacheOperation('set', 'new_data');
    
    // Terminer la requête
    $result = $performanceMonitor->endRequest($requestData, 200);
    
    echo "Temps de réponse: " . round($result['response_time'], 2) . "ms\n";
    echo "Mémoire utilisée: " . number_format($result['memory_used']) . " octets\n";
    
    // Obtenir le résumé des métriques
    $summary = $performanceMonitor->getMetricsSummary();
    
    echo "\nRésumé des performances:\n";
    echo "- Requêtes totales: " . $summary['requests']['total'] . "\n";
    echo "- Taux de succès: " . $summary['requests']['success_rate'] . "%\n";
    echo "- Temps de réponse moyen: " . $summary['requests']['avg_response_time'] . "ms\n";
    echo "- Mémoire actuelle: " . $summary['memory']['current'] . "\n";
    echo "- Taux de hit cache: " . $summary['cache']['hit_rate'] . "%\n";
    echo "- Utilisation CPU: " . $summary['system']['cpu_usage'] . "\n";
    
    // Alertes récentes
    $alerts = $performanceMonitor->getRecentAlerts(5);
    if (!empty($alerts)) {
        echo "\nAlertes récentes:\n";
        foreach ($alerts as $alert) {
            echo "- " . $alert['type'] . " (" . $alert['severity'] . ")\n";
        }
    } else {
        echo "\nAucune alerte récente\n";
    }
}

/**
 * Exemple 6: Intégration complète avec middleware
 */
function exempleIntegrationComplete() {
    global $performanceMonitor, $compressionManager, $cacheManager;
    
    echo "<h2>Exemple 6: Intégration complète</h2>\n";
    
    // Simuler une requête API complète avec tous les composants
    $requestData = $performanceMonitor->startRequest('/api/products/search', 'POST');
    
    try {
        // 1. Vérifier le cache
        $cacheKey = 'search_' . md5('terme_recherche');
        $cachedResult = $cacheManager->get($cacheKey);
        
        if ($cachedResult) {
            echo "Résultat trouvé en cache\n";
            $performanceMonitor->recordCacheOperation('get', $cacheKey, true);
            $data = $cachedResult;
        } else {
            echo "Exécution de la recherche\n";
            $performanceMonitor->recordCacheOperation('get', $cacheKey, false);
            
            // 2. Exécuter la recherche avec optimisation
            global $queryOptimizer;
            $searchQuery = "SELECT * FROM products WHERE nom LIKE ? OR description LIKE ? ORDER BY popularite DESC";
            $params = ['%terme%', '%terme%'];
            
            $startTime = microtime(true);
            $data = $queryOptimizer->execute($searchQuery, $params, [
                'cache' => false, // Pas de cache au niveau requête car on gère manuellement
                'index_hints' => ['products' => 'idx_search']
            ]);
            $queryTime = (microtime(true) - $startTime) * 1000;
            
            $performanceMonitor->recordDatabaseQuery($searchQuery, $queryTime);
            
            // 3. Mettre en cache le résultat
            $cacheManager->set($cacheKey, $data, 300);
            $performanceMonitor->recordCacheOperation('set', $cacheKey);
        }
        
        // 4. Paginer les résultats
        global $paginator;
        $paginatedData = $paginator->paginate(
            "SELECT * FROM (" . implode(' UNION ALL ', array_map(function($item) {
                return "SELECT " . $item['id'] . " as id, '" . addslashes($item['nom']) . "' as nom";
            }, array_slice($data, 0, 5))) . ") as subquery",
            [],
            ['page' => 1, 'limit' => 10]
        );
        
        // 5. Formater la réponse
        $response = [
            'success' => true,
            'data' => $paginatedData['data'],
            'pagination' => $paginatedData['pagination'],
            'meta' => [
                'cached' => isset($cachedResult),
                'query_time' => $queryTime ?? 0,
                'total_results' => count($data)
            ]
        ];
        
        $jsonResponse = json_encode($response);
        
        // 6. Compresser la réponse
        $compressedResponse = $compressionManager->compressResponse(
            $jsonResponse,
            'application/json'
        );
        
        echo "Réponse générée et compressée\n";
        echo "Taille originale: " . strlen($jsonResponse) . " octets\n";
        echo "Taille compressée: " . strlen($compressedResponse) . " octets\n";
        
        $performanceMonitor->endRequest($requestData, 200);
        
    } catch (Exception $e) {
        echo "Erreur: " . $e->getMessage() . "\n";
        $performanceMonitor->endRequest($requestData, 500, $e->getMessage());
    }
}

// Exécuter les exemples si le script est appelé directement
if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'])) {
    header('Content-Type: text/plain; charset=utf-8');
    
    echo "=== EXEMPLES D'OPTIMISATION DES PERFORMANCES ===\n\n";
    
    try {
        exempleCache();
        echo "\n" . str_repeat("-", 50) . "\n\n";
        
        exemplePagination();
        echo "\n" . str_repeat("-", 50) . "\n\n";
        
        exempleOptimisationRequetes();
        echo "\n" . str_repeat("-", 50) . "\n\n";
        
        exempleCompression();
        echo "\n" . str_repeat("-", 50) . "\n\n";
        
        exempleMonitoring();
        echo "\n" . str_repeat("-", 50) . "\n\n";
        
        exempleIntegrationComplete();
        
    } catch (Exception $e) {
        echo "Erreur lors de l'exécution des exemples: " . $e->getMessage() . "\n";
        echo "Trace: " . $e->getTraceAsString() . "\n";
    }
    
    echo "\n=== FIN DES EXEMPLES ===\n";
}
?>