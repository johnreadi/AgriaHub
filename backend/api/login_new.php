<?php
/**
 * API de connexion simplifiée pour AGRIA ROUEN
 * Compatible avec hébergement IONOS
 */

// Configuration des headers CORS et sécurité
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Gestion des requêtes OPTIONS (CORS préflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Seules les requêtes POST sont autorisées
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// Fonction de réponse JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Fonction de logging des erreurs
function logError($message, $context = []) {
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message,
        'context' => $context,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];

    $logFile = __DIR__ . '/logs/login_errors.log';
    $logDir = dirname($logFile);

    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }

    @file_put_contents($logFile, json_encode($logData) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

// Récupération des données d'entrée
function getRequestData() {
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

    // Essayer de lire depuis php://input (JSON)
    $raw = file_get_contents('php://input') ?: '';

    if (strpos($contentType, 'application/json') !== false && $raw !== '') {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }

    // Fallback vers $_POST
    if (!empty($_POST) && is_array($_POST)) {
        return $_POST;
    }

    // Dernier recours : parser la chaîne brute
    if ($raw !== '') {
        parse_str($raw, $parsed);
        if (is_array($parsed) && !empty($parsed)) {
            return $parsed;
        }
    }

    return [];
}

// Configuration base de données
$DB_HOST = 'db5018629781.hosting-data.io';
$DB_NAME = 'dbs14768810';
$DB_USER = 'dbu3279635';
$DB_PASS = 'Resto.AgriaRouen76100';

// Récupération des données
$data = getRequestData();
$identifier = trim($data['identifier'] ?? $data['username'] ?? $data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($identifier) || empty($password)) {
    logError('Données manquantes', ['identifier' => $identifier, 'has_password' => !empty($password)]);
    jsonResponse(['error' => 'Identifiant et mot de passe requis'], 400);
}

try {
    // Connexion PDO
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 30
        ]
    );

    // Vérifier les colonnes disponibles
    $columns = [];
    $hasEmail = false;
    $hasUsername = false;
    $hasFirst = false;
    $hasLast = false;
    $hasCard = false;

    try {
        $schemaCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'email'");
        $hasEmail = $schemaCheck->rowCount() > 0;
    } catch (Exception $e) { }

    try {
        $schemaCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'username'");
        $hasUsername = $schemaCheck->rowCount() > 0;
    } catch (Exception $e) { }

    try {
        $schemaCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'first_name'");
        $hasFirst = $schemaCheck->rowCount() > 0;
    } catch (Exception $e) { }

    try {
        $schemaCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'last_name'");
        $hasLast = $schemaCheck->rowCount() > 0;
    } catch (Exception $e) { }

    try {
        $schemaCheck = $pdo->query("SHOW COLUMNS FROM users LIKE 'card_number'");
        $hasCard = $schemaCheck->rowCount() > 0;
    } catch (Exception $e) { }

    // Construire la requête selon les colonnes disponibles
    if ($hasEmail) {
        $columns[] = 'LOWER(email) = :identifier_lower';
    }
    if ($hasUsername) {
        $columns[] = 'LOWER(username) = :identifier_lower';
    }
    if ($hasFirst) {
        $columns[] = 'LOWER(first_name) = :identifier_lower';
    }
    if ($hasLast) {
        $columns[] = 'LOWER(last_name) = :identifier_lower';
    }
    if ($hasFirst && $hasLast) {
        $columns[] = "LOWER(CONCAT_WS(' ', first_name, last_name)) = :identifier_collapsed";
        $columns[] = "LOWER(CONCAT_WS(' ', last_name, first_name)) = :identifier_collapsed";
    }
    if ($hasCard) {
        $columns[] = 'card_number = :identifier_raw';
    }

    if (empty($columns)) {
        logError('Aucune colonne de connexion disponible');
        jsonResponse(['error' => 'Configuration base de données invalide'], 500);
    }

    // Construire la requête SELECT
    $selectParts = ['id', 'password'];
    if ($hasEmail) { $selectParts[] = 'email'; }
    if ($hasUsername) { $selectParts[] = 'username'; }
    if ($pdo->query("SHOW COLUMNS FROM users LIKE 'role'")->rowCount() > 0) {
        $selectParts[] = 'role';
    }
    if ($hasFirst) { $selectParts[] = 'first_name'; }
    if ($hasLast) { $selectParts[] = 'last_name'; }

    // Conditions d'activité
    $activeConditions = [];
    if ($pdo->query("SHOW COLUMNS FROM users LIKE 'is_active'")->rowCount() > 0) {
        $activeConditions[] = 'is_active = 1';
    }
    if ($pdo->query("SHOW COLUMNS FROM users LIKE 'active'")->rowCount() > 0) {
        $activeConditions[] = 'active = 1';
    }

    // Requête finale
    $sql = 'SELECT ' . implode(', ', $selectParts) . ' FROM users WHERE (' . implode(' OR ', $columns) . ')';
    if (!empty($activeConditions)) {
        $sql .= ' AND (' . implode(' OR ', $activeConditions) . ')';
    }
    $sql .= ' LIMIT 1';

    // Préparation et exécution
    $stmt = $pdo->prepare($sql);
    $identifierLower = mb_strtolower($identifier, 'UTF-8');
    $identifierCollapsed = preg_replace('/\s+/', ' ', $identifierLower);

    $stmt->bindValue(':identifier_lower', $identifierLower);
    if (strpos($sql, ':identifier_collapsed') !== false) {
        $stmt->bindValue(':identifier_collapsed', $identifierCollapsed);
    }
    if (strpos($sql, ':identifier_raw') !== false) {
        $stmt->bindValue(':identifier_raw', $identifier);
    }

    $stmt->execute();
    $user = $stmt->fetch();

    if (!$user) {
        logError('Utilisateur non trouvé', ['identifier' => $identifier]);
        jsonResponse(['error' => 'Identifiants invalides'], 401);
    }

    // Vérification du mot de passe
    $passwordHash = $user['password'] ?? '';
    unset($user['password']);

    $isValid = false;
    if (!empty($passwordHash)) {
        // Essayer password_verify d'abord
        if (sec_verifyPassword($password, $passwordHash)) {
            $isValid = true;
        }
        // Fallback vers comparaison directe (pour mots de passe en clair)
        elseif (hash_equals($passwordHash, $password)) {
            $isValid = true;
        }
        // Fallback vers anciens hachages
        elseif (hash_equals($passwordHash, md5($password)) || hash_equals($passwordHash, sha1($password))) {
            $isValid = true;
        }
    }

    if (!$isValid) {
        logError('Mot de passe invalide', ['identifier' => $identifier]);
        jsonResponse(['error' => 'Identifiants invalides'], 401);
    }

    // Succès
    logError('Connexion réussie', ['identifier' => $identifier]);
    jsonResponse([
        'success' => true,
        'message' => 'Connexion réussie',
        'user' => $user
    ]);

} catch (PDOException $e) {
    logError('Erreur base de données', [
        'error' => $e->getMessage(),
        'code' => $e->getCode(),
        'identifier' => $identifier
    ]);
    jsonResponse(['error' => 'Erreur de connexion à la base de données'], 500);

} catch (Exception $e) {
    logError('Erreur générale', [
        'error' => $e->getMessage(),
        'identifier' => $identifier
    ]);
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}
