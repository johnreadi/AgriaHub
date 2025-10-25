<?php
/**
 * API Endpoint pour la gestion des sections du restaurant
 * AGRIA ROUEN - Administration
 */

require_once 'config.php';
require_once 'database.php';

// Initialisation de la base de données
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    logError("Erreur de connexion à la base de données: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur de connexion à la base de données'], 500);
    exit;
}

// Gestion des requêtes
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];

try {
    switch ($method) {
        case 'GET':
            handleGetSections($db);
            break;
        case 'POST':
            handleCreateSection($db);
            break;
        case 'PUT':
            handleUpdateSection($db);
            break;
        case 'DELETE':
            handleDeleteSection($db);
            break;
        default:
            jsonResponse(['error' => 'Méthode non autorisée'], 405);
    }
} catch (Exception $e) {
    logError("Erreur dans restaurant_sections.php: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}

/**
 * Récupérer toutes les sections
 */
function handleGetSections($db) {
    try {
        $sectionType = $_GET['type'] ?? null;
        
        if ($sectionType) {
            // Récupérer une section spécifique avec ses données
            $sections = getSectionWithData($db, $sectionType);
        } else {
            // Récupérer toutes les sections
            $stmt = $db->prepare("SELECT * FROM restaurant_sections ORDER BY order_index ASC");
            $stmt->execute();
            $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Ajouter les données pour chaque section
            foreach ($sections as &$section) {
                $section['data'] = getSectionData($db, $section['id'], $section['section_type']);
            }
        }
        
        jsonResponse(['success' => true, 'data' => $sections]);
        
    } catch (Exception $e) {
        logError("Erreur lors de la récupération des sections: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la récupération des sections'], 500);
    }
}

/**
 * Créer une nouvelle section
 */
function handleCreateSection($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['section_type'])) {
            jsonResponse(['error' => 'Type de section requis'], 400);
            return;
        }
        
        // Obtenir le prochain index d'ordre
        $stmt = $db->prepare("SELECT COALESCE(MAX(order_index), 0) + 1 as next_order FROM restaurant_sections");
        $stmt->execute();
        $nextOrder = $stmt->fetch(PDO::FETCH_ASSOC)['next_order'];
        
        $sql = "INSERT INTO restaurant_sections (
                    section_type, title, subtitle, description, background_color, 
                    text_color, order_index, is_active
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $input['section_type'],
            $input['title'] ?? '',
            $input['subtitle'] ?? '',
            $input['description'] ?? '',
            $input['background_color'] ?? '#ffffff',
            $input['text_color'] ?? '#000000',
            $input['order_index'] ?? $nextOrder,
            $input['is_active'] ?? true
        ]);
        
        $sectionId = $db->lastInsertId();
        
        // Créer les données spécifiques selon le type de section
        if (isset($input['data'])) {
            createSectionData($db, $sectionId, $input['section_type'], $input['data']);
        }
        
        jsonResponse([
            'success' => true, 
            'message' => 'Section créée avec succès',
            'data' => ['id' => $sectionId]
        ]);
        
    } catch (Exception $e) {
        logError("Erreur lors de la création de la section: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la création'], 500);
    }
}

/**
 * Mettre à jour une section
 */
function handleUpdateSection($db) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['id'])) {
            jsonResponse(['error' => 'ID de section requis'], 400);
            return;
        }
        
        $sectionId = $input['id'];
        
        // Vérifier que la section existe
        $stmt = $db->prepare("SELECT section_type FROM restaurant_sections WHERE id = ?");
        $stmt->execute([$sectionId]);
        $section = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$section) {
            jsonResponse(['error' => 'Section non trouvée'], 404);
            return;
        }
        
        // Mettre à jour la section
        $sql = "UPDATE restaurant_sections SET 
                    title = ?, subtitle = ?, description = ?, background_color = ?, 
                    text_color = ?, order_index = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $input['title'] ?? '',
            $input['subtitle'] ?? '',
            $input['description'] ?? '',
            $input['background_color'] ?? '#ffffff',
            $input['text_color'] ?? '#000000',
            $input['order_index'] ?? 1,
            $input['is_active'] ?? true,
            $sectionId
        ]);
        
        // Mettre à jour les données spécifiques
        if (isset($input['data'])) {
            updateSectionData($db, $sectionId, $section['section_type'], $input['data']);
        }
        
        jsonResponse(['success' => true, 'message' => 'Section mise à jour avec succès']);
        
    } catch (Exception $e) {
        logError("Erreur lors de la mise à jour de la section: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la mise à jour'], 500);
    }
}

