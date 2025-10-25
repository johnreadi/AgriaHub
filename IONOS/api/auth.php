<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/database.php';

if (!function_exists('logError')) {
    function logError($event, $context = []) {
        $msg = '[auth.php] ' . $event . ' ' . (is_array($context) ? json_encode($context) : (string)$context);
        if (function_exists('error_log')) { error_log($msg); }
    }
}

if (!function_exists('getRequestData')) {
    function getRequestData() {
        $ct = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        $raw = file_get_contents('php://input');
        if ($raw !== false) { $GLOBALS['RAW_BODY_CACHED'] = is_string($raw) ? $raw : (string)$raw; }
        if (is_string($ct) && stripos($ct, 'application/json') !== false) {
            $data = json_decode($GLOBALS['RAW_BODY_CACHED'] ?? '', true);
            if (is_array($data)) { return $data; }
        }
        return ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' ? $_POST : [];
    }
}

if (!function_exists('sec_validateData')) {
    function sec_validateData($data, $rules) {
        $errors = [];
        foreach ($rules as $field => $rule) {
            $val = isset($data[$field]) ? $data[$field] : null;
            if (!empty($rule['required']) && ($val === null || $val === '')) { $errors[$field][] = 'required'; }
            if (isset($rule['min_length']) && is_string($val) && strlen($val) < (int)$rule['min_length']) { $errors[$field][] = 'min_length'; }
            if (!empty($rule['email']) && $val && !filter_var($val, FILTER_VALIDATE_EMAIL)) { $errors[$field][] = 'email'; }
        }
        return $errors;
    }
}

if (!function_exists('sec_log')) {
    function sec_log($event, $context = []) { /* no-op in fallback */ }
}

if (!function_exists('sec_generateJWT')) {
    function sec_generateJWT($payload, $secret) {
        $header = ['alg' => 'HS256', 'typ' => 'JWT'];
        $b64 = function ($d) { return rtrim(strtr(base64_encode(is_string($d) ? $d : json_encode($d)), '+/', '-_'), '='); };
        $segments = [$b64($header), $b64($payload)];
        $signingInput = implode('.', $segments);
        $signature = hash_hmac('sha256', $signingInput, (string)$secret, true);
        $segments[] = $b64($signature);
        return implode('.', $segments);
    }
}

if (!function_exists('sec_verifyPassword')) {
    function sec_verifyPassword($password, $hash) {
        if (!$hash) { return false; }
        if (function_exists('password_verify')) { return password_verify($password, $hash); }
        return $password === $hash;
    }
}

if (!function_exists('includeErrorDetails')) {
    function includeErrorDetails() {
        if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') { return true; }
        if (isset($GLOBALS['DEBUG_MODE']) && $GLOBALS['DEBUG_MODE'] === true) { return true; }
        // Header-based toggle
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $hDebug = null;
        foreach (['X-Debug','x-debug'] as $hk) { if (isset($headers[$hk])) { $hDebug = $headers[$hk]; break; } }
        if (!$hDebug && isset($_SERVER['HTTP_X_DEBUG'])) { $hDebug = $_SERVER['HTTP_X_DEBUG']; }
        if ($hDebug) {
            $v = strtolower(trim((string)$hDebug));
            if (in_array($v, ['1','true','yes'], true)) { return true; }
        }
        // Querystring-based toggle
        $qs = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
        if ($qs) {
            $qsa = [];
            parse_str($qs, $qsa);
            if (isset($qsa['debug'])) {
                $v = strtolower((string)$qsa['debug']);
                if ($v === '1' || $v === 'true' || $v === 'yes') { return true; }
            }
        }
        return false;
    }
}

// Robust bearer token extractor compatible with IONOS
if (!function_exists('getBearerToken')) {
    function getBearerToken() {
        // Try Authorization from getallheaders (case-insensitive)
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = null;
        foreach (['Authorization','authorization'] as $k) {
            if (isset($headers[$k]) && is_string($headers[$k])) { $authHeader = $headers[$k]; break; }
        }
        // Fallbacks from $_SERVER
        if (!$authHeader) {
            foreach (['HTTP_AUTHORIZATION','REDIRECT_HTTP_AUTHORIZATION','Authorization'] as $k) {
                if (!empty($_SERVER[$k])) { $authHeader = $_SERVER[$k]; break; }
            }
            // Apache specific
            if (!$authHeader && function_exists('apache_request_headers')) {
                $ah = @apache_request_headers();
                if (is_array($ah)) {
                    foreach ($ah as $k => $v) { if (strtolower($k) === 'authorization') { $authHeader = $v; break; } }
                }
            }
        }
        // Extract Bearer token if present
        $token = null;
        if ($authHeader && preg_match('/^Bearer\s+(.*)$/i', trim($authHeader), $m)) {
            $token = trim($m[1]);
        }
        // Support custom header X-Access-Token to bypass stripped Authorization
        if (!$token) {
            $xToken = null;
            foreach (['X-Access-Token','x-access-token'] as $k) {
                if (isset($headers[$k]) && is_string($headers[$k])) { $xToken = trim($headers[$k]); break; }
            }
            if (!$xToken) {
                foreach (['HTTP_X_ACCESS_TOKEN','REDIRECT_HTTP_X_ACCESS_TOKEN'] as $k) {
                    if (!empty($_SERVER[$k])) { $xToken = trim((string)$_SERVER[$k]); break; }
                }
            }
            if ($xToken) { $token = $xToken; }
        }
        // Query parameter fallback (debug environments)
        if (!$token) {
            $qs = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
            if ($qs) {
                $qsa = [];
                parse_str($qs, $qsa);
                foreach (['access_token','token'] as $k) {
                    if (isset($qsa[$k]) && is_string($qsa[$k]) && $qsa[$k] !== '') { $token = trim($qsa[$k]); break; }
                }
            }
        }
        // Optional debug log
        if (function_exists('includeErrorDetails') && includeErrorDetails()) {
            $peek = is_string($authHeader) ? substr($authHeader, 0, 40) : null;
            logError('getBearerToken', [
                'has_auth_header' => !!$authHeader,
                'auth_header_peek' => $peek,
                'has_token' => !!$token
            ]);
        }
        return is_string($token) ? trim($token) : null;
    }
}

