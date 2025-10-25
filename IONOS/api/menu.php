<?php
/**
 * API Endpoint pour la gestion des menus
 * AGRIA ROUEN - Gestion des menus hebdomadaires
 */

require_once 'config.php';

// Initialisation de la base de données
try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    logError("Erreur de connexion à la base de données: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur de connexion à la base de données'], 500);
    exit;
}

// Gestion des requêtes CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Access-Token');
    http_response_code(200);
    exit;
}

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Access-Token');
header('Content-Type: application/json; charset=utf-8');

// === Helpers d'authentification locaux (cookies/Bearer) ===
function getCookieTokenLocal() {
    $t = null;
    if (isset($_COOKIE['AGRIA_TOKEN']) && is_string($_COOKIE['AGRIA_TOKEN'])) { $t = trim($_COOKIE['AGRIA_TOKEN']); }
    if (!$t && isset($_COOKIE['auth_token']) && is_string($_COOKIE['auth_token'])) { $t = trim($_COOKIE['auth_token']); }
    return $t ?: null;
}
function getBearerTokenLocal() {
    // Cookies en priorité
    $cookieToken = getCookieTokenLocal();
    if ($cookieToken) { return $cookieToken; }
    // Puis Authorization / X-Access-Token
    $auth = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
    if ($auth === '' && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) { $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION']; }
    if (preg_match('/^Bearer\s+(.*)$/i', $auth, $m)) { return $m[1]; }
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $xToken = $headers['X-Access-Token'] ?? $headers['x-access-token'] ?? null;
    if ($xToken) { return is_string($xToken) ? trim($xToken) : null; }
    return null;
}
function requireAuthLocal() {
    $token = getBearerTokenLocal();
    if (!$token || !sec_verifyJWT($token)) { jsonResponse(['error' => 'Accès non autorisé'], 401); }
}

// Gestion des requêtes
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            handleGetMenu($db);
            break;
        case 'POST':
            handleSaveMenu($db);
            break;
        default:
            jsonResponse(['error' => 'Méthode non autorisée'], 405);
    }
} catch (Exception $e) {
    logError("Erreur dans menu.php: " . $e->getMessage());
    jsonResponse(['error' => 'Erreur interne du serveur'], 500);
}

/**
 * Récupérer le menu hebdomadaire
 */
