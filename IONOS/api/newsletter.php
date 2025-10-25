<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$headers = function_exists('getallheaders') ? getallheaders() : [];
$hDebug = $headers['X-Debug'] ?? $headers['x-debug'] ?? ($_SERVER['HTTP_X_DEBUG'] ?? null);
$debug = (isset($_GET['debug']) && $_GET['debug'] == '1') || ($hDebug === '1');

// Helper: obtenir un token de manière robuste
function newsletter_get_token() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authHeader = null;
    if (isset($headers['Authorization'])) { $authHeader = $headers['Authorization']; }
    elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) { $authHeader = $_SERVER['HTTP_AUTHORIZATION']; }
    elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) { $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION']; }
    $token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;
    if (!$token) {
        $xToken = $headers['X-Access-Token'] ?? $headers['x-access-token'] ?? null;
        if ($xToken && is_string($xToken) && $xToken !== '') { $token = trim($xToken); }
    }
    if (!$token) {
        if (isset($_COOKIE['AGRIA_TOKEN']) && is_string($_COOKIE['AGRIA_TOKEN']) && $_COOKIE['AGRIA_TOKEN'] !== '') { $token = trim($_COOKIE['AGRIA_TOKEN']); }
        elseif (isset($_COOKIE['auth_token']) && is_string($_COOKIE['auth_token']) && $_COOKIE['auth_token'] !== '') { $token = trim($_COOKIE['auth_token']); }
    }
    if (!$token) {
        $qs = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
        if ($qs) { parse_str($qs, $qsa); foreach (['access_token','token'] as $k) { if (isset($qsa[$k]) && is_string($qsa[$k]) && $qsa[$k] !== '') { $token = trim($qsa[$k]); break; } } }
    }
    return $token;
}

// Extraire le chemin après /api/newsletter/
$path = str_replace('/api/newsletter/', '', parse_url($request_uri, PHP_URL_PATH));
// Support direct script access (/api/newsletter.php) et override via ?path=... ou ?action=...
$pathOnly = trim(parse_url($request_uri, PHP_URL_PATH), '/');
if (preg_match('#api/newsletter\\.php$#', $pathOnly)) { $path = ''; }
if (isset($_GET['path']) && is_string($_GET['path'])) { $path = $_GET['path']; }
elseif (isset($_GET['action']) && is_string($_GET['action'])) { $path = $_GET['action']; }
$path = is_string($path) ? trim($path, '/') : '';
$path_parts = $path !== '' ? explode('/', $path) : [];

