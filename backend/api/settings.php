<?php
/**
 * API Endpoint pour la gestion des paramètres
 * AGRIA ROUEN - Administration
 */

require_once 'config.php';
require_once 'database.php';

// Initialisation de la base de données
$db = null;
$fallbackMode = false;
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    logError("Erreur de connexion à la base de données: " . $e->getMessage());
    // Basculer en mode secours: fournir des valeurs par défaut au lieu d'un 500
    $fallbackMode = true;
}

// Activer le stub mode si demandé explicitement (paramètre ou header) ou si le fallback est actif
$stubMode = (
    (isset($_GET['stub']) && $_GET['stub'] === '1')
    || (!empty($_SERVER['HTTP_X_STUB_MODE']) && $_SERVER['HTTP_X_STUB_MODE'] === '1')
    || $fallbackMode
);

// Gestion des requêtes
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['REQUEST_URI'];
$typeParam = $_GET['type'] ?? null;

try {
    switch ($method) {
        case 'GET':
            handleGetSettings($db, $typeParam, $fallbackMode, $stubMode);
            break;
        case 'PUT':
            if (!$db && !$stubMode) { jsonResponse(['error' => 'Base de données non disponible'], 503); }
            handleUpdateSettings($db, $stubMode);
            break;
        default:
            jsonResponse(['error' => 'Méthode non autorisée'], 405);
    }
} catch (Exception $e) {
    logError("Erreur dans settings.php: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}

/**
 * Récupérer tous les paramètres
 */
function handleGetSettings($db, $type = null, $fallbackMode = false, $stubMode = false) {
    try {
        // Paramètres généraux
        $generalSettings = null;
        if ($stubMode) { $generalSettings = readStubSettings('general'); }
        if (!$generalSettings && $db && safeTableExists($db, 'settings')) {
            $stmt = $db->prepare("SELECT * FROM settings ORDER BY id DESC LIMIT 1");
            $stmt->execute();
            $generalSettings = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$generalSettings) { $generalSettings = getDefaultGeneralSettings(); }
        
        // Paramètres d'apparence
        $appearanceSettings = null;
        if ($stubMode) { $appearanceSettings = readStubSettings('appearance'); }
        if (!$appearanceSettings && $db && safeTableExists($db, 'appearance_settings')) {
            $stmt = $db->prepare("SELECT * FROM appearance_settings ORDER BY id DESC LIMIT 1");
            $stmt->execute();
            $appearanceSettings = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$appearanceSettings) { $appearanceSettings = getDefaultAppearanceSettings(); }
        
        // Paramètres email
        $emailSettings = null;
        if ($stubMode) { $emailSettings = readStubSettings('email'); }
        if (!$emailSettings && $db && safeTableExists($db, 'email_settings')) {
            $stmt = $db->prepare("SELECT * FROM email_settings ORDER BY id DESC LIMIT 1");
            $stmt->execute();
            $emailSettings = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$emailSettings) { $emailSettings = getDefaultEmailSettings(); }
        
        // Paramètres slider
        $sliderSettings = null;
        if ($stubMode) { $sliderSettings = readStubSettings('slider'); }
        if (!$sliderSettings && $db && safeTableExists($db, 'slider_settings')) {
            $stmt = $db->prepare("SELECT * FROM slider_settings ORDER BY id DESC LIMIT 1");
            $stmt->execute();
            $sliderSettings = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!$sliderSettings) { $sliderSettings = getDefaultSliderSettings(); }
        
        // Si un type est demandé, renvoyer directement cet objet (format homogène)
        if ($type === 'appearance') { @header('Cache-Control: no-store, no-cache, must-revalidate'); jsonResponse(['success' => true, 'data' => $appearanceSettings, 'meta' => ['fallback' => (bool)$fallbackMode, 'stub' => (bool)$stubMode]]); return; }
         if ($type === 'general') { jsonResponse(['success' => true, 'data' => $generalSettings, 'meta' => ['fallback' => (bool)$fallbackMode, 'stub' => (bool)$stubMode]]); return; }
         if ($type === 'email') { jsonResponse(['success' => true, 'data' => $emailSettings, 'meta' => ['fallback' => (bool)$fallbackMode, 'stub' => (bool)$stubMode]]); return; }
         if ($type === 'slider') { jsonResponse(['success' => true, 'data' => $sliderSettings, 'meta' => ['fallback' => (bool)$fallbackMode, 'stub' => (bool)$stubMode]]); return; }
        
        $settings = [
            'general' => $generalSettings,
            'appearance' => $appearanceSettings,
            'email' => $emailSettings,
            'slider' => $sliderSettings
        ];
        
        jsonResponse(['success' => true, 'data' => $settings, 'meta' => ['fallback' => (bool)$fallbackMode, 'stub' => (bool)$stubMode]]);
        return;
        
    } catch (Exception $e) {
        // En cas d'erreur imprévue, renvoyer des valeurs par défaut
        logError("Erreur lors de la récupération des paramètres (fallback): " . $e->getMessage());
        $defaults = [
            'general' => getDefaultGeneralSettings(),
            'appearance' => getDefaultAppearanceSettings(),
            'email' => getDefaultEmailSettings(),
            'slider' => getDefaultSliderSettings()
        ];
        if ($type === 'appearance') { @header('Cache-Control: no-store, no-cache, must-revalidate'); jsonResponse(['success' => true, 'data' => $defaults['appearance'], 'meta' => ['fallback' => true]]); return; }
        if ($type === 'general') { jsonResponse(['success' => true, 'data' => $defaults['general'], 'meta' => ['fallback' => true]]); return; }
        if ($type === 'email') { jsonResponse(['success' => true, 'data' => $defaults['email'], 'meta' => ['fallback' => true]]); return; }
        if ($type === 'slider') { jsonResponse(['success' => true, 'data' => $defaults['slider'], 'meta' => ['fallback' => true]]); return; }
        jsonResponse(['success' => true, 'data' => $defaults, 'meta' => ['fallback' => true]]);
        return;
    }
}

// Helper: encapsuler les erreurs de tableExists
function safeTableExists($db, $tableName) {
    try {
        $stmt = $db->prepare("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table_name LIMIT 1");
        $stmt->execute(['table_name' => $tableName]);
        return $stmt->fetch() !== false;
    } catch (Exception $e) {
        logError('Erreur tableExists', ['table' => $tableName, 'error' => $e->getMessage()]);
        return false;
    }
}

// --- Stub helpers pour persistance minimale en local ---
function getStubDir() {
    return __DIR__ . '/cache';
}
function getStubPath($type) {
    return getStubDir() . "/stub_{$type}.json";
}
function readStubSettings($type) {
    $path = getStubPath($type);
    if (is_file($path)) {
        $json = file_get_contents($path);
        $data = json_decode($json, true);
        if (is_array($data)) { return $data; }
    }
    return null;
}
function flattenAppearanceData($data) {
    $flat = getDefaultAppearanceSettings();
    $flat['logo'] = $data['logo'] ?? $flat['logo'];
    $flat['background_type'] = $data['background_type'] ?? $flat['background_type'];
    $flat['background_value'] = $data['background_value'] ?? $flat['background_value'];
    $flat['header_title_text'] = $data['header']['title_text'] ?? $flat['header_title_text'];
    $flat['header_background_color'] = $data['header']['background_color'] ?? $flat['header_background_color'];
    $flat['header_title_color'] = $data['header']['title_color'] ?? $flat['header_title_color'];
    $flat['header_title_font_family'] = $data['header']['title_font_family'] ?? $flat['header_title_font_family'];
    $flat['menu_background_color'] = $data['menu']['background_color'] ?? $flat['menu_background_color'];
    $flat['menu_text_color'] = $data['menu']['text_color'] ?? $flat['menu_text_color'];
    $flat['menu_title_color'] = $data['menu']['title_color'] ?? $flat['menu_title_color'];
    $flat['menu_font_size'] = $data['menu']['font_size'] ?? $flat['menu_font_size'];
    $flat['menu_font_family'] = $data['menu']['font_family'] ?? $flat['menu_font_family'];
    $flat['footer_logo'] = $data['footer']['logo'] ?? $flat['footer_logo'];
    $flat['footer_background_color'] = $data['footer']['background_color'] ?? $flat['footer_background_color'];
    $flat['footer_text_color'] = $data['footer']['text_color'] ?? $flat['footer_text_color'];
    $flat['footer_title_color'] = $data['footer']['title_color'] ?? $flat['footer_title_color'];
    $flat['footer_font_family'] = $data['footer']['font_family'] ?? $flat['footer_font_family'];
    $flat['footer_description_text'] = $data['footer']['description_text'] ?? $flat['footer_description_text'];
    $flat['footer_copyright_text'] = $data['footer']['copyright_text'] ?? $flat['footer_copyright_text'];
    $flat['footer_show_links'] = $data['footer']['show_links'] ?? $flat['footer_show_links'];
    $flat['footer_show_social'] = $data['footer']['show_social'] ?? $flat['footer_show_social'];
    $flat['footer_show_newsletter'] = $data['footer']['show_newsletter'] ?? $flat['footer_show_newsletter'];
    return $flat;
}
function writeStubSettings($type, $data) {
    $dir = getStubDir();
    if (!is_dir($dir)) { @mkdir($dir, 0777, true); }
    $payload = $data;
    if ($type === 'appearance') { $payload = flattenAppearanceData($data); }
    if ($type === 'general') { $payload = array_merge(getDefaultGeneralSettings(), $data); }
    if ($type === 'email') { $payload = array_merge(getDefaultEmailSettings(), $data); }
    if ($type === 'slider') { $payload = array_merge(getDefaultSliderSettings(), $data); }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return file_put_contents(getStubPath($type), $json) !== false;
}

/**
 * Mettre à jour les paramètres
 */
function handleUpdateSettings($db, $stubMode = false) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['type'])) {
            jsonResponse(['error' => 'Données invalides'], 400);
            return;
        }
        
        $type = $input['type'];
        $data = $input['data'] ?? [];
        
        // Si pas de DB et stubMode actif, persister en fichier et répondre OK
        if (!$db && $stubMode) {
            writeStubSettings($type, $data);
            if ($type === 'appearance') { @header('Cache-Control: no-store, no-cache, must-revalidate'); }
            jsonResponse(['success' => true, 'message' => 'Paramètres (stub) mis à jour avec succès', 'meta' => ['stub' => true]]);
            return;
        }
        
        switch ($type) {
            case 'general':
                updateGeneralSettings($db, $data);
                break;
            case 'appearance':
                updateAppearanceSettings($db, $data);
                break;
            case 'email':
                updateEmailSettings($db, $data);
                break;
            case 'slider':
                updateSliderSettings($db, $data);
                break;
            default:
                jsonResponse(['error' => 'Type de paramètres invalide'], 400);
                return;
        }
        
        if ($type === 'appearance') { @header('Cache-Control: no-store, no-cache, must-revalidate'); }
        jsonResponse(['success' => true, 'message' => 'Paramètres mis à jour avec succès']);
        
    } catch (Exception $e) {
        logError("Erreur lors de la mise à jour des paramètres: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la mise à jour'], 500);
    }
}

