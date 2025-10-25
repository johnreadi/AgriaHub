<?php
// API Configuration for IONOS deployment
// NOTE: This file contains server-side credentials; DO NOT expose any value on the frontend.

// MySQL credentials (IONOS)
$DB_HOST = 'db5018629781.hosting-data.io';
$DB_NAME = 'dbs14768810';
$DB_USER = 'dbu3279635';
$DB_PASS = 'Resto.AgriaRouen76100';

// Also define constants for PDO-based Database class usage
if (!defined('DB_HOST')) { define('DB_HOST', $DB_HOST); }
if (!defined('DB_NAME')) { define('DB_NAME', $DB_NAME); }
if (!defined('DB_USER')) { define('DB_USER', $DB_USER); }
if (!defined('DB_PASS')) { define('DB_PASS', $DB_PASS); }
if (!defined('DB_CHARSET')) { define('DB_CHARSET', 'utf8mb4'); }
if (!defined('DB_PORT')) { define('DB_PORT', 3306); }
if (!defined('ENVIRONMENT')) { define('ENVIRONMENT', 'production'); }
if (!defined('JWT_SECRET')) { define('JWT_SECRET', hash('sha256', $DB_HOST . $DB_NAME . 'agria_rouen_2024')); }

// GEMINI API KEY (server-side only)
if (!defined('GEMINI_API_KEY')) {
    $geminiFromEnv = getenv('GEMINI_API_KEY');
    if ($geminiFromEnv && is_string($geminiFromEnv)) {
        define('GEMINI_API_KEY', $geminiFromEnv);
    } else {
        define('GEMINI_API_KEY', ''); // fallback empty to avoid leaking
    }
}

// Fallback logging function to avoid fatal errors when logError is called
if (!function_exists('logError')) {
    function logError($message, $context = []) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => $message,
            'context' => $context,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        $logFile = __DIR__ . '/logs/error.log';
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        @file_put_contents($logFile, json_encode($logData) . PHP_EOL, FILE_APPEND | LOCK_EX);
    }
}

// Include Database class for endpoints relying only on this config
require_once __DIR__ . '/database.php';

// Create a MySQLi connection (legacy compatibility - non bloquant)
$conn = null;
if (class_exists('mysqli')) {
    // Désactiver temporairement le mode strict pour éviter les exceptions non interceptées
    if (function_exists('mysqli_report')) { @mysqli_report(MYSQLI_REPORT_OFF); }
    try {
        $tmpConn = @new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, (defined('DB_PORT') ? DB_PORT : 3306));
        // Ne pas bloquer l'API si MySQLi échoue; les endpoints utilisent PDO via Database
        if ($tmpConn && property_exists($tmpConn, 'connect_errno') && $tmpConn->connect_errno) {
            error_log('[CONFIG] MySQLi connection failed: ' . $tmpConn->connect_error);
            $conn = null;
        } else {
            $conn = $tmpConn;
            if ($conn) { @$conn->set_charset('utf8mb4'); }
        }
    } catch (Throwable $e) {
        // En environnements où mysqli est configuré pour lancer des exceptions (MYSQLI_REPORT_STRICT)
        error_log('[CONFIG] MySQLi threw exception: ' . $e->getMessage());
        $conn = null;
    }
}

// Helper: read JSON body safely
function read_json_body(): array {
    $input = isset($GLOBALS['RAW_BODY_CACHED']) ? $GLOBALS['RAW_BODY_CACHED'] : file_get_contents('php://input');
    if ($input === false || $input === null) { $input = ''; }
    $GLOBALS['RAW_BODY_CACHED'] = is_string($input) ? $input : (string)$input;
    if ($GLOBALS['RAW_BODY_CACHED'] === '') { return []; }
    $data = json_decode($GLOBALS['RAW_BODY_CACHED'], true);
    if (!is_array($data)) {
        $errCode = function_exists('json_last_error') ? json_last_error() : null;
        $errMsg = function_exists('json_last_error_msg') ? json_last_error_msg() : null;
        logError('read_json_body_decode_failed', [
            'len' => strlen($GLOBALS['RAW_BODY_CACHED']),
            'peek' => substr($GLOBALS['RAW_BODY_CACHED'], 0, 200),
            'json_error' => $errCode,
            'json_error_msg' => $errMsg,
            'content_type' => ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '')
        ]);
        $form = [];
        parse_str($GLOBALS['RAW_BODY_CACHED'], $form);
        if (is_array($form) && !empty($form)) { return $form; }
        return [];
    }
    return $data;
}