switch ($method) {
    case 'POST':
        if ($path === 'subscribe') {
            subscribe($db);
        } elseif ($path === 'campaigns') {
            createCampaign($db);
        } elseif ($path_parts[0] === 'campaigns' && isset($path_parts[1]) && $path_parts[2] === 'send') {
            sendCampaign($db, $path_parts[1]);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'GET':
        if ($path === 'subscribers') {
            getSubscribers($db);
        } elseif ($path === 'campaigns') {
            getCampaigns($db);
        } elseif ($path_parts[0] === 'campaigns' && isset($path_parts[1]) && $path_parts[2] === 'stats') {
            getCampaignStats($db, $path_parts[1]);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'DELETE':
        if ($path_parts[0] === 'unsubscribe') {
            unsubscribe($db);
        } elseif ($path_parts[0] === 'campaigns' && isset($path_parts[1])) {
            deleteCampaign($db, $path_parts[1]);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

function subscribe($db) {
    global $debug;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        jsonResponse(['error' => 'Email invalide'], 400);
    }
    
    try {
        // Vérifier si l'email est déjà abonné
        $check_query = "SELECT id FROM newsletter_subscribers WHERE email = :email";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':email', $data['email']);
        $check_stmt->execute();
        
        if ($check_stmt->fetch()) {
            jsonResponse(['error' => 'Cet email est déjà abonné'], 409);
        }
        
        // Ajouter l'abonné (adapter au schéma: first_name, last_name)
        $firstName = null;
        $lastName = null;
        if (!empty($data['name'])) {
            $parts = preg_split('/\s+/', trim($data['name']));
            if ($parts && count($parts) > 0) {
                $firstName = $parts[0];
                if (count($parts) > 1) {
                    $lastName = implode(' ', array_slice($parts, 1));
                }
            }
        }

        $query = "INSERT INTO newsletter_subscribers (email, first_name, last_name, subscribed_at) VALUES (:email, :first_name, :last_name, NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data['email']);
        $stmt->bindParam(':first_name', $firstName);
        $stmt->bindParam(':last_name', $lastName);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Abonnement réussi']);
        } else {
            jsonResponse(['error' => 'Erreur lors de l\'abonnement'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function unsubscribe($db) {
    global $debug;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['email'])) {
        jsonResponse(['error' => 'Email requis'], 400);
    }
    
    try {
        $query = "DELETE FROM newsletter_subscribers WHERE email = :email";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':email', $data['email']);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            jsonResponse(['success' => true, 'message' => 'Désabonnement réussi']);
        } else {
            jsonResponse(['error' => 'Email non trouvé'], 404);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function getSubscribers($db) {
    global $debug;
    // Vérifier l'authentification admin
    $token = newsletter_get_token();
    $user_data = validateToken($token);
    
    if (!$user_data || $user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "SELECT id, email, first_name, last_name, CONCAT_WS(' ', first_name, last_name) AS name, subscribed_at FROM newsletter_subscribers ORDER BY subscribed_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $subscribers = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['subscribers' => $subscribers]);
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function createCampaign($db) {
    global $debug;
    // Vérifier l'authentification admin
    $token = newsletter_get_token();
    $user_data = validateToken($token);
    
    if (!$user_data || $user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['subject']) || !isset($data['content'])) {
        jsonResponse(['error' => 'Sujet et contenu requis'], 400);
    }
    
    try {
        // Le schéma exige un champ 'name' non nul; utiliser fourni ou fallback sur le sujet.
        $name = isset($data['name']) && trim($data['name']) !== '' ? trim($data['name']) : substr(trim($data['subject']), 0, 200);

        $query = "INSERT INTO newsletter_campaigns (name, subject, content, created_by, created_at) 
                  VALUES (:name, :subject, :content, :created_by, NOW())";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':subject', $data['subject']);
        $stmt->bindParam(':content', $data['content']);
        $stmt->bindParam(':created_by', $user_data['user_id']);
        
        if ($stmt->execute()) {
            $campaign_id = $db->lastInsertId();
            jsonResponse(['success' => true, 'campaign_id' => $campaign_id, 'message' => 'Campagne créée avec succès'], 201);
        } else {
            jsonResponse(['error' => 'Erreur lors de la création de la campagne'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function getCampaigns($db) {
    global $debug;
    // Vérifier l'authentification admin
    $token = newsletter_get_token();
    $user_data = validateToken($token);
    
    if (!$user_data || $user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "SELECT c.*, u.first_name, u.last_name 
                  FROM newsletter_campaigns c 
                  LEFT JOIN users u ON c.created_by = u.id 
                  ORDER BY c.created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $campaigns = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['campaigns' => $campaigns]);
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function sendCampaign($db, $campaign_id) {
    // Vérifier l'authentification admin
    $token = newsletter_get_token();
    $user_data = validateToken($token);
    
    if (!$user_data || $user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        // Récupérer la campagne
        $campaign_query = "SELECT * FROM newsletter_campaigns WHERE id = :campaign_id";
        $campaign_stmt = $db->prepare($campaign_query);
        $campaign_stmt->bindParam(':campaign_id', $campaign_id);
        $campaign_stmt->execute();
        
        $campaign = $campaign_stmt->fetch(PDO::FETCH_ASSOC);
        if (!$campaign) {
            jsonResponse(['error' => 'Campagne non trouvée'], 404);
        }
        
        // Récupérer tous les abonnés
        $subscribers_query = "SELECT email FROM newsletter_subscribers";
        $subscribers_stmt = $db->prepare($subscribers_query);
        $subscribers_stmt->execute();
        
        $subscribers = $subscribers_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $sent_count = 0;
        $failed_count = 0;
        
        // Simuler l'envoi d'emails (en production, utilisez un service d'email)
        foreach ($subscribers as $subscriber) {
            // Ici, vous intégreriez un service d'email comme SendGrid, Mailgun, etc.
            // Pour la démo, on simule un envoi réussi
            $sent_count++;
            
            // Enregistrer l'envoi
            $log_query = "INSERT INTO newsletter_sends (campaign_id, email, sent_at) 
                         VALUES (:campaign_id, :email, NOW())";
            $log_stmt = $db->prepare($log_query);
            $log_stmt->bindParam(':campaign_id', $campaign_id);
            $log_stmt->bindParam(':email', $subscriber['email']);
            $log_stmt->execute();
        }
        
        // Mettre à jour le statut de la campagne
        $update_query = "UPDATE newsletter_campaigns SET sent_at = NOW(), sent_count = :sent_count WHERE id = :campaign_id";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(':sent_count', $sent_count);
        $update_stmt->bindParam(':campaign_id', $campaign_id);
        $update_stmt->execute();
        
        jsonResponse([
            'success' => true,
            'message' => 'Campagne envoyée avec succès',
            'sent_count' => $sent_count,
            'failed_count' => $failed_count
        ]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

function getCampaignStats($db, $campaign_id) {
    // Vérifier l'authentification admin
    $token = newsletter_get_token();
    $user_data = validateToken($token);
    
    if (!$user_data || $user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "SELECT 
                    COUNT(*) as total_sent,
                    COUNT(CASE WHEN opened_at IS NOT NULL THEN 1 END) as opened_count,
                    COUNT(CASE WHEN clicked_at IS NOT NULL THEN 1 END) as clicked_count
                  FROM newsletter_sends 
                  WHERE campaign_id = :campaign_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':campaign_id', $campaign_id);
        $stmt->execute();
        
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        $stats['open_rate'] = $stats['total_sent'] > 0 ? ($stats['opened_count'] / $stats['total_sent']) * 100 : 0;
        $stats['click_rate'] = $stats['total_sent'] > 0 ? ($stats['clicked_count'] / $stats['total_sent']) * 100 : 0;
        
        jsonResponse(['stats' => $stats]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

function deleteCampaign($db, $campaign_id) {
    // Vérifier l'authentification admin
    $token = newsletter_get_token();
    $user_data = validateToken($token);
    
    if (!$user_data || $user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "DELETE FROM newsletter_campaigns WHERE id = :campaign_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':campaign_id', $campaign_id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            jsonResponse(['success' => true, 'message' => 'Campagne supprimée avec succès']);
        } else {
            jsonResponse(['error' => 'Campagne non trouvée'], 404);
        }
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}
?>