/**
 * Mettre à jour les paramètres généraux
 */
function updateGeneralSettings($db, $data) {
    $sql = "INSERT INTO settings (id, restaurant_name, address, phone, email, opening_hours, description, website_url, facebook_url, instagram_url, twitter_url) 
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            restaurant_name = VALUES(restaurant_name),
            address = VALUES(address),
            phone = VALUES(phone),
            email = VALUES(email),
            opening_hours = VALUES(opening_hours),
            description = VALUES(description),
            website_url = VALUES(website_url),
            facebook_url = VALUES(facebook_url),
            instagram_url = VALUES(instagram_url),
            twitter_url = VALUES(twitter_url),
            updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['restaurant_name'] ?? 'AGRIA ROUEN',
        $data['address'] ?? '',
        $data['phone'] ?? '',
        $data['email'] ?? '',
        $data['opening_hours'] ?? '',
        $data['description'] ?? '',
        $data['website_url'] ?? null,
        $data['facebook_url'] ?? null,
        $data['instagram_url'] ?? null,
        $data['twitter_url'] ?? null
    ]);
}

/**
 * Mettre à jour les paramètres d'apparence
 */
function updateAppearanceSettings($db, $data) {
    // Auto-créer la table si absente (environnement de prod incomplet)
    try {
        $stmtCheck = $db->query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appearance_settings' LIMIT 1");
        $exists = (bool)$stmtCheck->fetch();
        if (!$exists) {
            $db->exec("CREATE TABLE IF NOT EXISTS appearance_settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                logo TEXT NULL,
                background_type ENUM('color', 'image') DEFAULT 'color',
                background_value TEXT NULL,
                header_title_text VARCHAR(255) NULL,
                header_background_color VARCHAR(7) DEFAULT '#ffffff',
                header_title_color VARCHAR(7) DEFAULT '#000000',
                header_title_font_family VARCHAR(100) DEFAULT 'Arial',
                menu_background_color VARCHAR(7) DEFAULT '#ffffff',
                menu_text_color VARCHAR(7) DEFAULT '#000000',
                menu_title_color VARCHAR(7) DEFAULT '#000000',
                menu_font_size VARCHAR(20) DEFAULT '16px',
                menu_font_family VARCHAR(100) DEFAULT 'Arial',
                footer_logo TEXT NULL,
                footer_background_color VARCHAR(7) DEFAULT '#f8f9fa',
                footer_text_color VARCHAR(7) DEFAULT '#6c757d',
                footer_title_color VARCHAR(7) DEFAULT '#343a40',
                footer_font_family VARCHAR(100) DEFAULT 'Arial',
                footer_description_text TEXT NULL,
                footer_copyright_text VARCHAR(255) NULL,
                footer_show_links BOOLEAN DEFAULT TRUE,
                footer_show_social BOOLEAN DEFAULT TRUE,
                footer_show_newsletter BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        }
    } catch (Exception $e) {
        // Continuer, l'INSERT échouera proprement si la table manque
        logError('Auto-create appearance_settings failed', ['error' => $e->getMessage()]);
    }
    $sql = "INSERT INTO appearance_settings (
                id, logo, background_type, background_value,
                header_title_text, header_background_color, header_title_color, header_title_font_family,
                menu_background_color, menu_text_color, menu_title_color, menu_font_size, menu_font_family,
                footer_logo, footer_background_color, footer_text_color, footer_title_color, footer_font_family,
                footer_description_text, footer_copyright_text, footer_show_links, footer_show_social, footer_show_newsletter
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            logo = VALUES(logo),
            background_type = VALUES(background_type),
            background_value = VALUES(background_value),
            header_title_text = VALUES(header_title_text),
            header_background_color = VALUES(header_background_color),
            header_title_color = VALUES(header_title_color),
            header_title_font_family = VALUES(header_title_font_family),
            menu_background_color = VALUES(menu_background_color),
            menu_text_color = VALUES(menu_text_color),
            menu_title_color = VALUES(menu_title_color),
            menu_font_size = VALUES(menu_font_size),
            menu_font_family = VALUES(menu_font_family),
            footer_logo = VALUES(footer_logo),
            footer_background_color = VALUES(footer_background_color),
            footer_text_color = VALUES(footer_text_color),
            footer_title_color = VALUES(footer_title_color),
            footer_font_family = VALUES(footer_font_family),
            footer_description_text = VALUES(footer_description_text),
            footer_copyright_text = VALUES(footer_copyright_text),
            footer_show_links = VALUES(footer_show_links),
            footer_show_social = VALUES(footer_show_social),
            footer_show_newsletter = VALUES(footer_show_newsletter),
            updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['logo'] ?? null,
        $data['background_type'] ?? 'color',
        $data['background_value'] ?? '#ffffff',
        $data['header']['title_text'] ?? 'AGRIA ROUEN',
        $data['header']['background_color'] ?? '#ffffff',
        $data['header']['title_color'] ?? '#000000',
        $data['header']['title_font_family'] ?? 'Arial',
        $data['menu']['background_color'] ?? '#ffffff',
        $data['menu']['text_color'] ?? '#000000',
        $data['menu']['title_color'] ?? '#000000',
        $data['menu']['font_size'] ?? '16px',
        $data['menu']['font_family'] ?? 'Arial',
        $data['footer']['logo'] ?? null,
        $data['footer']['background_color'] ?? '#f8f9fa',
        $data['footer']['text_color'] ?? '#6c757d',
        $data['footer']['title_color'] ?? '#343a40',
        $data['footer']['font_family'] ?? 'Arial',
        $data['footer']['description_text'] ?? '',
        $data['footer']['copyright_text'] ?? '',
        $data['footer']['show_links'] ?? true,
        $data['footer']['show_social'] ?? true,
        $data['footer']['show_newsletter'] ?? true
    ]);
}