// NEW helper: unify request payload (JSON or form)
if (!function_exists('getRequestData')) {
    function getRequestData(): array {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        
        logError('getRequestData_debug', [
            'content_type' => $contentType,
            'method' => $method,
            'post_data' => $_POST,
            'has_files' => !empty($_FILES)
        ]);

        // Si c'est du JSON
        if (stripos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true) ?? [];
            if (!empty($data)) {
                logError('getRequestData_json_parsed', ['data_keys' => array_keys($data)]);
                return $data;
            }
        }
        
        // Si c'est du form-data ou x-www-form-urlencoded (POST)
        if ($method === 'POST' && !empty($_POST)) {
            logError('getRequestData_post_used', ['post_keys' => array_keys($_POST)]);
            return $_POST;
        }
        
        // Si c'est une requête PUT/PATCH avec form data
        if (in_array($method, ['PUT', 'PATCH']) && !empty($_POST)) {
            return $_POST;
        }
        
        // Fallback: parser le raw input pour PUT/PATCH ou autres content-types
        $input = file_get_contents('php://input');
        if (!empty($input)) {
            // Essayer JSON d'abord
            $jsonData = json_decode($input, true);
            if (is_array($jsonData) && !empty($jsonData)) {
                logError('getRequestData_fallback_json', ['data_keys' => array_keys($jsonData)]);
                return $jsonData;
            }
            
            // Essayer form data (x-www-form-urlencoded)
            parse_str($input, $formData);
            if (!empty($formData) && is_array($formData)) {
                logError('getRequestData_fallback_form', ['data_keys' => array_keys($formData)]);
                return $formData;
            }
        }
        
        // Pour les requêtes GET, retourner les paramètres query string
        if ($method === 'GET' && !empty($_GET)) {
            return $_GET;
        }
        
        logError('getRequestData_empty', [
            'content_type' => $contentType,
            'method' => $method,
            'input_length' => strlen($input ?? '')
        ]);
        
        return [];
    }
}

// Provide standard JSON response utility if missing
if (!function_exists('jsonResponse')) {
    function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        
        // Headers CORS pour permettre les requêtes cross-origin
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        
        // Pour les requêtes OPTIONS (préflight)
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
        
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit();
    }
}

// Simple error logging helper (déjà défini plus haut, mais au cas où)
if (!function_exists('logError')) {
    function logError($message, $context = []) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'message' => $message,
            'context' => $context,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
        ];
        $logFile = __DIR__ . '/logs/error.log';
        $logDir = dirname($logFile);
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0755, true);
        }
        @file_put_contents($logFile, json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);
    }
}

// Simplified security wrappers to remove dependency on Security.php
if (!function_exists('base64url_encode')) {
    function base64url_encode($data) { 
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); 
    }
}

if (!function_exists('base64url_decode')) {
    function base64url_decode($data) { 
        return base64_decode(strtr($data, '-_', '+/')); 
    }
}

if (!function_exists('sec_log')) {
    function sec_log($event, $meta = []) { 
        logError('[SEC] ' . $event, $meta);
    }
}

if (!function_exists('sec_validateData')) {
    function sec_validateData($data, $rules) {
        $errors = [];
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            
            if (!empty($rule['required']) && ($value === null || $value === '')) { 
                $errors[$field] = 'required'; 
                continue; 
            }
            
            if (empty($value)) continue;
            
            if (isset($rule['min_length']) && strlen((string)$value) < $rule['min_length']) { 
                $errors[$field] = 'min_length'; 
            }
            
            if (!empty($rule['email']) && !filter_var($value, FILTER_VALIDATE_EMAIL)) { 
                $errors[$field] = 'email'; 
            }
            
            if (!empty($rule['numeric']) && !is_numeric($value)) {
                $errors[$field] = 'numeric';
            }
        }
        return $errors;
    }
}