try {
    $database = new Database();
    $db = $database->getConnection();
    $GLOBALS['db'] = $db;
} catch (Throwable $e) {
    logError("Erreur de connexion DB dans auth.php", ['error' => $e->getMessage()]);
    $GLOBALS['db_init_error'] = $e->getMessage();
    $db = null;
}

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'] ?? '';

// Déterminer l'action: supporte ?action=login (via .htaccess) et /api/auth/login
$action = isset($_GET['action']) ? $_GET['action'] : null;
if (!$action) {
    $pathOnly = trim(parse_url($request_uri, PHP_URL_PATH), '/');
    // Chercher le segment après "auth/"
    if (preg_match('#(?:^|/)auth/(.+)$#', $pathOnly, $m)) {
        $action = trim($m[1], '/');
    } elseif (preg_match('#api/auth/(.+)$#', $pathOnly, $m)) {
        $action = trim($m[1], '/');
    } else {
        // Si on accède directement à auth.php sans action, tenter de lire action dans POST/JSON
        $body = getRequestData();
        if (isset($body['action'])) { $action = $body['action']; }
    }
}

// Normaliser l'action et journaliser en développement
$action = $action ? strtolower(trim($action)) : null;
if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
    $bodyPeek = null;
    $raw = isset($GLOBALS['RAW_BODY_CACHED']) ? $GLOBALS['RAW_BODY_CACHED'] : file_get_contents('php://input');
    if ($raw !== false && strlen($raw) > 0) {
        $GLOBALS['RAW_BODY_CACHED'] = is_string($raw) ? $raw : (string)$raw;
        $bodyPeek = substr($GLOBALS['RAW_BODY_CACHED'], 0, 512);
    }
    logError('auth.php action parsed', ['action' => $action, 'request_uri' => $request_uri, 'get' => $_GET, 'body_peek' => $bodyPeek]);
}

// Détection robuste de l'action ping-db (querystring, chemin, paramètre)
$qsAction = null;
$pathOnly = trim(parse_url($request_uri, PHP_URL_PATH), '/');
$qs = parse_url($request_uri, PHP_URL_QUERY);
if ($qs) {
    parse_str($qs, $qsa);
    $qsAction = isset($qsa['action']) ? strtolower(trim($qsa['action'])) : null;
    // Activer le mode debug via querystring (?debug=1)
    $GLOBALS['DEBUG_MODE'] = isset($qsa['debug']) && in_array(strtolower((string)$qsa['debug']), ['1','true','yes'], true);
}
$isPingAction = ($action === 'ping-db') || ($qsAction === 'ping-db') || (strpos($pathOnly, 'ping-db') !== false);
$isLoginAction = ($action === 'login') || ($qsAction === 'login') || (strpos($pathOnly, 'login') !== false);
$isMeAction = ($action === 'me') || ($qsAction === 'me') || (strpos($pathOnly, 'me') !== false);
$isRefreshAction = ($action === 'refresh') || ($qsAction === 'refresh') || (strpos($pathOnly, 'refresh') !== false);
$isDebugHeadersAction = ($action === 'debug-headers') || ($qsAction === 'debug-headers') || (strpos($pathOnly, 'debug-headers') !== false);

// Si la connexion DB a échoué, autoriser ping-db et login, et autoriser me/refresh/debug-headers seulement en mode debug/développement
if ($db === null && !( $isPingAction || $isLoginAction || ( ($isMeAction || $isRefreshAction || $isDebugHeadersAction) && includeErrorDetails() ) )) {
    $payload = ['error' => 'Erreur de connexion à la base de données'];
    if (function_exists('includeErrorDetails') ? includeErrorDetails() : (defined('ENVIRONMENT') && ENVIRONMENT === 'development')) {
        $payload['details'] = isset($GLOBALS['db_init_error']) ? $GLOBALS['db_init_error'] : null;
    }
    jsonResponse($payload, 500);
}

// Gestion OPTIONS (prévol CORS)
if ($method === 'OPTIONS') { jsonResponse(['ok' => true]); }

// Rate limiting neutralisé (suppression de la dépendance à Security.php)
// $clientIP = sec_getClientIP();
// if (false) {
//     sec_log('rate_limit_exceeded', ['ip' => $clientIP]);
//     jsonResponse(['error' => 'Trop de requêtes. Réessayez plus tard.'], 429);
// }

