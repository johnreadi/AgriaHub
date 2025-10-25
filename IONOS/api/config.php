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
        define('GEMINI_API_KEY', 'AIzaSyAKMJDkoitiEgTGGWQC6z5VLr9re7NhiQs'); // nouvelle clé API
    }
}

// Fallback logging function to avoid fatal errors when logError is called
if (!function_exists('logError')) {
    function logError($message, $context = []) {
        try {
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'message' => is_string($message) ? $message : json_encode($message),
                'context' => $context,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ];
            // Try multiple file locations to maximize chances of write success
            $paths = [
                __DIR__ . '/logs/error.log',
                __DIR__ . '/error.log',
            ];
            $written = false;
            foreach ($paths as $logFile) {
                $logDir = dirname($logFile);
                if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }
                $res = @file_put_contents($logFile, json_encode($logData) . PHP_EOL, FILE_APPEND | LOCK_EX);
                if ($res !== false) { $written = true; break; }
            }
            // Fallback vers le journal PHP si l'écriture fichier échoue
            if (!$written && function_exists('error_log')) {
                @error_log('[APP] ' . json_encode($logData));
            }
        } catch (Throwable $e) {
            if (function_exists('error_log')) { @error_log('[logError-failure] ' . $e->getMessage()); }
        }
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
        $isJson = stripos($contentType, 'application/json') !== false;
        logError('getRequestData_enter', ['content_type' => $contentType]);
        if ($isJson) {
            $data = read_json_body();
            if (empty($data)) {
                logError('getRequestData_json_empty', [
                    'raw_len' => strlen($GLOBALS['RAW_BODY_CACHED'] ?? ''),
                    'raw_peek' => substr($GLOBALS['RAW_BODY_CACHED'] ?? '', 0, 200)
                ]);
            }
        } else {
            $data = $_POST ?? [];
            if (empty($data)) {
                $fallback = read_json_body();
                if (!empty($fallback)) { $data = $fallback; }
            }
        }
        logError('getRequestData_keys', ['keys' => array_keys(is_array($data) ? $data : []), 'method' => $_SERVER['REQUEST_METHOD'] ?? null]);
        return is_array($data) ? $data : [];
    }
}

// Provide standard JSON response utility if missing
if (!function_exists('jsonResponse')) {
    function jsonResponse($data, $statusCode = 200) {
        $isCli = (PHP_SAPI === 'cli');
        // Si des sorties ont déjà commencé, éviter de modifier les en-têtes
        $headersAlreadySent = headers_sent($hsFile, $hsLine);
        if (!$isCli && !$headersAlreadySent) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . ($isCli ? PHP_EOL : '');
        if (!$isCli && $headersAlreadySent) {
            // Aide au diagnostic: journaliser l'endroit où les headers ont été envoyés
            logError('jsonResponse_headers_already_sent', ['file' => $hsFile ?? null, 'line' => $hsLine ?? null, 'status' => $statusCode]);
        }
        if ($isCli) {
            exit($statusCode >= 400 ? 1 : 0);
        }
        exit();
    }
}