if (!function_exists('sec_sanitizeInput')) {
    function sec_sanitizeInput($value, $type = null) { 
        if (is_array($value)) {
            return array_map('sec_sanitizeInput', $value);
        }
        
        $value = is_string($value) ? trim($value) : $value;
        
        switch ($type) {
            case 'email':
                return filter_var($value, FILTER_SANITIZE_EMAIL);
            case 'int':
                return filter_var($value, FILTER_SANITIZE_NUMBER_INT);
            case 'float':
                return filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            case 'string':
            default:
                return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        }
    }
}

if (!function_exists('sec_hashPassword')) {
    function sec_hashPassword($password) {
        return md5(is_string($password) ? $password : (string)$password);
    }
}

if (!function_exists('sec_verifyPassword')) {
    function sec_verifyPassword($password, $hash) {
        if (!is_string($hash) || $hash === '') {
            return false;
        }
        $pwd = is_string($password) ? $password : (string)$password;

        // Bcrypt ou Argon2id
        if ((strpos($hash, '$2y$') === 0 || strpos($hash, '$argon2id$') === 0) && function_exists('password_verify')) {
            return password_verify($pwd, $hash);
        }

        // MD5
        if (preg_match('/^[a-f0-9]{32}$/i', $hash)) {
            return md5($pwd) === strtolower($hash);
        }

        // SHA1
        if (preg_match('/^[a-f0-9]{40}$/i', $hash)) {
            return sha1($pwd) === strtolower($hash);
        }

        // SHA256
        if (preg_match('/^[a-f0-9]{64}$/i', $hash)) {
            return hash('sha256', $pwd) === strtolower($hash);
        }

        // Fallback en clair
        return hash_equals($pwd, $hash);
    }
}

if (!function_exists('sec_generateJWT')) {
    function sec_generateJWT($payload, $secret = null) {
        $secret = $secret ?: (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret');
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $now = time();
        
        // Set default claims
        if (!isset($payload['iat'])) $payload['iat'] = $now;
        if (!isset($payload['exp'])) $payload['exp'] = $now + (24 * 60 * 60); // 24 hours default
        
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
        $secret = $secret ?: (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret');
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }
        
        list($h64, $p64, $s64) = $parts;
        
        $header = json_decode(base64url_decode($h64), true);
        $payload = json_decode(base64url_decode($p64), true);
        $signature = base64url_decode($s64);
        
        if (!$header || !$payload || !$signature) {
            return null;
        }
        
        $signingInput = $h64 . '.' . $p64;
        $expected = hash_hmac('sha256', $signingInput, $secret, true);
        
        if (!hash_equals($expected, $signature)) {
            return null;
        }
        
        if (isset($payload['exp']) && time() > $payload['exp']) {
            return null;
        }
        
        return $payload;
    }
}

if (!function_exists('sec_generateCSRFToken')) {
    function sec_generateCSRFToken() { 
        return bin2hex(random_bytes(32)); 
    }
}

if (!function_exists('sec_verifyCSRFToken')) {
    function sec_verifyCSRFToken($token) { 
        return !empty($token); // Simplified for now
    }
}

if (!function_exists('sec_getClientIP')) {
    function sec_getClientIP() {
        $ipKeys = [
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR', 
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                foreach ($ips as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP)) { 
                        return $ip; 
                    }
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}

// Helper pour inclure les détails d'erreur en mode debug
if (!function_exists('includeErrorDetails')) {
    function includeErrorDetails() {
        // Environment-based
        if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') { 
            return true; 
        }
        
        // Global debug mode
        if (isset($GLOBALS['DEBUG_MODE']) && $GLOBALS['DEBUG_MODE'] === true) { 
            return true; 
        }
        
        // Header-based toggle
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $hDebug = null;
        foreach (['X-Debug','x-debug'] as $hk) { 
            if (isset($headers[$hk])) { 
                $hDebug = $headers[$hk]; 
                break; 
            } 
        }
        if (!$hDebug && isset($_SERVER['HTTP_X_DEBUG'])) { 
            $hDebug = $_SERVER['HTTP_X_DEBUG']; 
        }
        if ($hDebug) {
            $v = strtolower(trim((string)$hDebug));
            if (in_array($v, ['1','true','yes'], true)) { 
                return true; 
            }
        }
        
        // Querystring-based toggle
        $qs = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
        if ($qs) {
            $qsa = [];
            parse_str($qs, $qsa);
            if (isset($qsa['debug'])) {
                $v = strtolower((string)$qsa['debug']);
                if ($v === '1' || $v === 'true' || $v === 'yes') { 
                    return true; 
                }
            }
        }
        
        return false;
    }
}

// Polyfill getallheaders for non-Apache environments (e.g., PHP built-in server)
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (strpos($name, 'HTTP_') === 0) {
                $key = str_replace('_', ' ', substr($name, 5));
                $key = str_replace(' ', '-', ucwords(strtolower($key)));
                $headers[$key] = $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) { 
            $headers['Content-Type'] = $_SERVER['CONTENT_TYPE']; 
        }
        if (isset($_SERVER['CONTENT_LENGTH'])) { 
            $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH']; 
        }
        return $headers;
    }
}