/**
 * Mettre à jour les paramètres email
 */
function updateEmailSettings($db, $data) {
    $sql = "INSERT INTO email_settings (
                id, provider, from_name, from_email, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, api_key, api_domain, is_active
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            provider = VALUES(provider),
            from_name = VALUES(from_name),
            from_email = VALUES(from_email),
            smtp_host = VALUES(smtp_host),
            smtp_port = VALUES(smtp_port),
            smtp_user = VALUES(smtp_user),
            smtp_pass = VALUES(smtp_pass),
            smtp_secure = VALUES(smtp_secure),
            api_key = VALUES(api_key),
            api_domain = VALUES(api_domain),
            is_active = VALUES(is_active),
            updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['provider'] ?? 'smtp',
        $data['from_name'] ?? 'AGRIA ROUEN',
        $data['from_email'] ?? '',
        $data['smtp_host'] ?? null,
        $data['smtp_port'] ?? 587,
        $data['smtp_user'] ?? null,
        $data['smtp_pass'] ?? null,
        $data['smtp_secure'] ?? true,
        $data['api_key'] ?? null,
        $data['api_domain'] ?? null,
        $data['is_active'] ?? true
    ]);
}

/**
 * Mettre à jour les paramètres du slider
 */
function updateSliderSettings($db, $data) {
    $sql = "INSERT INTO slider_settings (
                id,
                title_text, title_color, title_font, title_size,
                subtitle_text, subtitle_color, subtitle_font, subtitle_size,
                autoplay, autoplay_delay, show_navigation, show_pagination
            ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            title_text = VALUES(title_text),
            title_color = VALUES(title_color),
            title_font = VALUES(title_font),
            title_size = VALUES(title_size),
            subtitle_text = VALUES(subtitle_text),
            subtitle_color = VALUES(subtitle_color),
            subtitle_font = VALUES(subtitle_font),
            subtitle_size = VALUES(subtitle_size),
            autoplay = VALUES(autoplay),
            autoplay_delay = VALUES(autoplay_delay),
            show_navigation = VALUES(show_navigation),
            show_pagination = VALUES(show_pagination),
            updated_at = CURRENT_TIMESTAMP";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['title_text'] ?? 'Nos Services',
        $data['title_color'] ?? '#000000',
        $data['title_font'] ?? 'Arial',
        $data['title_size'] ?? '2rem',
        $data['subtitle_text'] ?? 'Découvrez notre offre',
        $data['subtitle_color'] ?? '#666666',
        $data['subtitle_font'] ?? 'Arial',
        $data['subtitle_size'] ?? '1rem',
        $data['autoplay'] ?? true,
        $data['autoplay_delay'] ?? 5000,
        $data['show_navigation'] ?? true,
        $data['show_pagination'] ?? true
    ]);
}