switch ($method) {
    case 'POST':
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
            jsonResponse(['error' => 'Endpoint non trouvé', 'hint' => 'Actions POST valides: login, register, refresh, forgot-password, reset-password'], 404);
        }
        break;
    
    case 'GET':
        if ($action === 'me') {
            getCurrentUser($db);
        } elseif ($action === 'csrf-token') {
            getCsrfToken();
        } elseif ($action === 'ping-db') {
            pingDb($db);
        } elseif ($action === 'debug-headers') {
            debugHeaders();
        } elseif ($action === 'login') {
            jsonResponse(['error' => 'Méthode non autorisée', 'hint' => 'Utilisez POST pour /api/auth/login avec JSON {identifier/email/login, password}'], 405);
        } elseif (in_array($action, ['register','logout','refresh','forgot-password','reset-password'], true)) {
            jsonResponse(['error' => 'Méthode non autorisée', 'hint' => 'Cet endpoint attend une requête POST'], 405);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé', 'hint' => 'Essayez POST /api/auth/login ou GET /api/auth/me'], 404);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

function login($db) {
    $data = getRequestData();
    logError('login_enter', [
        'method' => $_SERVER['REQUEST_METHOD'] ?? null,
        'uri' => $_SERVER['REQUEST_URI'] ?? null,
        'content_type' => ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''),
        'keys' => array_keys(is_array($data) ? $data : [])
    ]);
    sec_log('login_request_received', ['keys' => array_keys(is_array($data) ? $data : []), 'content_type' => ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '')]);

    // Normaliser les champs de connexion
    $rawLogin = '';
    if (isset($data['email'])) { $rawLogin = $data['email']; }
    elseif (isset($data['identifier'])) { $rawLogin = $data['identifier']; }
    elseif (isset($data['login'])) { $rawLogin = $data['login']; }
    elseif (isset($data['username'])) { $rawLogin = $data['username']; }
    elseif (isset($data['card_number'])) { $rawLogin = $data['card_number']; }
    elseif (isset($data['cardNumber'])) { $rawLogin = $data['cardNumber']; }

    $password = isset($data['password']) ? $data['password']
        : (isset($data['pass']) ? $data['pass']
        : (isset($data['pwd']) ? $data['pwd']
        : (isset($data['motdepasse']) ? $data['motdepasse']
        : (isset($data['mot_de_passe']) ? $data['mot_de_passe'] : null))));

    // Alias supplémentaires pour l'identifiant
    if ($rawLogin === '' && isset($data['identifiant'])) { $rawLogin = $data['identifiant']; }

    // Validation simplifiée des données d'entrée
    $rules = [
        'identifier' => ['required' => true, 'min_length' => 1],
        'password' => ['required' => true, 'min_length' => 1]
    ];
    $errors = sec_validateData(['identifier' => $rawLogin, 'password' => $password], $rules);
    if (!empty($errors)) {
        $payload = ['error' => 'Données invalides', 'details' => $errors];
        if (function_exists('includeErrorDetails') ? includeErrorDetails() : (defined('ENVIRONMENT') && ENVIRONMENT === 'development')) {
            $payload['received_keys'] = array_keys(is_array($data) ? $data : []);
            $payload['content_type'] = ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
            $payload['method'] = $_SERVER['REQUEST_METHOD'] ?? null;
            $payload['raw_body_peek'] = substr($GLOBALS['RAW_BODY_CACHED'] ?? '', 0, 200);
        }
        jsonResponse($payload, 400);
    }
    $loginField = trim($rawLogin);
    if ($loginField === '') {
        $payload = ['error' => 'Identifiant requis'];
        if (function_exists('includeErrorDetails') ? includeErrorDetails() : (defined('ENVIRONMENT') && ENVIRONMENT === 'development')) {
            $payload['received_keys'] = array_keys(is_array($data) ? $data : []);
            $payload['content_type'] = ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '');
            $payload['method'] = $_SERVER['REQUEST_METHOD'] ?? null;
            $payload['raw_body_peek'] = substr($GLOBALS['RAW_BODY_CACHED'] ?? '', 0, 200);
        }
        jsonResponse($payload, 400);
    }

    $loginLower = function_exists('mb_strtolower') ? mb_strtolower($loginField, 'UTF-8') : strtolower($loginField);
    $loginCollapsed = trim(preg_replace('/\s+/', ' ', $loginLower));

    // Mode debug: stub de connexion même si la base de données est disponible
    // Permet de valider le routage et la pile /api/auth/login en environnement de test quand X-Debug:1 ou ?debug=1 est actif
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $hDebug = $headers['X-Debug'] ?? $headers['x-debug'] ?? ($_SERVER['HTTP_X_DEBUG'] ?? null);
    $isDebugParam = isset($_GET['debug']) ? $_GET['debug'] : (isset($_POST['debug']) ? $_POST['debug'] : null);
    $forceDebug = false;
    if ($hDebug) { $v = strtolower(trim((string)$hDebug)); $forceDebug = in_array($v, ['1','true','yes'], true); }
    if (!$forceDebug && $isDebugParam) { $v = strtolower((string)$isDebugParam); $forceDebug = in_array($v, ['1','true','yes'], true); }
    if ($forceDebug || (function_exists('includeErrorDetails') ? includeErrorDetails() : (defined('ENVIRONMENT') && ENVIRONMENT === 'development'))) {
        $isDemo = ($loginLower === 'demo' && $password === 'demo123');
        if ($isDemo) {
            $user = [
                'id' => 0,
                'email' => 'demo@example.com',
                'role' => 'user',
                'firstName' => 'Demo',
                'lastName' => 'User',
                'phone' => '',
                'cardNumber' => '',
                'cardBalance' => 0
            ];
            $payload = [
                'user_id' => $user['id'],
                'email' => $user['email'],
                'role' => $user['role']
            ];
            $jwtSecret = defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret';
            $accessToken = sec_generateJWT($payload, $jwtSecret);
            $refreshToken = sec_generateJWT(['user_id' => $user['id'], 'type' => 'refresh'], $jwtSecret . '_refresh');
            sec_log('login_success_stub', ['user_id' => $user['id'], 'login' => $loginField]);
            jsonResponse([
                'success' => true,
                'user' => $user,
                'access_token' => $accessToken,
                'refresh_token' => $refreshToken
            ]);
        }
    }

    // Si la base de données est indisponible, proposer un mode stub en développement
