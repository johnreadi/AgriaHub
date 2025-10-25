<?php
/**
 * API Endpoint pour l'upload de fichiers
 * AGRIA ROUEN - Administration
 */

require_once 'config.php';

// Configuration des uploads
define('UPLOAD_DIR', '../uploads/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']);

// Créer le dossier d'upload s'il n'existe pas
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Gestion des requêtes
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            handleFileUpload();
            break;
        case 'DELETE':
            handleFileDelete();
            break;
        case 'GET':
            handleListFiles();
            break;
        default:
            jsonResponse(['error' => 'Méthode non autorisée'], 405);
    }
} catch (Exception $e) {
    logError("Erreur dans upload.php: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}

/**
 * Gérer l'upload de fichiers
 */
function handleFileUpload() {
    try {
        if (!isset($_FILES['file'])) {
            jsonResponse(['error' => 'Aucun fichier fourni'], 400);
            return;
        }
        
        $file = $_FILES['file'];
        $uploadType = $_POST['type'] ?? 'general'; // logo, slider, general, etc.
        
        // Vérifications de base
        if ($file['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'Erreur lors de l\'upload: ' . getUploadErrorMessage($file['error'])], 400);
            return;
        }
        
        if ($file['size'] > MAX_FILE_SIZE) {
            jsonResponse(['error' => 'Fichier trop volumineux (max 5MB)'], 400);
            return;
        }
        
        // Vérifier le type MIME
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, ALLOWED_TYPES)) {
            jsonResponse(['error' => 'Type de fichier non autorisé'], 400);
            return;
        }
        
        // Vérifier l'extension
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($extension, ALLOWED_EXTENSIONS)) {
            jsonResponse(['error' => 'Extension de fichier non autorisée'], 400);
            return;
        }
        
        // Générer un nom de fichier unique
        $filename = generateUniqueFilename($file['name'], $uploadType);
        $filepath = UPLOAD_DIR . $filename;
        
        // Créer le sous-dossier si nécessaire
        $subdir = UPLOAD_DIR . $uploadType . '/';
        if (!file_exists($subdir)) {
            mkdir($subdir, 0755, true);
        }
        $filepath = $subdir . $filename;
        
        // Déplacer le fichier
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            jsonResponse(['error' => 'Erreur lors de la sauvegarde du fichier'], 500);
            return;
        }
        
        // Optimiser l'image si nécessaire
        optimizeImage($filepath, $mimeType);
        
        // Retourner les informations du fichier
        $fileInfo = [
            'filename' => $filename,
            'original_name' => $file['name'],
            'type' => $uploadType,
            'mime_type' => $mimeType,
            'size' => filesize($filepath),
            'url' => '/uploads/' . $uploadType . '/' . $filename,
            'uploaded_at' => date('Y-m-d H:i:s')
        ];
        
        jsonResponse([
            'success' => true,
            'message' => 'Fichier uploadé avec succès',
            'data' => $fileInfo
        ]);
        
    } catch (Exception $e) {
        logError("Erreur lors de l'upload: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de l\'upload'], 500);
    }
}

/**
 * Supprimer un fichier
 */
function handleFileDelete() {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['filename']) || !isset($input['type'])) {
            jsonResponse(['error' => 'Nom de fichier et type requis'], 400);
            return;
        }
        
        $filename = basename($input['filename']); // Sécurité
        $type = $input['type'];
        $filepath = UPLOAD_DIR . $type . '/' . $filename;
        
        if (!file_exists($filepath)) {
            jsonResponse(['error' => 'Fichier non trouvé'], 404);
            return;
        }
        
        if (!unlink($filepath)) {
            jsonResponse(['error' => 'Erreur lors de la suppression'], 500);
            return;
        }
        
        jsonResponse(['success' => true, 'message' => 'Fichier supprimé avec succès']);
        
    } catch (Exception $e) {
        logError("Erreur lors de la suppression: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la suppression'], 500);
    }
}

/**
 * Lister les fichiers
 */
