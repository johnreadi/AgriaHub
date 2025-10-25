<?php
// auth.php - VERSION COMPLÈTE CORRIGÉE
require_once __DIR__ . '/config.php';

// Activation maximum du débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Headers CORS étendus
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Debug, *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Log de début de requête
error_log("=== AUTH.PHP DÉBUT REQUÊTE ===");
error_log("Méthode: " . ($_SERVER['REQUEST_METHOD'] ?? 'INCONNU'));
error_log("URI: " . ($_SERVER['REQUEST_URI'] ?? 'INCONNU'));
error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'NON DÉFINI'));

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    error_log("✅ Requête OPTIONS traitée");
    exit(0);
}

// Connexion DB avec debug
error_log("🔌 Tentative de connexion DB...");
try {
    $database = new Database();
    $db = $database->getConnection();
    $GLOBALS['db'] = $db;
    error_log("✅ Connexion DB RÉUSSIE");
} catch (Throwable $e) {
    error_log("❌ ERREUR CONNEXION DB: " . $e->getMessage());
    $GLOBALS['db_init_error'] = $e->getMessage();
    $db = null;
    
    // Réponse d'erreur détaillée
    http_response_code(503);
    echo json_encode([
        'error' => 'Base de données indisponible',
        'debug' => [
            'error_message' => $e->getMessage(),
            'host' => DB_HOST,
            'database' => DB_NAME,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

error_log("📥 Méthode: $method, URI: $request_uri");

// Déterminer l'action avec debug
$action = isset($_GET['action']) ? $_GET['action'] : null;
if (!$action) {
    $pathOnly = trim(parse_url($request_uri, PHP_URL_PATH), '/');
    error_log("🔍 Recherche action dans path: $pathOnly");
    
    if (preg_match('#(?:^|/)auth/(.+)$#', $pathOnly, $m)) {
        $action = trim($m[1], '/');
    } elseif (preg_match('#api/auth/(.+)$#', $pathOnly, $m)) {
        $action = trim($m[1], '/');
    } else {
        $body = getRequestData();
        if (isset($body['action'])) { 
            $action = $body['action']; 
        }
    }
}

$action = $action ? strtolower(trim($action)) : null;
error_log("🎯 Action déterminée: " . ($action ?: 'AUCUNE'));

// Log des données reçues
error_log("📦 Données reçues:");
error_log(" - GET: " . json_encode($_GET));
error_log(" - POST: " . json_encode($_POST));
$input = file_get_contents('php://input');
error_log(" - INPUT: " . $input);

switch ($method) {
    case 'POST':
        error_log("🔄 Traitement POST pour action: $action");
        if ($action === 'login') {
            login($db);
        } elseif ($action === 'register') {
            register($db);
        } elseif ($action === 'logout') {
            logout();
        } elseif ($action === 'refresh') {
            refreshToken($db);
        } elseif ($action === 'forgot-password') {
            forgotPassword($db);
        } elseif ($action === 'reset-password') {
            resetPassword($db);
        } else {
            error_log("❌ Action POST non reconnue: $action");
            jsonResponse(['error' => 'Endpoint non trouvé', 'debug_action' => $action], 404);
        }
        break;
    
    case 'GET':
        error_log("🔄 Traitement GET pour action: $action");
        if ($action === 'me') {
            getCurrentUser($db);
        } elseif ($action === 'csrf-token') {
            getCsrfToken();
        } elseif ($action === 'ping-db') {
            pingDb($db);
        } else {
            error_log("❌ Action GET non reconnue: $action");
            jsonResponse(['error' => 'Endpoint non trouvé', 'debug_action' => $action], 404);
        }
        break;
    
    default:
        error_log("❌ Méthode non autorisée: $method");
        jsonResponse(['error' => 'Méthode non autorisée', 'debug_method' => $method], 405);
}

function login($db) {
    error_log("=== DÉBUT FONCTION LOGIN ===");
    
    // Récupération RAW des données
    $input = file_get_contents('php://input');
    error_log("📥 Input brut: " . $input);
    
    $data = json_decode($input, true);
    if (!$data || json_last_error() !== JSON_ERROR_NONE) {
        error_log("❌ Erreur JSON: " . json_last_error_msg());
        $data = $_POST;
        error_log("📥 Fallback POST: " . json_encode($data));
    }
    
    error_log("📊 Données parsées: " . json_encode($data, JSON_PRETTY_PRINT));
    
    // Extraction ULTRA-DÉBOGAGE des identifiants
    $identifier = '';
    $password = '';
    
    error_log("🔍 Recherche identifiant dans:");
    foreach ($data as $key => $value) {
        error_log("   - $key: " . (is_string($value) ? $value : json_encode($value)));
        
        if (in_array($key, ['email', 'username', 'identifier', 'login']) && !empty($value)) {
            $identifier = trim($value);
            error_log("✅ Identifiant trouvé dans '$key': $identifier");
            break;
        }
    }
    
    error_log("🔍 Recherche mot de passe dans:");
    foreach ($data as $key => $value) {
        if (in_array($key, ['password', 'pass', 'pwd', 'motdepasse']) && !empty($value)) {
            $password = $value;
            error_log("✅ Mot de passe trouvé dans '$key': " . str_repeat('*', strlen($password)));
            break;
        }
    }
    
    error_log("🎯 Identifiants extraits:");
    error_log("   - Identifier: '$identifier'");
    error_log("   - Password: '" . str_repeat('*', strlen($password)) . "' (longueur: " . strlen($password) . ")");

    // Validation
    if (empty($identifier)) {
        error_log("❌ Identifiant manquant");
        jsonResponse([
            'error' => 'Identifiant manquant',
            'debug' => [
                'data_received' => $data,
                'keys_available' => array_keys($data),
                'input_raw' => $input
            ]
        ], 400);
    }
    
    if (empty($password)) {
        error_log("❌ Mot de passe manquant");
        jsonResponse([
            'error' => 'Mot de passe manquant', 
            'debug' => [
                'data_received' => $data,
                'identifier_found' => $identifier
            ]
        ], 400);
    }

    try {
        error_log("🔍 Recherche en base pour: '$identifier'");
        
        // Recherche par email (sélection sans colonnes actives pour éviter erreurs 42S22)
        $query = "SELECT id, email, password, first_name, last_name, role, phone, card_number, balance, is_verified, last_login_at, created_at FROM users WHERE email = :identifier LIMIT 1";
        
        error_log("📝 Requête email: $query");
        $stmt = $db->prepare($query);
        $stmt->bindValue(':identifier', $identifier);
        $stmt->execute();
        $user = $stmt->fetch();
        
        if ($user) {
            error_log("✅ Utilisateur trouvé par EMAIL:");
            error_log("   - ID: " . $user['id']);
            error_log("   - Email: " . $user['email']);
            if (isset($user['active'])) { error_log("   - Actif: " . ($user['active'] ? 'OUI' : 'NON')); }
            error_log("   - Password hash: " . substr($user['password'], 0, 20) . "...");
        } else {
            error_log("❌ Utilisateur non trouvé par email, recherche par username...");
            
            // Recherche par username (sélection sans colonnes actives)
            $query = "SELECT id, email, password, first_name, last_name, role, phone, card_number, balance, is_verified, last_login_at, created_at FROM users WHERE username = :identifier LIMIT 1";
            
            error_log("📝 Requête username: $query");
            $stmt = $db->prepare($query);
            $stmt->bindValue(':identifier', $identifier);
            $stmt->execute();
            $user = $stmt->fetch();
            
            if ($user) {
                error_log("✅ Utilisateur trouvé par USERNAME:");
                error_log("   - ID: " . $user['id']);
                error_log("   - Email: " . $user['email']);
            } else {
                error_log("❌ Utilisateur NON TROUVÉ avec l'identifiant: '$identifier'");
                
                // Lister les utilisateurs disponibles pour debug
                $allUsers = $db->query("SELECT email, username FROM users LIMIT 5")->fetchAll();
                error_log("👥 Utilisateurs disponibles: " . json_encode($allUsers));
                
                jsonResponse([
                    'error' => 'Identifiants incorrects',
                    'debug' => [
                        'identifier_used' => $identifier,
                        'available_users' => $allUsers,
                        'search_method' => 'email/username'
                    ]
                ], 401);
            }
        }

        // Vérification statut utilisateur (robuste selon colonnes réellement présentes)
        $isActive = ((isset($user['is_active']) && (int)$user['is_active'] === 1) || (isset($user['active']) && (int)$user['active'] === 1));
        error_log("🔍 Statut utilisateur: " . ($isActive ? 'ACTIF' : 'INACTIF'));
        
        if (!$isActive) {
            error_log("❌ Utilisateur INACTIF - Connexion refusée");
            jsonResponse([
                'error' => 'Compte utilisateur désactivé',
                'debug' => [
                    'user_id' => $user['id'],
                    'is_active' => $user['is_active'] ?? null,
                    'active' => $user['active'] ?? null
                ]
            ], 403);
        }

        // VÉRIFICATION MOT DE PASSE ULTRA-DÉBOGAGE
        error_log("🔐 Vérification mot de passe...");
        error_log("   - Password fourni: " . str_repeat('*', strlen($password)));
        error_log("   - Hash en base: " . substr($user['password'], 0, 30) . "...");
        
        $passwordValid = false;
        $passwordMethod = 'inconnu';
        
        // Test Bcrypt
        if (sec_verifyPassword($password, $user['password'])) {
            $passwordValid = true;
            $passwordMethod = 'bcrypt';
            error_log("✅ Mot de passe VALIDE (Bcrypt)");
        } 
        // Test MD5
        elseif ($user['password'] === md5($password)) {
            $passwordValid = true;
            $passwordMethod = 'md5';
            error_log("✅ Mot de passe VALIDE (MD5) - Migration nécessaire");
            
            // Migration automatique
            $newHash = sec_hashPassword($password);
            $db->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$newHash, $user['id']]);
            error_log("🔄 Mot de passe migré vers Bcrypt");
        }
        // Test SHA1
        elseif ($user['password'] === sha1($password)) {
            $passwordValid = true;
            $passwordMethod = 'sha1';
            error_log("✅ Mot de passe VALIDE (SHA1) - Migration nécessaire");
            
            // Migration automatique
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $db->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$newHash, $user['id']]);
        }
        // Test en clair
        elseif ($user['password'] === $password) {
            $passwordValid = true;
            $passwordMethod = 'plain';
            error_log("✅ Mot de passe VALIDE (Plain) - MIGRATION URGENTE");
            
            // Migration automatique
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $db->prepare("UPDATE users SET password = ? WHERE id = ?")->execute([$newHash, $user['id']]);
        }
        // Test autres hash
        else {
            error_log("❌ Aucune méthode de hash ne correspond");
            error_log("   - MD5 fourni: " . md5($password));
            error_log("   - SHA1 fourni: " . sha1($password));
        }

        if (!$passwordValid) {
            error_log("❌ MOT DE PASSE INVALIDE - Méthode testée: $passwordMethod");
            jsonResponse([
                'error' => 'Mot de passe incorrect',
                'debug' => [
                    'user_found' => true,
                    'user_id' => $user['id'],
                    'password_method_tested' => $passwordMethod,
                    'hash_begin' => substr($user['password'], 0, 20)
                ]
            ], 401);
        }

        // CONNEXION RÉUSSIE
        error_log("🎉 CONNEXION RÉUSSIE - User ID: " . $user['id']);
        
        // Mettre à jour dernière connexion (CORRIGÉ : last_login_at au lieu de last_login)
        try {
            $updateQuery = "UPDATE users SET last_login_at = NOW() WHERE id = :id";
            $updateStmt = $db->prepare($updateQuery);
            $updateStmt->bindValue(':id', $user['id']);
            $updateStmt->execute();
            error_log("📅 Dernière connexion mise à jour");
        } catch (Exception $e) {
            error_log("⚠️ Erreur mise à jour last_login_at: " . $e->getMessage());
        }

        // Générer le token JWT
        $payload = [
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'] ?? 'user',
            'exp' => time() + (24 * 60 * 60)
        ];

        $accessToken = sec_generateJWT($payload);
        error_log("🔑 Token JWT généré");
        
        // Préparer la réponse COMPLÈTE (corrigée avec tous les champs)
        $userResponse = [
            'id' => $user['id'],
            'email' => $user['email'],
            'firstName' => $user['first_name'] ?? '',
            'lastName' => $user['last_name'] ?? '',
            'role' => $user['role'] ?? 'user',
            'phone' => $user['phone'] ?? '',
            'cardNumber' => $user['card_number'] ?? '',
            'cardBalance' => floatval($user['balance'] ?? 0),
            'isVerified' => boolval($user['is_verified'] ?? false),
            'isActive' => $isActive,
            'lastLogin' => $user['last_login_at'] ?? null,
            'createdAt' => $user['created_at'] ?? null
        ];
        
        error_log("📤 Envoi réponse de succès");
        jsonResponse([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => $userResponse,
            'access_token' => $accessToken,
            'debug' => [
                'password_method' => $passwordMethod,
                'user_id' => $user['id'],
                'source' => 'mysql',
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ]);

    } catch (Exception $e) {
        error_log("💥 ERREUR CRITIQUE dans login: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        
        jsonResponse([
            'error' => 'Erreur serveur lors de la connexion',
            'debug' => [
                'error_message' => $e->getMessage(),
                'identifier' => $identifier,
                'timestamp' => date('Y-m-d H:i:s')
            ]
        ], 500);
    }
}

function getCurrentUser($db) {
    error_log("=== DÉBUT GET CURRENT USER ===");
    
    // Récupérer le token d'authentification
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    error_log("🔑 Header Authorization: " . $authHeader);
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
        error_log("❌ Token manquant ou mal formaté");
        jsonResponse(['error' => 'Token d\'authentification manquant'], 401);
    }
    
    $token = $matches[1];
    error_log("🔍 Token reçu: " . substr($token, 0, 20) . "...");
    
    try {
        // Vérifier le token JWT
        $payload = sec_verifyJWT($token);
        if (!$payload) {
            error_log("❌ Token JWT invalide");
            jsonResponse(['error' => 'Token invalide'], 401);
        }
        
        error_log("📄 Payload décodé: " . json_encode($payload));
        
        if (!isset($payload['user_id'])) {
            error_log("❌ Payload invalide - user_id manquant");
            jsonResponse(['error' => 'Token invalide'], 401);
        }
        
        $userId = $payload['user_id'];
        error_log("🔍 Recherche user ID: $userId");
        
        // Récupérer l'utilisateur COMPLET avec clause d'activité dynamique
        $hasActive = function_exists('dbColumnExists') ? dbColumnExists($db, 'active') : false;
        $hasIsActive = function_exists('dbColumnExists') ? dbColumnExists($db, 'is_active') : false;
        // Sélection sans colonnes actives pour éviter erreurs 42S22; la clause WHERE n'impose pas d'activité si la colonne est absente
        $query = "SELECT id, email, first_name, last_name, phone, card_number, 
                         balance, role, is_verified, last_login_at, created_at
                  FROM users 
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch();
        
        if (!$user) {
            error_log("❌ Utilisateur non trouvé ou inactif");
            jsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        error_log("✅ Utilisateur trouvé: " . $user['email']);
        
        // Calculer isActive de façon sûre (par défaut actif si colonnes absentes)
        $isActive = true;
        if (isset($user['is_active'])) { $isActive = ((int)$user['is_active'] === 1); }
        elseif (isset($user['active'])) { $isActive = ((int)$user['active'] === 1); }
        
        // Préparer la réponse COMPLÈTE
        $userResponse = [
            'id' => $user['id'],
            'email' => $user['email'],
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'phone' => $user['phone'],
            'cardNumber' => $user['card_number'],
            'cardBalance' => floatval($user['balance']),
            'role' => $user['role'],
            'isVerified' => boolval($user['is_verified']),
            'isActive' => $isActive,
            'lastLogin' => $user['last_login_at'],
            'createdAt' => $user['created_at']
        ];
        
        jsonResponse([
            'success' => true,
            'user' => $userResponse
        ]);
        
    } catch (Exception $e) {
        error_log("💥 Erreur getCurrentUser: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur serveur'], 500);
    }
}

function refreshToken($db) {
    error_log("=== DÉBUT REFRESH TOKEN ===");
    
    $data = getRequestData();
    $refreshToken = $data['refresh_token'] ?? null;
    
    if (empty($refreshToken)) {
        error_log("❌ Refresh token manquant");
        jsonResponse(['error' => 'Refresh token manquant'], 400);
    }
    
    try {
        // Vérifier le refresh token dans la base
        $query = "SELECT rt.user_id, u.email, u.role 
                  FROM refresh_tokens rt 
                  JOIN users u ON rt.user_id = u.id 
                  WHERE rt.token = :token AND rt.expires_at > NOW() AND rt.revoked = 0";
        
        $stmt = $db->prepare($query);
        $stmt->bindValue(':token', $refreshToken);
        $stmt->execute();
        $tokenData = $stmt->fetch();
        
        if (!$tokenData) {
            error_log("❌ Refresh token invalide ou expiré");
            jsonResponse(['error' => 'Refresh token invalide'], 401);
        }
        
        // Générer nouveau access token
        $payload = [
            'user_id' => $tokenData['user_id'],
            'email' => $tokenData['email'],
            'role' => $tokenData['role'],
            'exp' => time() + (24 * 60 * 60)
        ];
        
        $newAccessToken = sec_generateJWT($payload);
        
        error_log("✅ Nouveau token généré pour user: " . $tokenData['email']);
        
        jsonResponse([
            'success' => true,
            'access_token' => $newAccessToken
        ]);
        
    } catch (Exception $e) {
        error_log("💥 Erreur refreshToken: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur serveur'], 500);
    }
}

if (!function_exists('getRequestData')) {
function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    error_log("📨 getRequestData - Content-Type: $contentType");
    
    $input = file_get_contents('php://input');
    error_log("📨 Input length: " . strlen($input));
    
    // JSON
    if (stripos($contentType, 'application/json') !== false) {
        $data = json_decode($input, true);
        if (is_array($data)) {
            error_log("✅ Données JSON parsées");
            return $data;
        }
    }
    
    // POST standard
    if (!empty($_POST)) {
        error_log("✅ Données POST utilisées");
        return $_POST;
    }
    
    // Fallback: parser l'input
    if (!empty($input)) {
        parse_str($input, $formData);
        if (!empty($formData)) {
            error_log("✅ Données parsées depuis input");
            return $formData;
        }
    }
    
    error_log("❌ Aucune donnée trouvée");
    return [];
}
}

if (!function_exists('jsonResponse')) {
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    
    error_log("📤 Envoi réponse HTTP $statusCode: " . json_encode($data));
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit();
}
}

// Fonctions de sécurité améliorées
if (!function_exists('sec_generateJWT')) {
    function sec_generateJWT($payload, $secret = null) {
        $secret = $secret ?: (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret_change_in_production');
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $now = time();
        if (!isset($payload['iat'])) $payload['iat'] = $now;
        if (!isset($payload['exp'])) $payload['exp'] = $now + (24 * 60 * 60);
        
        $segments = [
            base64url_encode(json_encode($header)),
            base64url_encode(json_encode($payload))
        ];
        
        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, $secret, true);
        $segments[] = base64url_encode($signature);
        
        return implode('.', $segments);
    }
}

if (!function_exists('sec_verifyJWT')) {
    function sec_verifyJWT($token, $secret = null) {
        $secret = $secret ?: (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret_change_in_production');
        
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($header64, $payload64, $signature64) = $parts;
        
        // Corriger le décodage pour JWT (utilise base64url)
        $header = json_decode(base64url_decode($header64), true);
        $payload = json_decode(base64url_decode($payload64), true);
        $signature = base64url_decode($signature64);
        
        if (!$header || !$payload) {
            return false;
        }
        
        // Vérifier l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        // Vérifier la signature
        $signingInput = $header64 . '.' . $payload64;
        $expectedSignature = hash_hmac('sha256', $signingInput, $secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        return $payload;
    }
}

if (!function_exists('base64url_encode')) {
    function base64url_encode($data) { 
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); 
    }
}

// Fonctions simplifiées pour les autres endpoints
function register($db) {
    jsonResponse(['error' => 'Registration disabled in debug mode'], 503);
}

function logout() {
    jsonResponse(['success' => true, 'message' => 'Déconnexion réussie (debug)']);
}

function forgotPassword($db) {
    jsonResponse(['error' => 'Password reset disabled in debug mode'], 503);
}

function resetPassword($db) {
    jsonResponse(['error' => 'Password reset disabled in debug mode'], 503);
}

function getCsrfToken() {
    jsonResponse(['csrf_token' => 'debug-csrf-token']);
}

function pingDb($db) {
    try {
        // Test simple de la base de données
        $stmt = $db->query("SELECT COUNT(*) as user_count FROM users");
        $result = $stmt->fetch();
        
        jsonResponse([
            'ok' => true, 
            'message' => 'DB connected and responsive',
            'debug' => [
                'timestamp' => date('Y-m-d H:i:s'),
                'user_count' => $result['user_count']
            ]
        ]);
    } catch (Exception $e) {
        jsonResponse([
            'ok' => false,
            'error' => 'DB test failed',
            'debug' => ['error' => $e->getMessage()]
        ], 500);
    }
}

error_log("=== AUTH.PHP FIN ===\n");
?>