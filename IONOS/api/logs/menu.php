<?php
// menu.php - Endpoint pour le menu (MySQL uniquement)
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if (!$db) {
        jsonResponse(['error' => 'Base de données indisponible'], 503);
    }

    $method = $_SERVER['REQUEST_METHOD'];
    
    switch ($method) {
        case 'GET':
            getMenuItems($db);
            break;
        default:
            jsonResponse(['error' => 'Méthode non autorisée'], 405);
    }
    
} catch (Exception $e) {
    jsonResponse(['error' => 'Erreur serveur: ' . $e->getMessage()], 500);
}

function getMenuItems($db) {
    try {
        // Vérifier si la table menu_items existe
        if (!dbTableExists($db, 'menu_items')) {
            jsonResponse(['error' => 'Table menu_items non disponible'], 503);
        }

        $category = $_GET['category'] ?? null;
        $featured = isset($_GET['featured']) ? (bool)$_GET['featured'] : false;
        
        $sql = "SELECT id, name, description, price, category, image_url, 
                       is_available as available, is_featured as featured, 
                       is_vegetarian as vegetarian, is_vegan as vegan
                FROM menu_items 
                WHERE is_available = 1";
        $params = [];
        
        if ($category) {
            $sql .= " AND category = :category";
            $params[':category'] = $category;
        }
        
        if ($featured) {
            $sql .= " AND is_featured = 1";
        }
        
        $sql .= " ORDER BY category, name";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Grouper par catégorie pour la réponse
        $categories = [];
        foreach ($items as $item) {
            $category = $item['category'] ?? 'other';
            if (!isset($categories[$category])) {
                $categories[$category] = [];
            }
            $categories[$category][] = $item;
        }
        
        logError('MENU_LOADED', [
            'total_items' => count($items),
            'categories' => array_keys($categories),
            'source' => 'mysql'
        ]);
        
        jsonResponse([
            'success' => true,
            'data' => $items,
            'categories' => $categories,
            'count' => count($items),
            'source' => 'mysql'
        ]);
        
    } catch (Exception $e) {
        logError('Erreur récupération menu MySQL', ['error' => $e->getMessage()]);
        jsonResponse(['error' => 'Erreur lors de la récupération du menu'], 500);
    }
}

// Helper pour vérifier l'existence des tables
if (!function_exists('dbTableExists')) {
    function dbTableExists($db, $table) {
        if (!$db) return false;
        try {
            $schema = defined('DB_NAME') ? DB_NAME : '';
            $sql = "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table LIMIT 1";
            $stmt = $db->prepare($sql);
            $stmt->bindParam(':schema', $schema);
            $stmt->bindParam(':table', $table);
            $stmt->execute();
            return $stmt->fetch() !== false;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>