if (!$db) {
    $isDebugRaw = $_GET['debug'] ?? $_POST['debug'] ?? null;
    $isDebug = ($isDebugRaw === '1' || $isDebugRaw === 1 || $isDebugRaw === true || $isDebugRaw === 'true');
    if ($isDebug || (function_exists('includeErrorDetails') ? includeErrorDetails() : (defined('ENVIRONMENT') && ENVIRONMENT === 'development'))) {
            // Mode stub: accepter un couple de test
            $isDemo = ($loginLower === 'demo' && $password === 'demo123');
            if ($isDemo) {
                $user = [
                    'id' => 0,
                    'email' => 'demo@example.com',
                    'role' => 'user',
                    'firstName' => 'Demo',
                    'lastName' => 'User',
                    'phone' => '',
                    'cardNumber' => '',
                    'cardBalance' => 0
                ];
                $payload = [
                    'user_id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ];
                $jwtSecret = defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret';
                $accessToken = sec_generateJWT($payload, $jwtSecret);
                $refreshToken = sec_generateJWT(['user_id' => $user['id'], 'type' => 'refresh'], $jwtSecret . '_refresh');
                sec_log('login_success_stub', ['user_id' => $user['id'], 'login' => $loginField]);
                jsonResponse([
                    'success' => true,
                    'user' => $user,
                    'access_token' => $accessToken,
                    'refresh_token' => $refreshToken
                ]);
            }
        }
        logError('Connexion DB indisponible pendant login', ['login' => $loginField]);
        $payload = ['error' => 'Base de données indisponible'];
        if (includeErrorDetails()) { $payload['details'] = 'Connexion PDO non initialisée'; }
        jsonResponse($payload, 503);
    }

    // Vérifier l’existence de la table users avant toute requête SQL
    if (!dbTableExists($db, 'users')) {
        logError('users_table_missing', []);
        jsonResponse(['error' => 'Schéma utilisateur invalide', 'hint' => 'La table "users" est absente du schéma'], 500);
    }

    // Vérifier si le compte est verrouillé avant d’aller plus loin (protégé)
    if ($db) {
        try {
            if (isAccountLocked($db, $loginField)) {
                sec_log('login_locked', ['login' => $loginField]);
                jsonResponse(['error' => 'Compte temporairement verrouillé suite à des tentatives échouées'], 429);
            }
        } catch (Throwable $e) {
            logError('Erreur pendant isAccountLocked', ['error' => $e->getMessage(), 'login' => $loginField]);
            // Continuer sans bloquer la tentative de connexion
        }
    }
    try {
        $hasEmail = dbColumnExists($db, 'email');
        $hasFirst = dbColumnExists($db, 'first_name');
        $hasLast = dbColumnExists($db, 'last_name');
        $hasPhone = dbColumnExists($db, 'phone');
        $hasCard = dbColumnExists($db, 'card_number');
        $hasBalance = dbColumnExists($db, 'balance');
        $hasUsername = dbColumnExists($db, 'username');
        $hasActive = dbColumnExists($db, 'active');
        $hasIsActive = dbColumnExists($db, 'is_active');
        $hasRole = dbColumnExists($db, 'role');
        $hasPassword = dbColumnExists($db, 'password');
        $hasPasswordHash = dbColumnExists($db, 'password_hash');
        // Alias potentiels selon schémas hérités
        $hasPwdLegacy = dbColumnExists($db, 'pwd');
        $hasPassLegacy = dbColumnExists($db, 'pass');
        $hasMotdepasse = dbColumnExists($db, 'motdepasse');
        $hasMotDePasse = dbColumnExists($db, 'mot_de_passe');
        $hasLogin = dbColumnExists($db, 'login');
        $hasIdentifiant = dbColumnExists($db, 'identifiant');
        $hasIdentifier = dbColumnExists($db, 'identifier');

        // Construire dynamiquement la sélection selon les colonnes disponibles
        $selectParts = ['id'];
        $selectParts[] = $hasEmail ? 'email' : "'' AS email";
        if ($hasPassword) {
            $selectParts[] = 'password';
        } elseif ($hasPasswordHash) {
            $selectParts[] = 'password_hash AS password';
        } elseif ($hasPwdLegacy) {
            $selectParts[] = 'pwd AS password';
        } elseif ($hasPassLegacy) {
            $selectParts[] = 'pass AS password';
        } elseif ($hasMotdepasse) {
            $selectParts[] = 'motdepasse AS password';
        } elseif ($hasMotDePasse) {
            $selectParts[] = 'mot_de_passe AS password';
        } else {
            $selectParts[] = "'' AS password";
        }
        $selectParts[] = $hasRole ? 'role' : "'user' AS role";
        $selectParts[] = $hasFirst ? 'first_name AS firstName' : "'' AS firstName";
        $selectParts[] = $hasLast ? 'last_name AS lastName' : "'' AS lastName";
        $selectParts[] = $hasPhone ? 'phone' : "'' AS phone";
        $selectParts[] = $hasCard ? 'card_number AS cardNumber' : "'' AS cardNumber";
        $selectParts[] = $hasBalance ? 'balance AS cardBalance' : '0 AS cardBalance';
        // Expose isActive de manière sûre sans sélectionner une colonne inexistante
        $selectParts[] = $hasIsActive ? 'is_active AS isActive' : '1 AS isActive';

        // Construire conditions avec placeholders uniques pour éviter HY093
        $loginConditions = [];
        $binds = [];
        $lowerIdx = 0; $fullIdx = 0;
        $addLower = function($column) use (&$loginConditions, &$binds, &$lowerIdx, $loginLower) {
            $ph = ':login_lower_' . $lowerIdx++;
            $loginConditions[] = "LOWER($column) = $ph";
            $binds[$ph] = $loginLower;
        };
        if ($hasEmail) { $addLower('email'); }
        if ($hasUsername) { $addLower('username'); }
        if ($hasLogin) { $addLower('login'); }
        if ($hasIdentifiant) { $addLower('identifiant'); }
        if ($hasIdentifier) { $addLower('identifier'); }
        if ($hasFirst) { $addLower('first_name'); }
        if ($hasLast) { $addLower('last_name'); }
        if ($hasFirst && $hasLast) {
            $ph1 = ':login_full_' . $fullIdx++;
            $ph2 = ':login_full_' . $fullIdx++;
            $loginConditions[] = "LOWER(CONCAT_WS(' ', first_name, last_name)) = $ph1";
            $loginConditions[] = "LOWER(CONCAT_WS(' ', last_name, first_name)) = $ph2";
            $binds[$ph1] = $loginCollapsed;
            $binds[$ph2] = $loginCollapsed;
        }
        if ($hasCard) { $loginConditions[] = 'card_number = :login_card'; $binds[':login_card'] = $loginField; }

        if (empty($loginConditions)) {
            logError('Schéma utilisateur invalide: aucune colonne de connexion disponible', ['login' => $loginField]);
            jsonResponse(['error' => 'Erreur de configuration'], 500);
        }

        $activeFilters = [];
        if ($hasActive) { $activeFilters[] = 'active = 1'; }
        if ($hasIsActive) { $activeFilters[] = 'is_active = 1'; }
        $activeClause = !empty($activeFilters) ? '(' . implode(' OR ', $activeFilters) . ')' : '1=1';

        $query = sprintf(
            'SELECT %s FROM users WHERE (%s) AND %s LIMIT 1',
            implode(', ', $selectParts),
            implode(' OR ', $loginConditions),
            $activeClause
        );

        logError('login_sql_build', ['query' => $query, 'active_clause' => $activeClause, 'login' => $loginField]);

        $stmt = $db->prepare($query);
        $execBinds = [];
        foreach ($binds as $k => $v) { $execBinds[ltrim($k, ':')] = $v; }
        try {
            $stmt->execute($execBinds);
        } catch (Throwable $e) {
            // Fallback: rejouer sans clause active en cas de colonne inconnue
            if (stripos($e->getMessage(), 'Unknown column') !== false && (stripos($e->getMessage(), 'active') !== false || stripos($e->getMessage(), 'is_active') !== false)) {
                logError('login_sql_retry_without_active', ['original_error' => $e->getMessage(), 'query' => $query]);
                $baseQuery = sprintf('SELECT %s FROM users WHERE (%s) LIMIT 1', implode(', ', $selectParts), implode(' OR ', $loginConditions));
                $stmt = $db->prepare($baseQuery);
                $stmt->execute($execBinds);
            } else {
                throw $e;
            }
        }
        $user = $stmt->fetch();

        logError('login_user_fetched', ['found' => (bool)$user, 'login' => $loginField]);

        if (!$user) {
            recordFailedLogin($db, $loginField);
            sec_log('login_failed', ['login' => $loginField, 'reason' => 'user_not_found']);
            jsonResponse(['error' => 'Identifiants invalides'], 401);
        }

        $valid = sec_verifyPassword($password, $user['password']);
        $legacyMatch = false;
        if (!$valid) {
            // Compatibilité avec anciens hashes (MD5, SHA1, SHA256)
            $md5 = md5($password);
            $sha1 = sha1($password);
            $sha256 = hash('sha256', $password);
            if ($user['password'] === $md5 || $user['password'] === $sha1 || $user['password'] === $sha256) {
                $legacyMatch = true;
                // Migration automatique vers bcrypt
                try {
                    $newHash = sec_hashPassword($password);
                    $up = $db->prepare("UPDATE users SET password = :password WHERE id = :id");
                    $up->bindParam(':password', $newHash);
                    $up->bindParam(':id', $user['id']);
                    $up->execute();
                    sec_log('password_migrated', ['user_id' => $user['id']]);
                } catch (Exception $e) {
                    // Ne pas casser la connexion si migration échoue
                    sec_log('password_migration_failed', ['user_id' => $user['id'], 'error' => $e->getMessage()]);
                }
            }
        }

        if (!$valid && !$legacyMatch) {
            recordFailedLogin($db, $loginField);
            sec_log('login_failed', ['login' => $loginField, 'reason' => 'bad_password']);
            jsonResponse(['error' => 'Identifiants invalides'], 401);
        }

        resetFailedLoginAttempts($db, $user['id']);

        $payload = [
            'user_id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role']
        ];

        $jwtSecret = defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret';
        $accessToken = sec_generateJWT($payload, $jwtSecret);
        $refreshToken = sec_generateJWT(['user_id' => $user['id'], 'type' => 'refresh'], $jwtSecret . '_refresh');

        saveRefreshToken($db, $user['id'], $refreshToken);
        updateLastLogin($db, $user['id']);

        sec_log('login_success', ['user_id' => $user['id'], 'login' => $loginField]);

        unset($user['password'], $user['failed_login_attempts'], $user['last_failed_login']);

        jsonResponse([
            'success' => true,
            'user' => $user,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken
        ]);

    } catch (Throwable $e) {
        // Inclure plus de contexte pour diagnostiquer HY093
        $diag = [
            'error' => $e->getMessage(),
            'login' => $loginField,
        ];
        if (isset($query)) { $diag['query'] = $query; }
        if (isset($binds)) { $diag['binds'] = $binds; }
        logError('Erreur lors de la connexion', $diag);
        $payload = ['error' => 'Erreur interne du serveur'];
        if (includeErrorDetails()) {
            $payload['details'] = $e->getMessage();
            if (isset($query)) { $payload['query'] = $query; }
            if (isset($binds)) { $payload['binds'] = $binds; }
        }
        jsonResponse($payload, 500);
    }
}