/**
 * Supprimer une section
 */
function handleDeleteSection($db) {
    try {
        $sectionId = $_GET['id'] ?? null;
        
        if (!$sectionId) {
            jsonResponse(['error' => 'ID de section requis'], 400);
            return;
        }
        
        // Vérifier que la section existe
        $stmt = $db->prepare("SELECT section_type FROM restaurant_sections WHERE id = ?");
        $stmt->execute([$sectionId]);
        $section = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$section) {
            jsonResponse(['error' => 'Section non trouvée'], 404);
            return;
        }
        
        // Supprimer les données associées
        deleteSectionData($db, $sectionId, $section['section_type']);
        
        // Supprimer la section
        $stmt = $db->prepare("DELETE FROM restaurant_sections WHERE id = ?");
        $stmt->execute([$sectionId]);
        
        jsonResponse(['success' => true, 'message' => 'Section supprimée avec succès']);
        
    } catch (Exception $e) {
        logError("Erreur lors de la suppression de la section: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la suppression'], 500);
    }
}

/**
 * Récupérer une section avec ses données
 */
function getSectionWithData($db, $sectionType) {
    $stmt = $db->prepare("SELECT * FROM restaurant_sections WHERE section_type = ? AND is_active = 1 ORDER BY order_index ASC");
    $stmt->execute([$sectionType]);
    $sections = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($sections as &$section) {
        $section['data'] = getSectionData($db, $section['id'], $section['section_type']);
    }
    
    return $sections;
}

/**
 * Récupérer les données d'une section
 */
function getSectionData($db, $sectionId, $sectionType) {
    switch ($sectionType) {
        case 'concept':
            $stmt = $db->prepare("SELECT * FROM concept_paragraphs WHERE section_id = ? ORDER BY order_index ASC");
            $stmt->execute([$sectionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        case 'values':
            $stmt = $db->prepare("SELECT * FROM value_cards WHERE section_id = ? ORDER BY order_index ASC");
            $stmt->execute([$sectionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        case 'image':
        case 'video':
            $stmt = $db->prepare("SELECT * FROM section_media WHERE section_id = ? ORDER BY order_index ASC");
            $stmt->execute([$sectionId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
            
        default:
            return [];
    }
}

/**
 * Créer les données d'une section
 */
function createSectionData($db, $sectionId, $sectionType, $data) {
    switch ($sectionType) {
        case 'concept':
            foreach ($data as $index => $paragraph) {
                $stmt = $db->prepare("INSERT INTO concept_paragraphs (section_id, title, content, order_index) VALUES (?, ?, ?, ?)");
                $stmt->execute([$sectionId, $paragraph['title'] ?? '', $paragraph['content'] ?? '', $index + 1]);
            }
            break;
            
        case 'values':
            foreach ($data as $index => $card) {
                $stmt = $db->prepare("INSERT INTO value_cards (section_id, title, description, icon, order_index) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$sectionId, $card['title'] ?? '', $card['description'] ?? '', $card['icon'] ?? '', $index + 1]);
            }
            break;
            
        case 'image':
        case 'video':
            foreach ($data as $index => $media) {
                $stmt = $db->prepare("INSERT INTO section_media (section_id, media_type, media_url, alt_text, caption, order_index) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([
                    $sectionId, 
                    $sectionType, 
                    $media['url'] ?? '', 
                    $media['alt'] ?? '', 
                    $media['caption'] ?? '', 
                    $index + 1
                ]);
            }
            break;
    }
}

/**
 * Mettre à jour les données d'une section
 */
function updateSectionData($db, $sectionId, $sectionType, $data) {
    // Supprimer les anciennes données
    deleteSectionData($db, $sectionId, $sectionType);
    
    // Créer les nouvelles données
    createSectionData($db, $sectionId, $sectionType, $data);
}

/**
 * Supprimer les données d'une section
 */
function deleteSectionData($db, $sectionId, $sectionType) {
    switch ($sectionType) {
        case 'concept':
            $stmt = $db->prepare("DELETE FROM concept_paragraphs WHERE section_id = ?");
            $stmt->execute([$sectionId]);
            break;
            
        case 'values':
            $stmt = $db->prepare("DELETE FROM value_cards WHERE section_id = ?");
            $stmt->execute([$sectionId]);
            break;
            
        case 'image':
        case 'video':
            $stmt = $db->prepare("DELETE FROM section_media WHERE section_id = ?");
            $stmt->execute([$sectionId]);
            break;
    }
}
?>