<?php
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

$data = getRequestPayload();
$identifier = trim($data['identifier'] ?? $data['username'] ?? $data['email'] ?? '');
$password = $data['password'] ?? '';

if ($identifier === '' || $password === '') {
    jsonResponse(['error' => 'Identifiant et mot de passe requis'], 400);
}

try {
    $pdo = getPdoConnection();

    $columns = [];
    $hasUsername = columnExists($pdo, 'users', 'username');
    $hasEmail = columnExists($pdo, 'users', 'email');
    $hasFirst = columnExists($pdo, 'users', 'first_name');
    $hasLast = columnExists($pdo, 'users', 'last_name');
    $hasCard = columnExists($pdo, 'users', 'card_number');

    // Construire conditions avec placeholders uniques pour éviter HY093
    $columns = [];
    $binds = [];
    $lowerIdx = 0; $fullIdx = 0;
    $identifierLower = mb_strtolower($identifier, 'UTF-8');
    $identifierCollapsed = preg_replace('/\s+/', ' ', $identifierLower);
    $addLower = function($column) use (&$columns, &$binds, &$lowerIdx, $identifierLower) {
        $ph = ':identifier_lower_' . $lowerIdx++;
        $columns[] = "LOWER($column) = $ph";
        $binds[$ph] = $identifierLower;
    };
    if ($hasUsername) { $addLower('username'); }
    if ($hasEmail) { $addLower('email'); }
    if ($hasFirst) { $addLower('first_name'); }
    if ($hasLast) { $addLower('last_name'); }
    if ($hasFirst && $hasLast) {
        $ph1 = ':identifier_collapsed_' . $fullIdx++;
        $ph2 = ':identifier_collapsed_' . $fullIdx++;
        $columns[] = "LOWER(CONCAT_WS(' ', first_name, last_name)) = $ph1";
        $columns[] = "LOWER(CONCAT_WS(' ', last_name, first_name)) = $ph2";
        $binds[$ph1] = $identifierCollapsed;
        $binds[$ph2] = $identifierCollapsed;
    }
    if ($hasCard) { $columns[] = 'card_number = :identifier_raw'; $binds[':identifier_raw'] = $identifier; }

    if (empty($columns)) {
        jsonResponse(['error' => 'Aucune colonne utilisable pour la connexion'], 500);
    }

    $activeFilters = [];
    if (columnExists($pdo, 'users', 'is_active')) { $activeFilters[] = 'is_active = 1'; }
    if (columnExists($pdo, 'users', 'active')) { $activeFilters[] = 'active = 1'; }

    $selectColumns = ['id'];
    if ($hasUsername) { $selectColumns[] = 'username'; }
    if ($hasEmail) { $selectColumns[] = 'email'; }
    if (columnExists($pdo, 'users', 'role')) { $selectColumns[] = 'role'; }
    if (columnExists($pdo, 'users', 'first_name')) { $selectColumns[] = 'first_name'; }
    if (columnExists($pdo, 'users', 'last_name')) { $selectColumns[] = 'last_name'; }
    if (!in_array('password', $selectColumns, true)) { $selectColumns[] = 'password'; }

    $sql = 'SELECT ' . implode(', ', $selectColumns) . ' FROM users WHERE (' . implode(' OR ', $columns) . ')';
// Désactivé: pas de filtre actif/is_active pour méthode standard
// if (!empty($activeFilters)) {
//     $sql .= ' AND (' . implode(' OR ', $activeFilters) . ')';
// }
$sql .= ' LIMIT 1';

    $stmt = $pdo->prepare($sql);
    foreach ($binds as $k => $v) { $stmt->bindValue($k, $v); }
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        jsonResponse(['error' => 'Identifiants invalides'], 401);
    }

    $passwordHash = $user['password'] ?? '';
    unset($user['password']);

    $isValid = false;
    if ($passwordHash !== '') {
        if (sec_verifyPassword($password, $passwordHash)) {
            $isValid = true;
        } elseif (hash_equals($passwordHash, $password)) {
            $isValid = true;
        } elseif (hash_equals($passwordHash, md5($password)) || hash_equals($passwordHash, sha1($password))) {
            $isValid = true;
        }
    }

    if (!$isValid) {
        jsonResponse(['error' => 'Identifiants invalides'], 401);
    }

    jsonResponse([
        'success' => true,
        'message' => 'Connexion réussie',
        'user' => $user,
    ]);

} catch (Throwable $e) {
    logError('simple_login_failure', ['error' => $e->getMessage()]);
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}

function getRequestPayload(): array {
    $contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');
    $raw = file_get_contents('php://input') ?: '';
    if (strpos($contentType, 'application/json') !== false) {
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) { return $decoded; }
    }
    if (!empty($_POST)) { return $_POST; }
    if ($raw !== '') {
        parse_str($raw, $parsed);
        if (is_array($parsed)) { return $parsed; }
    }
    return [];
}

function getPdoConnection(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) { return $pdo; }
    $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME);
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function columnExists(PDO $pdo, string $table, string $column): bool {
    static $cache = [];
    $cacheKey = $table . ':' . $column;
    if (array_key_exists($cacheKey, $cache)) {
        return $cache[$cacheKey];
    }
    $sql = 'SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND COLUMN_NAME = :column LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':schema' => DB_NAME,
        ':table' => $table,
        ':column' => $column,
    ]);
    $exists = (bool)$stmt->fetchColumn();
    $cache[$cacheKey] = $exists;
    return $exists;
}

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