function handleGetMenu($db) {
    try {
        // Préférer weekly_menus.metadata + is_published, fallback sur menu_data + is_active si metadata absente
        $conn = $db; // PDO
        $hasMetadata = false; $hasMenuData = false; $hasIsPublished = false; $hasIsActive = false;
        $hasStartDate = false; $hasCreatedAt = false;
        try { $hasMetadata = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'metadata'")->fetch(); } catch (Exception $e) { $hasMetadata = false; }
        try { $hasMenuData = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'menu_data'")->fetch(); } catch (Exception $e) { $hasMenuData = false; }
        try { $hasIsPublished = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'is_published'")->fetch(); } catch (Exception $e) { $hasIsPublished = false; }
        try { $hasIsActive = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'is_active'")->fetch(); } catch (Exception $e) { $hasIsActive = false; }
        try { $hasStartDate = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'start_date'")->fetch(); } catch (Exception $e) { $hasStartDate = false; }
        try { $hasCreatedAt = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'created_at'")->fetch(); } catch (Exception $e) { $hasCreatedAt = false; }

        // Choisir la colonne JSON et le flag d'état
        $jsonCol = $hasMetadata ? 'metadata' : ($hasMenuData ? 'menu_data' : null);
        $activeClause = $hasIsPublished ? 'is_published = 1' : ($hasIsActive ? 'is_active = 1' : '1=1');
        $orderClause = $hasStartDate ? 'start_date DESC' : ($hasCreatedAt ? 'created_at DESC' : 'id DESC');

        $json = null;
        if ($jsonCol) {
            $sql = "SELECT $jsonCol FROM weekly_menus WHERE $activeClause ORDER BY $orderClause LIMIT 1";
            $stmt = $conn->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($result && isset($result[$jsonCol])) { $json = $result[$jsonCol]; }
        }

        if ($json) {
            $menuData = json_decode($json, true);
            if ($menuData) { jsonResponse($menuData); }
        }
        jsonResponse(null);
    } catch (Exception $e) {
        logError("Erreur lors de la récupération du menu: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la récupération du menu'], 500);
    }
}

/**
 * Sauvegarder le menu hebdomadaire
 */
function handleSaveMenu($db) {
    try {
        // Exiger une authentification JWT valide
        requireAuthLocal();
        $token = getBearerTokenLocal();
        $user_data = null;
        try {
            $user_data = sec_verifyJWT($token, (defined('JWT_SECRET') ? JWT_SECRET : null));
        } catch (Throwable $ve) {
            logError('menu_save_verifyjwt_failed', ['error' => $ve->getMessage()]);
        }
        if (!$user_data) { jsonResponse(['error' => 'Accès non autorisé'], 401); return; }

        // Récupérer les données du menu
        $input = getRequestData();
        if (!$input || !is_array($input)) { jsonResponse(['error' => 'Données de menu invalides'], 400); return; }

        // Valider la structure du menu
        $requiredDays = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI'];
        foreach ($requiredDays as $day) {
            if (!isset($input[$day])) { jsonResponse(['error' => "Jour manquant: $day"], 400); return; }
        }

        // Détection du schéma de table
        $conn = $db; // PDO
        $hasMetadata = false; $hasMenuData = false; $hasIsPublished = false; $hasIsActive = false;
        $hasWeekNumber = false; $hasYear = false; $hasStartDate = false; $hasEndDate = false;
        $hasCreatedBy = false; $hasUpdatedBy = false; $hasCreatedAt = false; $hasUpdatedAt = false;
        try { $hasMetadata = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'metadata'")->fetch(); } catch (Exception $e) { $hasMetadata = false; }
        try { $hasMenuData = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'menu_data'")->fetch(); } catch (Exception $e) { $hasMenuData = false; }
        try { $hasIsPublished = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'is_published'")->fetch(); } catch (Exception $e) { $hasIsPublished = false; }
        try { $hasIsActive = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'is_active'")->fetch(); } catch (Exception $e) { $hasIsActive = false; }
        try { $hasWeekNumber = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'week_number'")->fetch(); } catch (Exception $e) { $hasWeekNumber = false; }
        try { $hasYear = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'year'")->fetch(); } catch (Exception $e) { $hasYear = false; }
        try { $hasStartDate = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'start_date'")->fetch(); } catch (Exception $e) { $hasStartDate = false; }
        try { $hasEndDate = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'end_date'")->fetch(); } catch (Exception $e) { $hasEndDate = false; }
        try { $hasCreatedBy = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'created_by'")->fetch(); } catch (Exception $e) { $hasCreatedBy = false; }
        try { $hasUpdatedBy = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'updated_by'")->fetch(); } catch (Exception $e) { $hasUpdatedBy = false; }
        try { $hasCreatedAt = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'created_at'")->fetch(); } catch (Exception $e) { $hasCreatedAt = false; }
        try { $hasUpdatedAt = (bool)$conn->query("SHOW COLUMNS FROM weekly_menus LIKE 'updated_at'")->fetch(); } catch (Exception $e) { $hasUpdatedAt = false; }

        // Désactiver l'ancien actif/publié
        if ($hasIsPublished) { try { $conn->exec("UPDATE weekly_menus SET is_published = 0 WHERE is_published = 1"); } catch (Exception $e) {} }
        else if ($hasIsActive) { try { $conn->exec("UPDATE weekly_menus SET is_active = 0 WHERE is_active = 1"); } catch (Exception $e) {} }

        $menuJson = json_encode($input, JSON_UNESCAPED_UNICODE);

        // Calculer les infos de semaine
        $today = new DateTimeImmutable('today');
        $weekNumber = intval($today->format('W'));
        $year = intval($today->format('o'));
        $startOfWeek = new DateTimeImmutable('monday this week');
        $endOfWeek = $startOfWeek->modify('+4 days');
        $startDate = $startOfWeek->format('Y-m-d');
        $endDate = $endOfWeek->format('Y-m-d');

        // Extraire l'ID utilisateur depuis différents champs de payload
        $userId = null; $emailFromToken = null;
        if (is_array($user_data)) {
            $userId = $user_data['user_id'] ?? $user_data['id'] ?? ($user_data['sub'] ?? null);
            $emailFromToken = $user_data['email'] ?? null;
        }
        // Fallback: chercher l'id utilisateur via l'email si non présent dans le JWT
        if (($userId === null || intval($userId) === 0) && $emailFromToken) {
            try {
                $stmtU = $conn->prepare("SELECT id FROM users WHERE email = ? LIMIT 1");
                $stmtU->execute([$emailFromToken]);
                $urow = $stmtU->fetch(PDO::FETCH_ASSOC);
                if ($urow && isset($urow['id'])) { $userId = intval($urow['id']); }
            } catch (Exception $e) {
                logError('lookup_user_id_failed', ['email' => $emailFromToken, 'error' => $e->getMessage()]);
            }
        }
        $createdBy = (isset($userId) && intval($userId) > 0) ? intval($userId) : null;
        if ($createdBy === null) { jsonResponse(['error' => 'Accès non autorisé (user_id manquant)'], 403); return; }

        // Construire l'INSERT dynamiquement selon les colonnes disponibles
        $columns = [];
        $placeholders = [];
        $values = [];

        if ($hasWeekNumber) { $columns[] = 'week_number'; $placeholders[] = '?'; $values[] = $weekNumber; }
        if ($hasYear) { $columns[] = 'year'; $placeholders[] = '?'; $values[] = $year; }
        if ($hasStartDate) { $columns[] = 'start_date'; $placeholders[] = '?'; $values[] = $startDate; }
        if ($hasEndDate) { $columns[] = 'end_date'; $placeholders[] = '?'; $values[] = $endDate; }
        if ($hasMetadata) { $columns[] = 'metadata'; $placeholders[] = '?'; $values[] = $menuJson; }
        else if ($hasMenuData) { $columns[] = 'menu_data'; $placeholders[] = '?'; $values[] = $menuJson; }
        if ($hasIsPublished) { $columns[] = 'is_published'; $placeholders[] = '1'; }
        else if ($hasIsActive) { $columns[] = 'is_active'; $placeholders[] = '1'; }
        // Inclure created_by uniquement si une valeur est disponible pour éviter les contraintes NOT NULL/foreign key
        if ($hasCreatedBy && $createdBy !== null) { $columns[] = 'created_by'; $placeholders[] = '?'; $values[] = $createdBy; }
        if ($hasCreatedAt) { $columns[] = 'created_at'; $placeholders[] = 'NOW()'; }
        if ($hasUpdatedBy && $createdBy !== null) { $columns[] = 'updated_by'; $placeholders[] = '?'; $values[] = $createdBy; }
        if ($hasUpdatedAt) { $columns[] = 'updated_at'; $placeholders[] = 'NOW()'; }

        if (empty($columns)) {
            jsonResponse(['error' => 'Schéma weekly_menus incompatible (aucune colonne utilisable)'], 500);
            return;
        }

        // Construire la partie ON DUPLICATE KEY UPDATE selon les colonnes présentes
        $updates = [];
        if ($hasMetadata) { $updates[] = 'metadata = VALUES(metadata)'; }
        if ($hasMenuData) { $updates[] = 'menu_data = VALUES(menu_data)'; }
        if ($hasIsPublished) { $updates[] = 'is_published = 1'; }
        if ($hasIsActive) { $updates[] = 'is_active = 1'; }
        if ($hasUpdatedBy) { $updates[] = 'updated_by = VALUES(updated_by)'; }
        if ($hasUpdatedAt) { $updates[] = 'updated_at = VALUES(updated_at)'; }

        $colsSql = implode(', ', $columns);
        $valsSql = implode(', ', $placeholders);
        $sql = "INSERT INTO weekly_menus ($colsSql) VALUES ($valsSql)";
        if (!empty($updates)) { $sql .= " ON DUPLICATE KEY UPDATE " . implode(', ', $updates); }

        $stmt = $conn->prepare($sql);
        $ok = $stmt->execute($values);

        if (!empty($ok)) {
            $lastId = method_exists($conn, 'lastInsertId') ? $conn->lastInsertId() : null;
            jsonResponse(['success' => true, 'message' => 'Menu sauvegardé avec succès', 'menu_id' => $lastId]);
        } else {
            // Log erreur détaillée côté serveur
            try {
                $info = is_object($stmt) && method_exists($stmt, 'errorInfo') ? $stmt->errorInfo() : null;
                if (is_array($info)) { logError('weekly_menus INSERT failed', ['sqlstate' => ($info[0] ?? null), 'code' => ($info[1] ?? null), 'msg' => ($info[2] ?? null)]); }
            } catch (Exception $ex) {}
            // Mode debug: retourner quelques détails si autorisé
            $headers = function_exists('getallheaders') ? getallheaders() : [];
            $allowDebug = false;
            if (!empty($_GET['debug'])) { $allowDebug = true; }
            if (isset($headers['X-Debug']) && $headers['X-Debug'] === '1') { $allowDebug = true; }
            if (isset($headers['x-debug']) && $headers['x-debug'] === '1') { $allowDebug = true; }
            if ($allowDebug) {
                $ei = is_object($stmt) && method_exists($stmt, 'errorInfo') ? $stmt->errorInfo() : null;
                jsonResponse(['error' => 'Erreur lors de la sauvegarde du menu', 'details' => $ei], 500);
            } else {
                jsonResponse(['error' => 'Erreur lors de la sauvegarde du menu'], 500);
            }
        }
    } catch (Exception $e) {
        logError("Erreur lors de la sauvegarde du menu: " . $e->getMessage());
        jsonResponse(['error' => 'Erreur lors de la sauvegarde du menu'], 500);
    }
}

/**
 * Valider le token JWT
 */
function base64url_decode($data) {
    $b64 = strtr($data, '-_', '+/');
    $pad = strlen($b64) % 4;
    if ($pad) { $b64 .= str_repeat('=', 4 - $pad); }
    return base64_decode($b64);
}
function validateToken($token) {
    if (!$token) {
        return false;
    }

    try {
        // Décoder le token JWT (implémentation simplifiée)
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        $payload = json_decode(base64url_decode($parts[1]), true);
        if (!$payload || !is_array($payload)) {
            return false;
        }
        
        // Vérifier l'expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }

        return $payload;
    } catch (Exception $e) {
        return false;
    }
}