// Helper pour extraire le token Bearer
if (!function_exists('getBearerToken')) {
    function getBearerToken() {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = null;
        
        // Try case-sensitive then case-insensitive
        foreach (['Authorization','authorization'] as $k) {
            if (isset($headers[$k]) && is_string($headers[$k])) { 
                $authHeader = $headers[$k]; 
                break; 
            }
        }
        
        // Fallbacks for environments that don't pass Authorization normally
        if (!$authHeader) {
            $candidates = [
                $_SERVER['HTTP_AUTHORIZATION'] ?? null,
                $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null
            ];
            foreach ($candidates as $h) { 
                if (!empty($h)) { 
                    $authHeader = $h; 
                    break; 
                } 
            }
            
            if (!$authHeader && function_exists('apache_request_headers')) {
                $ah = @apache_request_headers();
                if (is_array($ah)) {
                    foreach ($ah as $k => $v) { 
                        if (strtolower($k) === 'authorization') { 
                            $authHeader = $v; 
                            break; 
                        } 
                    }
                }
            }
        }
        
        // Accept custom header X-Access-Token to bypass stripped Authorization
        $xToken = null;
        foreach (['X-Access-Token','x-access-token'] as $k) {
            if (isset($headers[$k]) && is_string($headers[$k])) { 
                $xToken = trim($headers[$k]); 
                break; 
            }
        }
        if (!$xToken) {
            $serverCandidates = [
                $_SERVER['HTTP_X_ACCESS_TOKEN'] ?? null,
                $_SERVER['REDIRECT_HTTP_X_ACCESS_TOKEN'] ?? null
            ];
            foreach ($serverCandidates as $h) { 
                if (!empty($h)) { 
                    $xToken = trim($h); 
                    break; 
                } 
            }
        }
        if ($xToken) { 
            return $xToken; 
        }

        if ($authHeader && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        // In development or debug mode, allow token via query or body
        if (function_exists('includeErrorDetails') && includeErrorDetails()) {
            $qs = [];
            $query = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
            if ($query) { 
                parse_str($query, $qs); 
            }
            foreach (['access_token','token','accessToken'] as $k) { 
                if (!empty($qs[$k])) { 
                    return $qs[$k]; 
                } 
            }
            
            $data = function_exists('getRequestData') ? getRequestData() : [];
            foreach (['access_token','token','accessToken'] as $k) { 
                if (isset($data[$k])) { 
                    return $data[$k]; 
                } 
            }
        }
        
        return null;
    }
}

?>