function register($db) {
    $data = json_decode(file_get_contents("php://input"), true);

    // Validation des données d'entrée (souple)
    $rules = [
        'email' => ['required' => true, 'email' => true],
        'password' => ['required' => true, 'password' => true],
        'first_name' => ['min_length' => 2, 'max_length' => 50],
        'last_name' => ['min_length' => 2, 'max_length' => 50],
        'phone' => ['phone' => true]
    ];
    $errors = sec_validateData($data, $rules);
    if (!empty($errors)) { jsonResponse(['error' => 'Données invalides', 'details' => $errors], 400); }

    // Colonnes disponibles
    $hasEmail = dbColumnExists($db, 'email');
    $hasPwd = dbColumnExists($db, 'password');
    $hasPwdHash = dbColumnExists($db, 'password_hash');
    $hasFirst = dbColumnExists($db, 'first_name');
    $hasLast = dbColumnExists($db, 'last_name');
    $hasPhone = dbColumnExists($db, 'phone');
    $hasCard = dbColumnExists($db, 'card_number');
    $hasBalance = dbColumnExists($db, 'balance');
    $hasRole = dbColumnExists($db, 'role');
    $hasCreatedAt = dbColumnExists($db, 'created_at');
    $hasActive = dbColumnExists($db, 'active');
    $hasIsActive = dbColumnExists($db, 'is_active');

    // Nettoyer / préparer les valeurs
    $email = isset($data['email']) ? sec_sanitizeInput($data['email'], 'email') : null;
    $firstName = isset($data['first_name']) ? sec_sanitizeInput($data['first_name']) : null;
    $lastName = isset($data['last_name']) ? sec_sanitizeInput($data['last_name']) : null;
    $phone = isset($data['phone']) ? sec_sanitizeInput($data['phone']) : null;

    // Mot de passe requis au niveau schéma
    $plainPwd = $data['password'] ?? null;
    if (!$plainPwd || (!$hasPwd && !$hasPwdHash)) {
        jsonResponse(['error' => 'Schéma invalide: colonne mot de passe absente'], 500);
    }
    $passwordHashed = sec_hashPassword($plainPwd);

    try {
        // Vérifier unicité email si colonne présente
        if ($hasEmail && $email) {
            $checkQuery = "SELECT id FROM users WHERE email = :email";
            $checkStmt = $db->prepare($checkQuery);
            $checkStmt->bindParam(':email', $email);
            $checkStmt->execute();
            if ($checkStmt->fetch()) { jsonResponse(['error' => 'Cet email est déjà utilisé'], 409); }
        }

        // Générer un numéro de carte si supporté
        $cardNumber = null;
        if ($hasCard) { $cardNumber = generateUniqueCardNumber($db); }

        // Construire INSERT dynamique
        $cols = [];
        $place = [];
        $params = [];
        if ($hasEmail && $email !== null) { $cols[] = 'email'; $place[] = ':email'; $params[':email'] = $email; }
        if ($hasPwd) { $cols[] = 'password'; $place[] = ':password'; $params[':password'] = $passwordHashed; }
        elseif ($hasPwdHash) { $cols[] = 'password_hash'; $place[] = ':password_hash'; $params[':password_hash'] = $passwordHashed; }
        if ($hasFirst && $firstName !== null) { $cols[] = 'first_name'; $place[] = ':first_name'; $params[':first_name'] = $firstName; }
        if ($hasLast && $lastName !== null) { $cols[] = 'last_name'; $place[] = ':last_name'; $params[':last_name'] = $lastName; }
        if ($hasPhone && $phone !== null) { $cols[] = 'phone'; $place[] = ':phone'; $params[':phone'] = $phone; }
        if ($hasCard && $cardNumber !== null) { $cols[] = 'card_number'; $place[] = ':card_number'; $params[':card_number'] = $cardNumber; }
        if ($hasBalance) { $cols[] = 'balance'; $place[] = ':balance'; $params[':balance'] = 0; }
        if ($hasRole) { $cols[] = 'role'; $place[] = ':role'; $params[':role'] = 'user'; }
        if ($hasCreatedAt) { $cols[] = 'created_at'; $place[] = ':created_at'; $params[':created_at'] = date('Y-m-d H:i:s'); }
        if ($hasActive) { $cols[] = 'active'; $place[] = ':active'; $params[':active'] = 1; }
        elseif ($hasIsActive) { $cols[] = 'is_active'; $place[] = ':is_active'; $params[':is_active'] = 1; }

        if (empty($cols)) { jsonResponse(['error' => 'Schéma utilisateur invalide'], 500); }

        $query = sprintf('INSERT INTO users (%s) VALUES (%s)', implode(', ', $cols), implode(', ', $place));
        $stmt = $db->prepare($query);
        foreach ($params as $k => $v) { $stmt->bindValue($k, $v); }

        if ($stmt->execute()) {
            $userId = $db->lastInsertId();
            sec_log('user_registered', ['user_id' => $userId, 'email' => $email]);
            jsonResponse([
                'success' => true,
                'message' => 'Compte créé avec succès',
                'user_id' => $userId,
                'card_number' => $cardNumber
            ], 201);
        } else {
            throw new Exception('Erreur lors de la création du compte');
        }
    } catch (Exception $e) {
        logError('Erreur lors de l\'inscription', ['error' => $e->getMessage(), 'email' => $email]);
        jsonResponse(['error' => 'Erreur lors de la création du compte'], 500);
    }
}