function handleListFiles() {
    try {
        $type = $_GET['type'] ?? null;
        $files = [];
        
        if ($type) {
            $dir = UPLOAD_DIR . $type . '/';
            if (is_dir($dir)) {
                $files = scanDirectory($dir, $type);
            }
        } else {
            // Lister tous les types
            $types = ['logo', 'slider', 'general'];
            foreach ($types as $t) {
                $dir = UPLOAD_DIR . $t . '/';
                if (is_dir($dir)) {
                    $files = array_merge($files, scanDirectory($dir, $t));
                }
            }
        }
        
        jsonResponse(['success' => true, 'data' => $files]);
        
    } catch (Exception $e) {
        logError("Erreur lors de la liste des fichiers: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la récupération'], 500);
    }
}

/**
 * Scanner un répertoire
 */
function scanDirectory($dir, $type) {
    $files = [];
    $items = scandir($dir);
    
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') continue;
        
        $filepath = $dir . $item;
        if (is_file($filepath)) {
            $files[] = [
                'filename' => $item,
                'type' => $type,
                'size' => filesize($filepath),
                'url' => '/uploads/' . $type . '/' . $item,
                'modified_at' => date('Y-m-d H:i:s', filemtime($filepath))
            ];
        }
    }
    
    return $files;
}

/**
 * Générer un nom de fichier unique
 */
function generateUniqueFilename($originalName, $type) {
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $basename = pathinfo($originalName, PATHINFO_FILENAME);
    $basename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $basename);
    
    $timestamp = time();
    $random = substr(md5(uniqid()), 0, 8);
    
    return $type . '_' . $basename . '_' . $timestamp . '_' . $random . '.' . $extension;
}

/**
 * Optimiser une image
 */
function optimizeImage($filepath, $mimeType) {
    try {
        $maxWidth = 1920;
        $maxHeight = 1080;
        $quality = 85;
        
        switch ($mimeType) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($filepath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($filepath);
                break;
            case 'image/gif':
                $image = imagecreatefromgif($filepath);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($filepath);
                break;
            default:
                return; // Pas d'optimisation pour ce type
        }
        
        if (!$image) return;
        
        $width = imagesx($image);
        $height = imagesy($image);
        
        // Redimensionner si nécessaire
        if ($width > $maxWidth || $height > $maxHeight) {
            $ratio = min($maxWidth / $width, $maxHeight / $height);
            $newWidth = intval($width * $ratio);
            $newHeight = intval($height * $ratio);
            
            $newImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Préserver la transparence pour PNG
            if ($mimeType === 'image/png') {
                imagealphablending($newImage, false);
                imagesavealpha($newImage, true);
            }
            
            imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
            
            // Sauvegarder l'image optimisée
            switch ($mimeType) {
                case 'image/jpeg':
                    imagejpeg($newImage, $filepath, $quality);
                    break;
                case 'image/png':
                    imagepng($newImage, $filepath, 9);
                    break;
                case 'image/gif':
                    imagegif($newImage, $filepath);
                    break;
                case 'image/webp':
                    imagewebp($newImage, $filepath, $quality);
                    break;
            }
            
            imagedestroy($newImage);
        }
        
        imagedestroy($image);
        
    } catch (Exception $e) {
        logError("Erreur lors de l'optimisation de l'image: " . $e->getMessage());
        // Ne pas faire échouer l'upload si l'optimisation échoue
    }
}

/**
 * Obtenir le message d'erreur d'upload
 */
function getUploadErrorMessage($errorCode) {
    switch ($errorCode) {
        case UPLOAD_ERR_INI_SIZE:
            return 'Le fichier dépasse la taille maximale autorisée par le serveur';
        case UPLOAD_ERR_FORM_SIZE:
            return 'Le fichier dépasse la taille maximale autorisée par le formulaire';
        case UPLOAD_ERR_PARTIAL:
            return 'Le fichier n\'a été que partiellement uploadé';
        case UPLOAD_ERR_NO_FILE:
            return 'Aucun fichier n\'a été uploadé';
        case UPLOAD_ERR_NO_TMP_DIR:
            return 'Dossier temporaire manquant';
        case UPLOAD_ERR_CANT_WRITE:
            return 'Impossible d\'écrire le fichier sur le disque';
        case UPLOAD_ERR_EXTENSION:
            return 'Upload arrêté par une extension PHP';
        default:
            return 'Erreur inconnue';
    }
}
?>