/**
 * Paramètres par défaut
 */
function getDefaultGeneralSettings() {
    return [
        'restaurant_name' => 'AGRIA ROUEN',
        'address' => '',
        'phone' => '',
        'email' => '',
        'opening_hours' => '',
        'description' => '',
        'website_url' => null,
        'facebook_url' => null,
        'instagram_url' => null,
        'twitter_url' => null
    ];
}

function getDefaultAppearanceSettings() {
    return [
        'logo' => null,
        'background_type' => 'color',
        'background_value' => '#ffffff',
        'header_title_text' => 'AGRIA ROUEN',
        'header_background_color' => '#ffffff',
        'header_title_color' => '#000000',
        'header_title_font_family' => 'Arial',
        'menu_background_color' => '#ffffff',
        'menu_text_color' => '#000000',
        'menu_title_color' => '#000000',
        'menu_font_size' => '16px',
        'menu_font_family' => 'Arial',
        'footer_logo' => null,
        'footer_background_color' => '#f8f9fa',
        'footer_text_color' => '#6c757d',
        'footer_title_color' => '#343a40',
        'footer_font_family' => 'Arial',
        'footer_description_text' => '',
        'footer_copyright_text' => '',
        'footer_show_links' => true,
        'footer_show_social' => true,
        'footer_show_newsletter' => true
    ];
}

function getDefaultEmailSettings() {
    return [
        'provider' => 'smtp',
        'from_name' => 'AGRIA ROUEN',
        'from_email' => '',
        'smtp_host' => null,
        'smtp_port' => 587,
        'smtp_user' => null,
        'smtp_pass' => null,
        'smtp_secure' => true,
        'api_key' => null,
        'api_domain' => null,
        'is_active' => true
    ];
}

function getDefaultSliderSettings() {
    return [
        'title_text' => 'Nos Services',
        'title_color' => '#000000',
        'title_font' => 'Arial',
        'title_size' => '2rem',
        'subtitle_text' => 'Découvrez notre offre',
        'subtitle_color' => '#666666',
        'subtitle_font' => 'Arial',
        'subtitle_size' => '1rem',
        'autoplay' => true,
        'autoplay_delay' => 5000,
        'show_navigation' => true,
        'show_pagination' => true
    ];
}
?>