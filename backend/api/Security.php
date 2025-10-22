<?php
require_once __DIR__ . '/config.php';
/**
 * Classe de sécurité pour AGRIA ROUEN API
 * Protection contre les attaques courantes et validation des données
 */

class Security {
    
    /**
     * Valide et nettoie les données d'entrée
     */
    public static function sanitizeInput($data, $type = 'string') {
        if (is_array($data)) {
            return array_map(function($item) use ($type) {
                return self::sanitizeInput($item, $type);
            }, $data);
        }
        
        switch ($type) {
            case 'email':
                return filter_var(trim($data), FILTER_SANITIZE_EMAIL);
            case 'int':
                return filter_var($data, FILTER_SANITIZE_NUMBER_INT);
            case 'float':
                return filter_var($data, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
            case 'url':
                return filter_var(trim($data), FILTER_SANITIZE_URL);
            case 'string':
            default:
                return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
        }
    }
    
    /**
     * Valide les données selon des règles spécifiques
     */
    public static function validateData($data, $rules) {
        $errors = [];
        
        foreach ($rules as $field => $rule) {
            $value = $data[$field] ?? null;
            
            // Vérification des champs requis
            if (isset($rule['required']) && $rule['required'] && empty($value)) {
                $errors[$field] = "Le champ {$field} est requis";
                continue;
            }
            
            if (empty($value)) continue;
            
            // Validation de l'email
            if (isset($rule['email']) && $rule['email']) {
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $errors[$field] = "Format d'email invalide";
                }
            }
            
            // Validation de la longueur
            if (isset($rule['min_length'])) {
                if (strlen($value) < $rule['min_length']) {
                    $errors[$field] = "Minimum {$rule['min_length']} caractères requis";
                }
            }
            
            if (isset($rule['max_length'])) {
                if (strlen($value) > $rule['max_length']) {
                    $errors[$field] = "Maximum {$rule['max_length']} caractères autorisés";
                }
            }
            
            // Validation des nombres
            if (isset($rule['numeric']) && $rule['numeric']) {
                if (!is_numeric($value)) {
                    $errors[$field] = "Valeur numérique requise";
                }
            }
            
            // Validation du téléphone
            if (isset($rule['phone']) && $rule['phone']) {
                if (!preg_match('/^[0-9+\-\s\(\)]{10,15}$/', $value)) {
                    $errors[$field] = "Format de téléphone invalide";
                }
            }
            
            // Validation du mot de passe
            if (isset($rule['password']) && $rule['password']) {
                if (!self::validatePassword($value)) {
                    $errors[$field] = "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre";
                }
            }
        }
        
        return $errors;
    }
    
    /**
     * Valide la force du mot de passe
     */
    public static function validatePassword($password) {
        return preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/', $password);
    }
    
    /**
     * Génère un token CSRF sécurisé
     */
    public static function generateCSRFToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        $_SESSION['csrf_token_time'] = time();
        
        return $token;
    }
    
    /**
     * Vérifie le token CSRF
     */
    public static function verifyCSRFToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
            return false;
        }
        
        // Token expire après 1 heure
        if (time() - $_SESSION['csrf_token_time'] > 3600) {
            unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
            return false;
        }
        
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Génère un JWT sécurisé
     */
    public static function generateJWT($payload, $secret = null) {
        $secret = $secret ?: JWT_SECRET;
        
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['iat'] = time();
        $payload['exp'] = time() + (24 * 60 * 60); // Expire dans 24h
        $payload = json_encode($payload);
        
        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64Header . "." . $base64Payload, $secret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64Header . "." . $base64Payload . "." . $base64Signature;
    }
    
    /**
     * Vérifie et décode un JWT
     */
    public static function verifyJWT($jwt, $secret = null) {
        $secret = $secret ?: JWT_SECRET;
        
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }
        
        [$header, $payload, $signature] = $parts;
        
        $validSignature = str_replace(['+', '/', '='], ['-', '_', ''], 
            base64_encode(hash_hmac('sha256', $header . "." . $payload, $secret, true)));
        
        if (!hash_equals($signature, $validSignature)) {
            return false;
        }
        
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload)), true);
        
        // Vérifier l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    /**
     * Limite le taux de requêtes (Rate Limiting)
     */
    public static function rateLimiting($identifier, $maxRequests = 100, $timeWindow = 3600) {
        $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($identifier);
        
        $requests = [];
        if (file_exists($cacheFile)) {
            $requests = json_decode(file_get_contents($cacheFile), true) ?: [];
        }
        
        $now = time();
        $requests = array_filter($requests, function($timestamp) use ($now, $timeWindow) {
            return ($now - $timestamp) < $timeWindow;
        });
        
        if (count($requests) >= $maxRequests) {
            return false;
        }
        
        $requests[] = $now;
        file_put_contents($cacheFile, json_encode($requests));
        
        return true;
    }
    
    /**
     * Hache un mot de passe de manière sécurisée
     */
    public static function hashPassword($password) {
        return sec_hashPassword($password);
    }
    
    /**
     * Vérifie un mot de passe haché
     */
    public static function verifyPassword($password, $hash) {
        return sec_verifyPassword($password, $hash);
    }
    
    /**
     * Génère un token de réinitialisation sécurisé
     */
    public static function generateResetToken() {
        return bin2hex(random_bytes(32));
    }
    
    /**
     * Nettoie et valide une adresse IP
     */
    public static function getClientIP() {
        $ipKeys = ['HTTP_X_FORWARDED_FOR', 'HTTP_X_REAL_IP', 'HTTP_CLIENT_IP', 'REMOTE_ADDR'];
        
        foreach ($ipKeys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Log des tentatives de sécurité
     */
    public static function logSecurityEvent($event, $details = []) {
        $logData = [
            'timestamp' => date('Y-m-d H:i:s'),
            'ip' => self::getClientIP(),
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            'event' => $event,
            'details' => $details
        ];
        
        $logFile = __DIR__ . '/logs/security.log';
        $logDir = dirname($logFile);
        
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        file_put_contents($logFile, json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);
    }
}