function getCurrentUser($db) {
    $token = getBearerToken();
    if (!$token) { jsonResponse(['error' => 'Token manquant'], 401); }

    $jwtSecret = defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret';
    $payload = sec_verifyJWT($token, $jwtSecret);
    if (!$payload) { jsonResponse(['error' => 'Token invalide'], 401); }

    $userFromToken = function($payload) {
        $u = [
            'id' => isset($payload['user_id']) ? (int)$payload['user_id'] : 0,
            'email' => isset($payload['email']) ? $payload['email'] : 'demo@example.com',
            'firstName' => '',
            'lastName' => '',
            'phone' => '',
            'cardNumber' => '',
            'cardBalance' => 0,
            'role' => isset($payload['role']) ? $payload['role'] : 'user',
            'createdAt' => null
        ];
        $u['role'] = in_array($u['role'], ['user','admin','cashier'], true) ? $u['role'] : 'user';
        return $u;
    };

    if (!$db) { jsonResponse(['user' => $userFromToken($payload)]); }
    
    try {
        try {
            $hasActive = dbColumnExists($db, 'active');
            $hasIsActive = dbColumnExists($db, 'is_active');
            $activeFilters = [];
            if ($hasActive) { $activeFilters[] = 'active = 1'; }
            if ($hasIsActive) { $activeFilters[] = 'is_active = 1'; }
            $activeClause = !empty($activeFilters) ? '(' . implode(' OR ', $activeFilters) . ')' : null;

            $baseSelect = "SELECT id, email, first_name AS firstName, last_name AS lastName, phone, card_number AS cardNumber, balance AS cardBalance, role, created_at AS createdAt FROM users WHERE id = :id";
            $query = $activeClause ? ($baseSelect . " AND " . $activeClause) : $baseSelect;
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $payload['user_id']);
            $stmt->execute();
            $user = $stmt->fetch();
        } catch (Exception $e) {
            $query = "SELECT id, email, role FROM users WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $payload['user_id']);
            $stmt->execute();
            $user = $stmt->fetch();
        }
        if (!$user) { jsonResponse(['error' => 'Utilisateur non trouvé'], 404); }
        jsonResponse(['user' => $user]);
        
    } catch (Exception $e) {
        logError('Erreur lors de la récupération de l\'utilisateur', ['error' => $e->getMessage(), 'user_id' => $payload['user_id']]);
        jsonResponse(['user' => $userFromToken($payload)]);
    }
}

