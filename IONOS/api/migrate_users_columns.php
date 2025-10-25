<?php
// Migration des colonnes manquantes dans la table `users`
// Usage: appeler ce script via HTTP
// - Dry-run (par défaut): /api/migrate_users_columns.php
// - Exécution: /api/migrate_users_columns.php?migrate=1
// - Debug optionnel: &debug=1

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$doMigrate = isset($_GET['migrate']) && $_GET['migrate'] == '1';
$debug = isset($_GET['debug']) && $_GET['debug'] == '1';

function jsonResponse(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function safeMessage($e): string {
    return ($e instanceof Throwable) ? $e->getMessage() : (string)$e;
}

try {
    // Charger la configuration pour DSN MySQL
    require_once __DIR__ . '/config.php';
    
    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        defined('DB_HOST') ? DB_HOST : 'localhost',
        defined('DB_PORT') ? DB_PORT : 3306,
        defined('DB_NAME') ? DB_NAME : ''
    );

    $pdo = new PDO($dsn, defined('DB_USER') ? DB_USER : '', defined('DB_PASS') ? DB_PASS : '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // Utilitaires
    $dbName = defined('DB_NAME') ? DB_NAME : '';

    $columnExists = function(string $table, string $column) use ($pdo, $dbName): bool {
        $sql = "SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND COLUMN_NAME = :column LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':schema' => $dbName, ':table' => $table, ':column' => $column]);
        return (bool)$stmt->fetchColumn();
    };

    $indexExists = function(string $table, string $indexName) use ($pdo, $dbName): bool {
        $sql = "SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = :schema AND TABLE_NAME = :table AND INDEX_NAME = :index LIMIT 1";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':schema' => $dbName, ':table' => $table, ':index' => $indexName]);
        return (bool)$stmt->fetchColumn();
    };

    $actions = [];
    $errors = [];

    // Plan de migration des colonnes `users`
    $columnsPlan = [
        // nom => SQL d’ajout
        'first_name' => "ALTER TABLE `users` ADD COLUMN `first_name` VARCHAR(100) NOT NULL DEFAULT '' AFTER `email`",
        'last_name' => "ALTER TABLE `users` ADD COLUMN `last_name` VARCHAR(100) NOT NULL DEFAULT '' AFTER `first_name`",
        'phone' => "ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NOT NULL DEFAULT '' AFTER `last_name`",
        'role' => "ALTER TABLE `users` ADD COLUMN `role` ENUM('user','admin','manager') NOT NULL DEFAULT 'user' AFTER `phone`",
        'active' => "ALTER TABLE `users` ADD COLUMN `active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `role`",
        'failed_login_attempts' => "ALTER TABLE `users` ADD COLUMN `failed_login_attempts` INT NOT NULL DEFAULT 0 AFTER `active`",
        'last_failed_login' => "ALTER TABLE `users` ADD COLUMN `last_failed_login` TIMESTAMP NULL DEFAULT NULL AFTER `failed_login_attempts`",
        'last_login' => "ALTER TABLE `users` ADD COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL AFTER `last_failed_login`",
        // Optionnel: certaines parties du code supportent `is_active` en plus de `active`
        'is_active' => "ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `active`",
    ];

    $indexesPlan = [
        // index_name => SQL d’ajout
        'idx_active' => "ALTER TABLE `users` ADD INDEX `idx_active` (`active`)",
        'idx_role'   => "ALTER TABLE `users` ADD INDEX `idx_role` (`role`)",
    ];

    // Vérifications et constitution du plan
    foreach ($columnsPlan as $col => $sqlAdd) {
        $exists = $columnExists('users', $col);
        $actions[] = [
            'type' => 'column', 'name' => $col, 'exists' => $exists,
            'sql' => $exists ? null : $sqlAdd
        ];
    }

    foreach ($indexesPlan as $idx => $sqlAddIdx) {
        $exists = $indexExists('users', $idx);
        $actions[] = [
            'type' => 'index', 'name' => $idx, 'exists' => $exists,
            'sql' => $exists ? null : $sqlAddIdx
        ];
    }

    // Dry-run
    if (!$doMigrate) {
        jsonResponse([
            'success' => true,
            'mode' => 'dry_run',
            'message' => 'Aucune modification appliquée. Passez migrate=1 pour exécuter.',
            'planned_actions' => $actions,
            'debug' => $debug,
        ]);
    }

    // Exécution
    foreach ($actions as $action) {
        if ($action['exists']) { continue; }
        if (empty($action['sql'])) { continue; }
        try {
            $pdo->exec($action['sql']);
            $action['applied'] = true;
        } catch (Throwable $e) {
            $action['applied'] = false;
            $action['error'] = safeMessage($e);
            $errors[] = [
                'name' => $action['name'],
                'type' => $action['type'],
                'error' => safeMessage($e),
                'sql' => $action['sql'],
            ];
        }
    }

    $allOk = empty($errors);
    jsonResponse([
        'success' => $allOk,
        'mode' => 'execute',
        'message' => $allOk ? 'Migration appliquée avec succès.' : 'Migration partiellement appliquée. Voir erreurs.',
        'applied_actions' => $actions,
        'errors' => $errors,
        'debug' => $debug,
    ], $allOk ? 200 : 500);

} catch (Throwable $e) {
    jsonResponse([
        'success' => false,
        'error' => 'Erreur interne',
        'message' => safeMessage($e),
    ], 500);
}