// Simple error logging helper
if (!function_exists('logError')) {
    function logError($message, $context = []) {
        try {
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'message' => is_string($message) ? $message : json_encode($message),
                'context' => $context,
                'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
            ];
            $paths = [
                __DIR__ . '/logs/error.log',
                __DIR__ . '/error.log',
            ];
            $written = false;
            foreach ($paths as $logFile) {
                $logDir = dirname($logFile);
                if (!is_dir($logDir)) { @mkdir($logDir, 0755, true); }
                $res = @file_put_contents($logFile, json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);
                if ($res !== false) { $written = true; break; }
            }
            if (!$written && function_exists('error_log')) { @error_log('[APP] ' . json_encode($logData)); }
        } catch (Throwable $e) {
            if (function_exists('error_log')) { @error_log('[logError-failure] ' . $e->getMessage()); }
        }
    }
}
// Simplified security wrappers to remove dependency on Security.php
if (!function_exists('base64url_encode')) {
    function base64url_encode($data) { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
}
if (!function_exists('base64url_decode')) {
    function base64url_decode($data) { return base64_decode(strtr($data, '-_', '+/')); }
}
if (!function_exists('sec_log')) {
    function sec_log($event, $meta = []) { error_log('[SEC] ' . $event . ' ' . json_encode($meta)); }
}
if (!function_exists('sec_validateData')) {
    function sec_validateData($data, $rules) {
        $errors = [];
        foreach ($rules as $field => $rule) {
            if (!empty($rule['required']) && (!isset($data[$field]) || $data[$field] === '')) { $errors[$field] = 'required'; continue; }
            if (isset($rule['min_length']) && isset($data[$field]) && strlen((string)$data[$field]) < $rule['min_length']) { $errors[$field] = 'min_length'; }
            if (!empty($rule['email']) && isset($data[$field]) && !filter_var($data[$field], FILTER_VALIDATE_EMAIL)) { $errors[$field] = 'email'; }
        }
        return $errors;
    }
}
if (!function_exists('sec_sanitizeInput')) {
    function sec_sanitizeInput($value, $type = null) { $value = is_string($value) ? trim($value) : $value; return $type === 'email' ? filter_var($value, FILTER_SANITIZE_EMAIL) : $value; }
}
if (!function_exists('sec_hashPassword')) {
    function sec_hashPassword($password) { return md5(is_string($password) ? $password : (string)$password); }
}
if (!function_exists('sec_verifyPassword')) {
    function sec_verifyPassword($password, $hash) {
        if (!is_string($hash) || $hash === '') { return false; }
        $pwd = is_string($password) ? $password : (string)$password;
        // Priorité: MD5 simple
        if (hash_equals($hash, md5($pwd))) { return true; }
        // Support des hashes forts existants (bcrypt/argon2id)
        if (function_exists('password_verify') && preg_match('/^(\$2y\$|\$argon2id\$)/', $hash)) {
            if (password_verify($pwd, $hash)) { return true; }
        }
        // Compatibilité legacy: clair, SHA1, SHA256
        if (hash_equals($hash, $pwd)) { return true; }
        if (hash_equals($hash, sha1($pwd)) || hash_equals($hash, hash('sha256', $pwd))) { return true; }
        return false;
    }
}
if (!function_exists('sec_generateJWT')) {
    function sec_generateJWT($payload, $secret = null) {
        $secret = $secret ?: (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret');
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];
        $now = time();
        if (!isset($payload['iat'])) $payload['iat'] = $now;
        if (!isset($payload['exp'])) $payload['exp'] = $now + 3600;
        $segments = [ base64url_encode(json_encode($header)), base64url_encode(json_encode($payload)) ];
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
        if (count($parts) !== 3) return null;
        list($h64, $p64, $s64) = $parts;
        $header = json_decode(base64url_decode($h64), true);
        $payload = json_decode(base64url_decode($p64), true);
        $signature = base64url_decode($s64);
        if (!$header || !$payload || !$signature) return null;
        $signingInput = $h64 . '.' . $p64;
        $expected = hash_hmac('sha256', $signingInput, $secret, true);
        if (!hash_equals($expected, $signature)) return null;
        if (isset($payload['exp']) && time() > $payload['exp']) return null;
        return $payload;
    }
}
if (!function_exists('sec_generateCSRFToken')) {
    function sec_generateCSRFToken() { return bin2hex(random_bytes(32)); }
}
if (!function_exists('sec_verifyCSRFToken')) {
    function sec_verifyCSRFToken($token) { return !empty($token); }
}
if (!function_exists('sec_getClientIP')) {
    function sec_getClientIP() {
        $ipKeys = ['HTTP_CLIENT_IP','HTTP_X_FORWARDED_FOR','HTTP_X_FORWARDED','HTTP_X_CLUSTER_CLIENT_IP','HTTP_FORWARDED_FOR','HTTP_FORWARDED','REMOTE_ADDR'];
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ips = explode(',', $_SERVER[$key]);
                foreach ($ips as $ip) {
                    $ip = trim($ip);
                    if (filter_var($ip, FILTER_VALIDATE_IP)) { return $ip; }
                }
            }
        }
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
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
        if (isset($_SERVER['CONTENT_TYPE'])) { $headers['Content-Type'] = $_SERVER['CONTENT_TYPE']; }
        if (isset($_SERVER['CONTENT_LENGTH'])) { $headers['Content-Length'] = $_SERVER['CONTENT_LENGTH']; }
        return $headers;
    }
}
if (!function_exists('dbTableExists')) {
    function dbTableExists($pdo, $tableName) {
        try {
            if (!$pdo) { return false; }
            $stmt = $pdo->prepare("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t LIMIT 1");
            $stmt->execute([':t' => $tableName]);
            return $stmt->fetchColumn() !== false;
        } catch (Throwable $e) {
            logError('dbTableExists_failed', ['error' => $e->getMessage(), 'table' => $tableName]);
            return false;
        }
    }
}

if (!function_exists('dbColumnExists')) {
    function dbColumnExists($pdo, $column, $table = 'users') {
        try {
            if (!$pdo) { return false; }
            $stmt = $pdo->prepare("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :t AND COLUMN_NAME = :c LIMIT 1");
            $stmt->execute([':t' => $table, ':c' => $column]);
            return $stmt->fetchColumn() !== false;
        } catch (Throwable $e) {
            logError('dbColumnExists_failed', ['error' => $e->getMessage(), 'table' => $table, 'column' => $column]);
            return false;
        }
    }
}
?>