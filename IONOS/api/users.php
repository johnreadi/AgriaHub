<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Extraire le chemin après /api/users/
$path = str_replace('/api/users/', '', parse_url($request_uri, PHP_URL_PATH));
// Support direct script access (/api/users.php) et override via ?path=... ou ?action=...
$pathOnly = trim(parse_url($request_uri, PHP_URL_PATH), '/');
if (preg_match('#api/users\.php$#', $pathOnly)) { $path = ''; }
if (isset($_GET['path']) && is_string($_GET['path'])) { $path = $_GET['path']; }
elseif (isset($_GET['action']) && is_string($_GET['action'])) { $path = $_GET['action']; }
$path = is_string($path) ? trim($path, '/') : '';
$path_parts = $path !== '' ? explode('/', $path) : [];

// Vérifier l'authentification pour toutes les routes (robuste même si getallheaders n'existe pas)
// Lecture du token de manière robuste (Authorization, X-Access-Token, cookies, query)
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

// Activer le mode debug via querystring ou en-tête, même sans getallheaders
$hDebug = $headers['X-Debug'] ?? $headers['x-debug'] ?? ($_SERVER['HTTP_X_DEBUG'] ?? null);
$debug = (isset($_GET['debug']) && $_GET['debug'] == '1') || ($hDebug === '1');
$user_data = validateToken($token);

if (!$user_data) {
    jsonResponse(['error' => 'Token invalide'], 401);
}

switch ($method) {
    case 'GET':
        if (empty($path) || $path === '') {
            getAllUsers($db, $user_data);
        } elseif ($path_parts[0] === 'profile') {
            getUserProfile($db, $user_data);
        } elseif (is_numeric($path_parts[0])) {
            getUserById($db, $path_parts[0], $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'PUT':
        if ($path_parts[0] === 'profile') {
            updateProfile($db, $user_data);
        } elseif (is_numeric($path_parts[0])) {
            updateUser($db, $path_parts[0], $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'POST':
        if ($path === 'recharge') {
            rechargeCard($db, $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'DELETE':
        if (is_numeric($path_parts[0])) {
            deleteUser($db, $path_parts[0], $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

function getAllUsers($db, $user_data) {
    global $debug;
    // Seuls les admins peuvent voir tous les utilisateurs
    if ($user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "SELECT id, email, first_name, last_name, phone, card_number, balance, role, created_at 
                  FROM users ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse(['users' => $users]);
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function getUserById($db, $user_id, $user_data) {
    global $debug;
    // Les utilisateurs ne peuvent voir que leur propre profil, les admins peuvent voir tous les profils
    if ($user_data['role'] !== 'admin' && $user_data['user_id'] != $user_id) {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "SELECT id, email, first_name, last_name, phone, card_number, balance, role, created_at 
                  FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            jsonResponse(['user' => $user]);
        } else {
            jsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function getUserProfile($db, $user_data) {
    global $debug;
    try {
        $query = "SELECT id, email, first_name, last_name, phone, card_number, balance, role, created_at 
                  FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_data['user_id']);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            jsonResponse(['user' => $user]);
        } else {
            jsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function updateProfile($db, $user_data) {
    global $debug;
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $fields = [];
        $params = [':user_id' => $user_data['user_id']];
        
        if (isset($data['first_name'])) {
            $fields[] = "first_name = :first_name";
            $params[':first_name'] = $data['first_name'];
        }
        
        if (isset($data['last_name'])) {
            $fields[] = "last_name = :last_name";
            $params[':last_name'] = $data['last_name'];
        }
        
        if (isset($data['phone'])) {
            $fields[] = "phone = :phone";
            $params[':phone'] = $data['phone'];
        }
        
        if (isset($data['email'])) {
            // Vérifier si l'email n'est pas déjà utilisé
            $check_query = "SELECT id FROM users WHERE email = :email AND id != :user_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(':email', $data['email']);
            $check_stmt->bindParam(':user_id', $user_data['user_id']);
            $check_stmt->execute();
            
            if ($check_stmt->fetch()) {
                jsonResponse(['error' => 'Cet email est déjà utilisé'], 409);
            }
            
            $fields[] = "email = :email";
            $params[':email'] = $data['email'];
        }
        
        if (empty($fields)) {
            jsonResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
        }
        
        $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            jsonResponse(['success' => true, 'message' => 'Profil mis à jour avec succès']);
        } else {
            jsonResponse(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function updateUser($db, $user_id, $user_data) {
    global $debug;
    // Seuls les admins peuvent modifier les autres utilisateurs
    if ($user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $fields = [];
        $params = [':user_id' => $user_id];
        
        $allowed_fields = ['first_name', 'last_name', 'phone', 'email', 'role', 'balance'];
        
        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            jsonResponse(['error' => 'Aucune donnée à mettre à jour'], 400);
        }
        
        $query = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :user_id";
        $stmt = $db->prepare($query);
        
        if ($stmt->execute($params)) {
            jsonResponse(['success' => true, 'message' => 'Utilisateur mis à jour avec succès']);
        } else {
            jsonResponse(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function rechargeCard($db, $user_data) {
    global $debug;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['amount']) || $data['amount'] <= 0) {
        jsonResponse(['error' => 'Montant invalide'], 400);
    }
    
    try {
        $query = "UPDATE users SET balance = balance + :amount WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':amount', $data['amount']);
        $stmt->bindParam(':user_id', $user_data['user_id']);
        
        if ($stmt->execute()) {
            // Enregistrer l'activité
            try {
                $activity_query = "INSERT INTO activities (user_id, type, description, amount) 
                                  VALUES (:user_id, 'recharge', 'Rechargement de carte', :amount)";
                $activity_stmt = $db->prepare($activity_query);
                $activity_stmt->bindParam(':user_id', $user_data['user_id']);
                $activity_stmt->bindParam(':amount', $data['amount']);
                $activity_stmt->execute();
            } catch (PDOException $inner) {
                // Ne pas bloquer la recharge si la table/colonnes ne correspondent pas
                logError('activities insert failed', ['error' => $inner->getMessage()]);
                if ($debug) {
                    // Surface l'erreur en contexte debug sans bloquer
                    jsonResponse(['success' => true, 'message' => 'Carte rechargée avec succès', 'log_warning' => 'activities insert failed', 'details' => $inner->getMessage()]);
                    return;
                }
            }
            
            jsonResponse(['success' => true, 'message' => 'Carte rechargée avec succès']);
        } else {
            jsonResponse(['error' => 'Erreur lors du rechargement'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function deleteUser($db, $user_id, $user_data) {
    global $debug;
    // Seuls les admins peuvent supprimer des utilisateurs
    if ($user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "DELETE FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Utilisateur supprimé avec succès']);
        } else {
            jsonResponse(['error' => 'Erreur lors de la suppression'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}
?>