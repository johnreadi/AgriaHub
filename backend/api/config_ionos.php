<?php
/**
 * Configuration sécurisée pour AGRIA ROUEN - VERSION IONOS
 * Compatible avec hébergement mutualisé IONOS MySQL
 */

// Suppression de l’inclusion de Security.php (simplification)
// require_once __DIR__ . '/Security.php';

// Démarrage sécurisé de la session
if (session_status() === PHP_SESSION_NONE) {
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', 1);
    ini_set('session.use_strict_mode', 1);
    session_start();
}

// ⚠️ CONFIGURATION IONOS - À MODIFIER AVEC VOS VRAIES DONNÉES
// Remplacez ces valeurs par celles fournies par IONOS
define('DB_HOST', 'db5018629781.hosting-data.io');  // Serveur MySQL IONOS
define('DB_NAME', 'dbs14768810');                    // Nom de votre base de données
define('DB_USER', 'dbu3279635');                      // Utilisateur MySQL
define('DB_PASS', 'Resto.AgriaRouen76100');           // Mot de passe MySQL
define('DB_CHARSET', 'utf8mb4');

// URL de base de l'API (votre domaine IONOS)
define('API_BASE_URL', 'https://mobile.agriarouen.fr/api/');

// Clé secrète JWT (générez une clé unique et sécurisée)
define('JWT_SECRET', 'agria_rouen_jwt_secret_key_2024_secure_' . hash('sha256', DB_HOST . DB_NAME . 'salt_2024'));

// Clé API Gemini (depuis .env - pour les fonctionnalités IA)
define('GEMINI_API_KEY', 'AIzaSyAKMJDkoitiEgTGGWQC6z5VLr9re7NhiQs');

// Configuration de sécurité
define('ENVIRONMENT', 'production'); // Production sur IONOS
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes
define('SESSION_TIMEOUT', 3600); // 1 heure

// Configuration de la base de données sécurisée pour IONOS MySQL
class Database {
    private $host = DB_HOST;
    private $db_name = DB_NAME;
    private $username = DB_USER;
    private $password = DB_PASS;
    private $conn;

    public function getConnection() {
        $this->conn = null;
        
        try {
            // Configuration MySQL pour IONOS
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                PDO::ATTR_TIMEOUT            => 30,
                PDO::ATTR_PERSISTENT         => false
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // Configuration de sécurité MySQL
            $this->conn->exec("SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER,NO_ENGINE_SUBSTITUTION'");
            
        } catch(PDOException $exception) {
            if (ENVIRONMENT === 'development') {
                error_log("Erreur de connexion DB: " . $exception->getMessage());
            }
            throw new Exception("Erreur de connexion à la base de données MySQL");
        }
        
        return $this->conn;
    }
}

// Headers de sécurité
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

// Configuration CORS sécurisée pour IONOS
$allowedOrigins = [
    'https://mobile.agriarouen.fr',           // Remplacez par votre domaine
    'https://mobile.agriarouen.fr',       // Remplacez par votre domaine
    'http://localhost:3000'               // Pour le développement local
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header("Access-Control-Allow-Origin: " . $origin);
} else {
    header("Access-Control-Allow-Origin: https://mobile.agriarouen.fr"); // Remplacez par votre domaine
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-CSRF-Token");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Max-Age: 86400");

// Gestion des requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fonction utilitaire pour les réponses JSON sécurisées
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

// Fonction de logging sécurisé
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
        mkdir($logDir, 0755, true);
    }
    
    file_put_contents($logFile, json_encode($logData) . "\n", FILE_APPEND | LOCK_EX);
}

// Suppression de l’inclusion conditionnelle de Security.php
// if (file_exists(__DIR__ . '/Security.php')) {
//     require_once __DIR__ . '/Security.php';
// }

// Test de connexion à la base de données (pour debug)
function testDatabaseConnection() {
    try {
        $db = new Database();
        $conn = $db->getConnection();
        
        // Test simple
        $stmt = $conn->query("SELECT 1 as test");
        $result = $stmt->fetch();
        
        if ($result && $result['test'] == 1) {
            return ['success' => true, 'message' => 'Connexion MySQL réussie'];
        } else {
            return ['success' => false, 'message' => 'Test de requête échoué'];
        }
        
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Erreur: ' . $e->getMessage()];
    }
}

?>