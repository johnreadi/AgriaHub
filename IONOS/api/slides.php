<?php
/**
 * API Endpoint pour la gestion des diapositives
 * AGRIA ROUEN - Administration
 */

require_once 'config.php';
require_once 'database.php';

// Initialisation de la base de données
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    // Ne pas bloquer l'API slides en mode local si la base n'est pas accessible
    logError("Erreur de connexion à la base de données: " . $e->getMessage());
    $db = null; // fallback: permettra à GET de retourner une liste vide
}

// Gestion des requêtes
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

try {
    switch ($method) {
        case 'GET':
            handleGetSlides($db);
            break;
        case 'POST':
            handleCreateSlide($db);
            break;
        case 'PUT':
            handleUpdateSlide($db);
            break;
        case 'DELETE':
            handleDeleteSlide($db);
            break;
        default:
            jsonResponse(['error' => 'Méthode non autorisée'], 405);
    }
} catch (Exception $e) {
    logError("Erreur dans slides.php: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}

/**
 * Récupérer toutes les diapositives
 */
function handleGetSlides($db) {
    try {
        logError('handleGetSlides called', ['db_null' => ($db === null)]);
        if ($db === null) {
            jsonResponse(['success' => true, 'data' => []]);
            return;
        }
        try {
            $stmt = $db->prepare("SELECT * FROM slides ORDER BY sort_order ASC");
            $stmt->execute();
        } catch (PDOException $e) {
            $code = $e->getCode();
            $msg = $e->getMessage();
            if ($code == '42S02' || strpos($msg, '1146') !== false || stripos($msg, 'Base table') !== false) {
                jsonResponse(['success' => true, 'data' => []]);
                return;
            }
            throw $e;
        }
        $slides = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['success' => true, 'data' => $slides]);
    } catch (Exception $e) {
        logError("Erreur lors de la récupération des diapositives: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la récupération des diapositives'], 500);
    }
}

/**
 * Créer une nouvelle diapositive
 */
function handleCreateSlide($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            jsonResponse(['error' => 'Données invalides'], 400);
            return;
        }
        
        // Obtenir le prochain index d'ordre
        $stmt = $db->prepare("SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM slides");
        $stmt->execute();
        $nextOrder = $stmt->fetch(PDO::FETCH_ASSOC)['next_order'];
        
        $sql = "INSERT INTO slides (
                    title, subtitle, description, image_url, button_text, button_url, 
                    background_color, text_color, order_index, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $input['title'] ?? '',
            $input['subtitle'] ?? '',
            $input['description'] ?? '',
            $input['image_url'] ?? null,
            $input['button_text'] ?? null,
            $input['button_url'] ?? null,
            $input['background_color'] ?? '#ffffff',
            $input['text_color'] ?? '#000000',
            $input['order_index'] ?? $nextOrder,
            $input['is_active'] ?? true
        ]);
        
        $slideId = $db->lastInsertId();
        
        jsonResponse([
            'success' => true, 
            'message' => 'Diapositive créée avec succès',
            'data' => ['id' => $slideId]
        ]);
        
    } catch (Exception $e) {
        logError("Erreur lors de la création de la diapositive: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la création'], 500);
    }
}

/**
 * Mettre à jour une diapositive
 */
function handleUpdateSlide($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            jsonResponse(['error' => 'ID de diapositive requis'], 400);
            return;
        }
        
        $slideId = $input['id'];
        
        // Vérifier que la diapositive existe
        $stmt = $db->prepare("SELECT id FROM slides WHERE id = ?");
        $stmt->execute([$slideId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Diapositive non trouvée'], 404);
            return;
        }
        
        $sql = "UPDATE slides SET 
                    title = ?, subtitle = ?, description = ?, image_url = ?, 
                    button_text = ?, button_url = ?, background_color = ?, 
                    text_color = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $input['title'] ?? '',
            $input['subtitle'] ?? '',
            $input['description'] ?? '',
            $input['image_url'] ?? null,
            $input['button_text'] ?? null,
            $input['button_url'] ?? null,
            $input['background_color'] ?? '#ffffff',
            $input['text_color'] ?? '#000000',
            $input['order_index'] ?? 1,
            $input['is_active'] ?? true,
            $slideId
        ]);
        
        jsonResponse(['success' => true, 'message' => 'Diapositive mise à jour avec succès']);
        
    } catch (Exception $e) {
        logError("Erreur lors de la mise à jour de la diapositive: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la mise à jour'], 500);
    }
}

/**
 * Supprimer une diapositive
 */
function handleDeleteSlide($db) {
    try {
        $slideId = $_GET['id'] ?? null;
        
        if (!$slideId) {
            jsonResponse(['error' => 'ID de diapositive requis'], 400);
            return;
        }
        
        // Vérifier que la diapositive existe
        $stmt = $db->prepare("SELECT id FROM slides WHERE id = ?");
        $stmt->execute([$slideId]);
        if (!$stmt->fetch()) {
            jsonResponse(['error' => 'Diapositive non trouvée'], 404);
            return;
        }
        
        // Supprimer la diapositive
        $stmt = $db->prepare("DELETE FROM slides WHERE id = ?");
        $stmt->execute([$slideId]);
        
        jsonResponse(['success' => true, 'message' => 'Diapositive supprimée avec succès']);
        
    } catch (Exception $e) {
        logError("Erreur lors de la suppression de la diapositive: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la suppression'], 500);
    }
}
?>