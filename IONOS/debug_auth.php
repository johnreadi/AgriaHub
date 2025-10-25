<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain; charset=utf-8');

// Debug d'authentification AUTONOME (sans classe Database)
// Utilise les identifiants IONOS confirmés

define('DB_HOST', 'db5018629781.hosting-data.io');
define('DB_NAME', 'dbs14768810');
define('DB_USER', 'dbu3279635');
define('DB_PASS', 'Resto.AgriaRouen76100');
$dsn = 'mysql:host=' . DB_HOST . ';port=3306;dbname=' . DB_NAME . ';charset=utf8mb4';
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => 'SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci',
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
    PDO::ATTR_TIMEOUT => 30,
    PDO::ATTR_PERSISTENT => false,
];

// Paramètres via URL
$inputEmail = isset($_GET['email']) ? trim($_GET['email']) : 'admin@agria-rouen.fr';
$inputCard  = isset($_GET['cardNumber']) ? trim($_GET['cardNumber']) : '';
$inputIdent = isset($_GET['identifiant']) ? trim($_GET['identifiant']) : '';
$inputPwd   = isset($_GET['password']) ? (string)$_GET['password'] : (isset($_GET['motdepasse']) ? (string)$_GET['motdepasse'] : 'admin123');
$loginValue = $inputIdent !== '' ? $inputIdent : ($inputCard !== '' ? $inputCard : $inputEmail);

function out($text) { echo $text . "\n"; }

out("=== DEBUG AUTHENTIFICATION AUTONOME ===");

// Connexion DB
out("1. Test de connexion à la base de données...");
try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    $val = (int)$pdo->query('SELECT 1')->fetchColumn();
    out($val === 1 ? '✓ SELECT 1 OK' : '✗ SELECT 1 KO');
} catch (Exception $e) {
    out('✗ Erreur de connexion DB: ' . $e->getMessage());
    out('Arrêt du debug.');
    exit;
}

// Détecter dynamiquement les colonnes disponibles
$cols = [];
try {
    $stmtCols = $pdo->query('SHOW COLUMNS FROM users');
    $cols = array_map(function($r){ return $r['Field'] ?? $r[0] ?? ''; }, $stmtCols->fetchAll());
} catch (Exception $e) {
    out('⚠️ Impossible de lister les colonnes (SHOW COLUMNS): ' . $e->getMessage());
}
$hasBalance = in_array('balance', $cols, true);
$hasIsActive = in_array('is_active', $cols, true);
$hasActive   = in_array('active', $cols, true);
$hasCardNum  = in_array('card_number', $cols, true);

// Construire les champs SELECT de manière sûre
$selectFields = [
    'id', 'first_name', 'last_name', 'email', 'password', 'role',
];
if ($hasIsActive) { $selectFields[] = 'is_active'; }
elseif ($hasActive) { $selectFields[] = 'active AS is_active'; }
if ($hasCardNum) { $selectFields[] = 'card_number'; }
if ($hasBalance) { $selectFields[] = 'balance AS card_balance'; }
$selectSql = 'SELECT ' . implode(', ', $selectFields) . ' FROM users';

// Recherche utilisateur par email OU numéro de carte
out("\n2. Recherche de l'utilisateur (email ou numéro de carte)...");
try {
    if ($hasCardNum) {
        $stmt = $pdo->prepare($selectSql . ' WHERE email = :v OR card_number = :v LIMIT 1');
        $stmt->execute([':v' => $loginValue]);
    } else {
        $stmt = $pdo->prepare($selectSql . ' WHERE email = :v LIMIT 1');
        $stmt->execute([':v' => $loginValue]);
    }
    $user = $stmt->fetch();
    if ($user) {
        out('✓ Utilisateur trouvé');
        out('  - ID: ' . $user['id']);
        out('  - Email: ' . $user['email']);
        out('  - Nom: ' . ($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        out('  - Rôle: ' . ($user['role'] ?? ''));
        if (isset($user['is_active'])) { out('  - Actif: ' . (intval($user['is_active']) ? 'Oui' : 'Non')); }
        if (isset($user['card_number'])) { out('  - Numéro de carte: ' . $user['card_number']); }
        $hash = $user['password'];
        out('  - Hash longueur: ' . strlen($hash));
        out('  - Hash préfixe: ' . substr($hash, 0, 7));
    } else {
        out('✗ Aucun utilisateur trouvé pour: ' . $loginValue);
    }
} catch (Exception $e) {
    out('✗ Erreur lors de la recherche utilisateur: ' . $e->getMessage());
}

// Vérification du mot de passe (bcrypt + compatibilité MD5/SHA1/SHA256)
out("\n3. Test de vérification du mot de passe...");
if (!empty($user)) {
    out('  - Mot de passe saisi: ' . $inputPwd);
    out('  - Hash stocké: ' . $user['password']);
    $ok = password_verify($inputPwd, $user['password']);
    if ($ok) {
        out('✓ password_verify() réussit (bcrypt/argon)');
    } else {
        out('✗ password_verify() échoue');
        $md5 = md5($inputPwd);
        $sha1 = sha1($inputPwd);
        $sha256 = hash('sha256', $inputPwd);
        out('  - MD5:    ' . $md5);
        out('  - SHA1:   ' . $sha1);
        out('  - SHA256: ' . $sha256);
        if ($user['password'] === $md5) {
            out('✓ Correspondance legacy MD5');
        } elseif ($user['password'] === $sha1) {
            out('✓ Correspondance legacy SHA1');
        } elseif ($user['password'] === $sha256) {
            out('✓ Correspondance legacy SHA256');
        } else {
            out('✗ Aucune correspondance de hash');
        }
    }
    out("\n4. Test is_active...");
    out(intval($user['is_active']) ? '✓ Utilisateur actif' : '✗ Utilisateur inactif');
} else {
    out('— Test mot de passe ignoré: utilisateur introuvable');
}

// Requête d'auth conforme à auth.php (email OU card_number)
out("\n5. Test de la requête d'authentification...");
try {
    $selectFields2 = [
        'id', 'first_name AS firstName', 'last_name AS lastName', 'email', 'password', 'role'
    ];
    if ($hasBalance) { $selectFields2[] = 'balance AS cardBalance'; }
    if ($hasIsActive) { $selectFields2[] = 'is_active AS isActive'; }
    elseif ($hasActive) { $selectFields2[] = 'active AS isActive'; }
    if ($hasCardNum) { $selectFields2[] = 'card_number AS cardNumber'; }
    $selectFields2[] = 'created_at AS createdAt';
    $selectFields2[] = 'updated_at AS updatedAt';
    $selectSql2 = 'SELECT ' . implode(', ', $selectFields2) . ' FROM users';

    if ($hasCardNum) {
        $stmt = $pdo->prepare($selectSql2 . ' WHERE email = :v OR card_number = :v LIMIT 1');
        $stmt->execute([':v' => $loginValue]);
    } else {
        $stmt = $pdo->prepare($selectSql2 . ' WHERE email = :v LIMIT 1');
        $stmt->execute([':v' => $loginValue]);
    }
    $authUser = $stmt->fetch();
    if ($authUser) {
        out('✓ Auth trouve l\'utilisateur');
        out(json_encode($authUser, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    } else {
        out('✗ Auth ne trouve pas l\'utilisateur pour: ' . $loginValue);
    }
} catch (Exception $e) {
    out('✗ Erreur dans la requête d\'authentification: ' . $e->getMessage());
}

out("\n=== FIN DEBUG ===");