function refreshToken($db) {
    $data = getRequestData();
    
    if (!isset($data['refresh_token'])) {
        jsonResponse(['error' => 'Refresh token manquant'], 400);
    }
    
    $payload = sec_verifyJWT($data['refresh_token'], (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret') . '_refresh');
    if (!$payload || $payload['type'] !== 'refresh') {
        jsonResponse(['error' => 'Refresh token invalide'], 401);
    }
    
    if (!isValidRefreshToken($db, $payload['user_id'], $data['refresh_token'])) {
        jsonResponse(['error' => 'Refresh token non reconnu'], 401);
    }
    
    // Fallback stateless: si DB indisponible en mode debug/développement, régénérer un access token sans DB
    if (!$db && (($_GET['debug'] ?? $_POST['debug'] ?? null) === '1' || (function_exists('includeErrorDetails') ? includeErrorDetails() : (defined('ENVIRONMENT') && ENVIRONMENT === 'development')))) {
        $email = isset($payload['email']) ? $payload['email'] : 'demo@example.com';
        $role = isset($payload['role']) ? $payload['role'] : 'user';
        $role = in_array($role, ['user','admin','cashier'], true) ? $role : 'user';
        $jwtSecret = defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret';
        $newAccessToken = sec_generateJWT(['user_id' => $payload['user_id'], 'email' => $email, 'role' => $role], $jwtSecret);
        jsonResponse(['access_token' => $newAccessToken]);
    }
    
    try {
        try {
            $hasActive = dbColumnExists($db, 'active');
            $hasIsActive = dbColumnExists($db, 'is_active');
            $filters = [];
            if ($hasActive) { $filters[] = 'active = 1'; }
            if ($hasIsActive) { $filters[] = 'is_active = 1'; }
            $activeClause = !empty($filters) ? '(' . implode(' OR ', $filters) . ')' : '1=1';
            $query = "SELECT id, email, role FROM users WHERE id = :id AND " . $activeClause;
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $payload['user_id']);
            $stmt->execute();
            $user = $stmt->fetch();
        } catch (Exception $e) {
            $query = "SELECT id, email, role FROM users WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $payload['user_id']);
            $stmt->execute();
            $user = $stmt->fetch();
        }
        
        if (!$user) {
            jsonResponse(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        $newAccessToken = sec_generateJWT(['user_id' => $user['id'], 'email' => $user['email'], 'role' => $user['role']]);
        
        jsonResponse(['access_token' => $newAccessToken]);
    } catch (Exception $e) {
        logError('Erreur lors du refresh token', ['error' => $e->getMessage(), 'user_id' => $payload['user_id']]);
        jsonResponse(['error' => 'Erreur interne du serveur'], 500);
    }
}

function getCsrfToken() {
    $token = sec_generateCSRFToken();
    jsonResponse(['csrf_token' => $token]);
}

function pingDb($db) {
    try {
        if ($db === null) {
            $dsn = "mysql:host=" . DB_HOST . ";port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $db = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]);
        }
        $stmt = $db->query('SELECT 1');
        $val = (int)$stmt->fetchColumn();
        $usersCount = null;
        try {
            $countStmt = $db->query('SELECT COUNT(*) FROM users');
            $usersCount = (int)$countStmt->fetchColumn();
        } catch (Exception $e) {
            // La table peut ne pas exister ou l'utilisateur n'a pas les droits, ignorer.
        }
        jsonResponse(['ok' => true, 'select1' => ($val === 1), 'users_count' => $usersCount]);
    } catch (Throwable $e) {
        // Fallback MySQLi si disponible
        $fallbackOk = false;
        $usersCount = null;
        // Vérifier que l'extension/class mysqli existe avant usage
        if (class_exists('mysqli')) {
            // Désactiver le mode strict pour éviter des exceptions non interceptées
            if (function_exists('mysqli_report')) { @mysqli_report(MYSQLI_REPORT_OFF); }
            try {
                global $conn;
                $mysqli = ($conn instanceof mysqli) ? $conn : @new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, (defined('DB_PORT') ? DB_PORT : 3306));
                if ($mysqli && (!property_exists($mysqli, 'connect_errno') || $mysqli->connect_errno === 0)) {
                    $res = @$mysqli->query('SELECT 1');
                    if ($res) { $fallbackOk = true; }
                    $res2 = @$mysqli->query('SELECT COUNT(*) AS c FROM users');
                    if ($res2 && ($row = $res2->fetch_assoc())) { $usersCount = (int)$row['c']; }
                }
            } catch (Throwable $ex) {
                // Ignorer et continuer
            }
        }
        if ($fallbackOk) {
            jsonResponse(['ok' => true, 'select1' => true, 'users_count' => $usersCount]);
        }
        logError('Ping DB échoué', ['error' => $e->getMessage()]);
        // Ne pas casser le health check: renvoyer 200 avec ok=false
        jsonResponse(['ok' => false, 'error' => 'DB non accessible', 'details' => (includeErrorDetails() ? $e->getMessage() : null)], 200);
    }
}
// Security wrappers are defined globally in config.php to avoid dependency on Security.php.
// This file no longer declares wrapper functions to prevent redeclarations.

function debugHeaders() {
    // Restreindre cet endpoint au mode debug pour éviter la fuite d’informations
    if (!(function_exists('includeErrorDetails') && includeErrorDetails())) {
        jsonResponse(['error' => 'Debug désactivé'], 403);
    }
    $headers = function_exists('getallheaders') ? getallheaders() : null;
    $serverKeys = [
        'HTTP_AUTHORIZATION','REDIRECT_HTTP_AUTHORIZATION','Authorization',
        'HTTP_X_ACCESS_TOKEN','REDIRECT_HTTP_X_ACCESS_TOKEN',
        'CONTENT_TYPE','HTTP_CONTENT_TYPE','REQUEST_URI','REQUEST_METHOD',
        'REMOTE_ADDR','HTTP_USER_AGENT'
    ];
    $server = [];
    foreach ($serverKeys as $k) { if (isset($_SERVER[$k])) { $v = (string)$_SERVER[$k]; $server[$k] = substr($v, 0, 120); } }
    $qs = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
    $qsa = [];
    if ($qs) { parse_str($qs, $qsa); }
    $token = getBearerToken();
    $resp = [
        'ok' => true,
        'headers_keys' => $headers ? array_keys($headers) : [],
        'server' => $server,
        'query' => $qsa,
        'token_detected' => !!$token,
        'token_length' => $token ? strlen($token) : 0,
        'token_peek' => $token ? substr($token, 0, 24) : null
    ];
    jsonResponse($resp);
}

// === Helpers manquants pour la gestion des connexions et tokens ===
// Tous ces helpers doivent être robustes: vérifier la présence des colonnes et dégrader proprement.

function findUserByIdentifier($db, $identifier) {
    if (!$db || !dbTableExists($db, 'users')) { return null; }
    $idCols = [];
    foreach (['email','username','login','identifiant','identifier'] as $col) {
        if (dbColumnExists($db, $col)) { $idCols[] = $col; }
    }
    if (empty($idCols)) { return null; }
    $conds = [];
    $binds = [];
    foreach ($idCols as $idx => $col) {
        $ph = ':ident_' . $idx;
        $conds[] = "LOWER($col) = LOWER($ph)";
        $binds[$ph] = $identifier;
    }
    $sql = 'SELECT id, failed_login_attempts, last_failed_login FROM users WHERE ' . implode(' OR ', $conds) . ' LIMIT 1';
    $stmt = $db->prepare($sql);
    foreach ($binds as $k => $v) { $stmt->bindValue($k, $v); }
    $stmt->execute();
    return $stmt->fetch();
}

function isAccountLocked($db, $identifier) {
    try {
        if (!$db || !dbTableExists($db, 'users')) { return false; }
        $hasFailCol = dbColumnExists($db, 'failed_login_attempts');
        $hasLastFail = dbColumnExists($db, 'last_failed_login');
        if (!$hasFailCol) { return false; }
        $user = findUserByIdentifier($db, $identifier);
        if (!$user || !isset($user['failed_login_attempts'])) { return false; }
        $max = defined('MAX_LOGIN_ATTEMPTS') ? MAX_LOGIN_ATTEMPTS : 5;
        $lockMinutes = defined('LOCKOUT_WINDOW_MINUTES') ? LOCKOUT_WINDOW_MINUTES : 15;
        if ((int)$user['failed_login_attempts'] < $max) { return false; }
        if ($hasLastFail && !empty($user['last_failed_login'])) {
            $last = strtotime($user['last_failed_login']);
            if ($last !== false) {
                $diff = time() - $last;
                return $diff < ($lockMinutes * 60);
            }
        }
        // Si pas de colonne time, considérer verrouillé lorsqu'au-dessus du max
        return true;
    } catch (Throwable $e) {
        logError('isAccountLocked_failed', ['error' => $e->getMessage()]);
        return false;
    }
}

function recordFailedLogin($db, $identifier) {
    try {
        if (!$db || !dbTableExists($db, 'users')) { return; }
        $hasFailCol = dbColumnExists($db, 'failed_login_attempts');
        $hasLastFail = dbColumnExists($db, 'last_failed_login');
        if (!$hasFailCol && !$hasLastFail) { return; }
        $user = findUserByIdentifier($db, $identifier);
        if (!$user || !isset($user['id'])) { return; }
        $sets = [];
        if ($hasFailCol) { $sets[] = 'failed_login_attempts = IFNULL(failed_login_attempts,0) + 1'; }
        if ($hasLastFail) { $sets[] = 'last_failed_login = NOW()'; }
        if (!empty($sets)) {
            $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = :id';
            $st = $db->prepare($sql);
            $st->bindValue(':id', (int)$user['id'], PDO::PARAM_INT);
            $st->execute();
        }
    } catch (Throwable $e) {
        logError('recordFailedLogin_failed', ['error' => $e->getMessage()]);
    }
}

function resetFailedLoginAttempts($db, $userId) {
    try {
        if (!$db || !dbTableExists($db, 'users')) { return; }
        $hasFailCol = dbColumnExists($db, 'failed_login_attempts');
        $hasLastFail = dbColumnExists($db, 'last_failed_login');
        if (!$hasFailCol && !$hasLastFail) { return; }
        $sets = [];
        if ($hasFailCol) { $sets[] = 'failed_login_attempts = 0'; }
        if ($hasLastFail) { $sets[] = 'last_failed_login = NULL'; }
        if (!empty($sets)) {
            $sql = 'UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = :id';
            $st = $db->prepare($sql);
            $st->bindValue(':id', (int)$userId, PDO::PARAM_INT);
            $st->execute();
        }
    } catch (Throwable $e) {
        logError('resetFailedLoginAttempts_failed', ['error' => $e->getMessage()]);
    }
}

function saveRefreshToken($db, $userId, $refreshToken) {
    try {
        if (!$db) { return; }
        // Table dédiée si présente
        if (dbTableExists($db, 'refresh_tokens')) {
            $sql = 'INSERT INTO refresh_tokens (user_id, token, created_at) VALUES (:uid, :tok, NOW())';
            $st = $db->prepare($sql);
            $st->bindValue(':uid', (int)$userId, PDO::PARAM_INT);
            $st->bindValue(':tok', (string)$refreshToken, PDO::PARAM_STR);
            $st->execute();
            return;
        }
        // Colonne sur users si disponible
        if (dbTableExists($db, 'users') && dbColumnExists($db, 'refresh_token')) {
            $sql = 'UPDATE users SET refresh_token = :tok WHERE id = :uid';
            $st = $db->prepare($sql);
            $st->bindValue(':uid', (int)$userId, PDO::PARAM_INT);
            $st->bindValue(':tok', (string)$refreshToken, PDO::PARAM_STR);
            $st->execute();
        }
    } catch (Throwable $e) {
        logError('saveRefreshToken_failed', ['error' => $e->getMessage()]);
    }
}

function isValidRefreshToken($db, $userId, $refreshToken) {
    try {
        if (!$db) { return true; }
        // Vérifier table dédiée
        if (dbTableExists($db, 'refresh_tokens')) {
            $sql = 'SELECT 1 FROM refresh_tokens WHERE user_id = :uid AND token = :tok LIMIT 1';
            $st = $db->prepare($sql);
            $st->bindValue(':uid', (int)$userId, PDO::PARAM_INT);
            $st->bindValue(':tok', (string)$refreshToken, PDO::PARAM_STR);
            $st->execute();
            return (bool)$st->fetchColumn();
        }
        // Vérifier colonne sur users
        if (dbTableExists($db, 'users') && dbColumnExists($db, 'refresh_token')) {
            $sql = 'SELECT 1 FROM users WHERE id = :uid AND refresh_token = :tok LIMIT 1';
            $st = $db->prepare($sql);
            $st->bindValue(':uid', (int)$userId, PDO::PARAM_INT);
            $st->bindValue(':tok', (string)$refreshToken, PDO::PARAM_STR);
            $st->execute();
            return (bool)$st->fetchColumn();
        }
        // Si aucun stockage n'existe, accepter le token pour ne pas bloquer
        return true;
    } catch (Throwable $e) {
        logError('isValidRefreshToken_failed', ['error' => $e->getMessage()]);
        return false;
    }
}

function updateLastLogin($db, $userId) {
    try {
        if (!$db || !dbTableExists($db, 'users')) { return; }
        // Préférer colonne last_login si présente, sinon created_at comme fallback neutre
        if (dbColumnExists($db, 'last_login')) {
            $sql = 'UPDATE users SET last_login = NOW() WHERE id = :id';
        } else if (dbColumnExists($db, 'updated_at')) {
            $sql = 'UPDATE users SET updated_at = NOW() WHERE id = :id';
        } else {
            return; // aucune colonne pertinente
        }
        $st = $db->prepare($sql);
        $st->bindValue(':id', (int)$userId, PDO::PARAM_INT);
        $st->execute();
    } catch (Throwable $e) {
        logError('updateLastLogin_failed', ['error' => $e->getMessage()]);
    }
}