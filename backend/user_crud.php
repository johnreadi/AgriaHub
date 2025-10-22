<?php
// Outil de diagnostic et CRUD utilisateurs (usage interne)
// IMPORTANT: protégez l'accès avec une clé secrète ci-dessous et/ou via .htaccess

error_reporting(E_ALL);
ini_set('display_errors', 1);

// Clé d'accès simple (modifiez la valeur ci-dessous)
$ACCESS_KEY = 'aGriA_2025_KV!Gx9pQw3#T7zL2@M8sN4^bD1%Ru6Yc0Jf5';
if (!isset($_GET['key']) || $_GET['key'] !== $ACCESS_KEY) {
    echo '<!doctype html><html><head><meta charset="utf-8"><title>Accès requis</title></head><body>';
    echo '<h2>🔐 Accès requis</h2><p>Ajoutez ?key=VOTRE_CLE à l\'URL pour accéder à l\'outil.</p>';
    echo '<p>Modifiez $ACCESS_KEY dans user_crud.php pour définir votre clé secrète.</p>';
    echo '</body></html>';
    exit;
}

// Optionnel: liste d'IP autorisées (renseignez votre IP publique)
$ALLOWED_IPS = []; // ex: ['1.2.3.4']
if (!empty($ALLOWED_IPS)) {
    $clientIp = $_SERVER['REMOTE_ADDR'] ?? '';
    if (!in_array($clientIp, $ALLOWED_IPS, true)) {
        header('HTTP/1.1 403 Forbidden');
        echo '<!doctype html><html><head><meta charset="utf-8"><title>Accès refusé</title></head><body>';
        echo '<h2>🚫 Accès refusé</h2><p>Votre IP ' . htmlspecialchars($clientIp, ENT_QUOTES, 'UTF-8') . ' n\'est pas autorisée.</p>';
        echo '</body></html>';
        exit;
    }
}

// Connexion DB directe (IONOS)
// Utilise les identifiants confirmés pour éviter toute dépendance à api/config.php
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
try {
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    echo '<h2>❌ Erreur de connexion DB</h2><pre>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</pre>';
    exit;
}

// Helpers
function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function now() { return date('Y-m-d H:i:s'); }

// Actions
$actionMsg = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    try {
        if ($action === 'create') {
            $firstName = trim($_POST['firstName'] ?? '');
            $lastName  = trim($_POST['lastName'] ?? '');
            $email     = trim($_POST['email'] ?? '');
            $password  = $_POST['password'] ?? '';
            $role      = trim($_POST['role'] ?? 'user');
            $isActive  = isset($_POST['isActive']) ? 1 : 0;
            
            if (!$email || !$password) { throw new Exception('Email et mot de passe sont requis'); }
            
            // Vérifier doublon email
            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
            $stmt->execute([$email]);
            if ($stmt->fetch()) { throw new Exception('Un utilisateur avec cet email existe déjà'); }
            
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $now = now();
            $stmt = $pdo->prepare('INSERT INTO users (first_name, last_name, email, password, role, is_active, is_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$firstName, $lastName, $email, $hash, $role, $isActive, 1, $now, $now]);
            $actionMsg = '✅ Utilisateur créé';
        } elseif ($action === 'update') {
            $id        = (int)($_POST['id'] ?? 0);
            $firstName = trim($_POST['firstName'] ?? '');
            $lastName  = trim($_POST['lastName'] ?? '');
            $email     = trim($_POST['email'] ?? '');
            $role      = trim($_POST['role'] ?? 'user');
            $isActive  = isset($_POST['isActive']) ? 1 : 0;
            $password  = $_POST['password'] ?? '';
            if ($id <= 0) { throw new Exception('ID utilisateur invalide'); }
            
            // Vérifier existence
            $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) { throw new Exception('Utilisateur non trouvé'); }
            
            $fields = ['first_name' => $firstName, 'last_name' => $lastName, 'email' => $email, 'role' => $role, 'is_active' => $isActive];
            $setParts = [];
            $params = [];
            foreach ($fields as $col => $val) { $setParts[] = "$col = ?"; $params[] = $val; }
            if ($password !== '') { $setParts[] = 'password = ?'; $params[] = password_hash($password, PASSWORD_DEFAULT); }
            $setParts[] = 'updated_at = ?'; $params[] = now();
            $params[] = $id;
            $sql = 'UPDATE users SET ' . implode(', ', $setParts) . ' WHERE id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $actionMsg = '✅ Utilisateur mis à jour';
        } elseif ($action === 'delete') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) { throw new Exception('ID utilisateur invalide'); }
            $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$id]);
            $actionMsg = '🗑️ Utilisateur supprimé (si existant)';
        } elseif ($action === 'create_admin_default') {
            $password = $_POST['password'] ?? '';
            if ($password === '') { throw new Exception('Mot de passe requis pour admin'); }
            $hash = password_hash($password, PASSWORD_DEFAULT);
            $now = now();
            $emails = ['admin@agria-rouen.fr', 'admin@agriarouen.fr'];
            $adminId = null; $emailFound = null;
            foreach ($emails as $em) {
                $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
                $stmt->execute([$em]);
                $row = $stmt->fetch();
                if ($row) { $adminId = (int)$row['id']; $emailFound = $em; break; }
            }
            if ($adminId) {
                $stmt = $pdo->prepare('UPDATE users SET password = ?, role = ?, is_active = ?, is_verified = ?, updated_at = ? WHERE id = ?');
                $stmt->execute([$hash, 'admin', 1, 1, $now, $adminId]);
                $actionMsg = '✅ Admin mis à jour: ' . h($emailFound);
            } else {
                $email = $emails[0];
                $stmt = $pdo->prepare('INSERT INTO users (first_name, last_name, email, password, role, is_active, is_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
                $stmt->execute(['Admin', 'AGRIA', $email, $hash, 'admin', 1, 1, $now, $now]);
                $actionMsg = '✅ Admin créé: ' . h($email);
            }
        }
    } catch (Exception $e) {
        $actionMsg = '❌ Erreur: ' . $e->getMessage();
    }
}

// Diagnostics DB
$dbOk = false; $usersCount = null; $tablesInfo = '';
try {
    $val = (int)$pdo->query('SELECT 1')->fetchColumn();
    $dbOk = ($val === 1);
    $usersCount = (int)$pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    // Vérifier colonnes principales
    $stmt = $pdo->query("SHOW COLUMNS FROM users");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
    $tablesInfo = 'Colonnes users: ' . h(implode(', ', $cols));
} catch (Exception $e) {
    $tablesInfo = 'Erreur diagnostic: ' . h($e->getMessage());
}

// Liste des utilisateurs
$users = [];
try {
    $stmt = $pdo->query('SELECT id, first_name AS firstName, last_name AS lastName, email, role, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt FROM users ORDER BY id DESC LIMIT 100');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    $actionMsg .= '<br>⚠️ Lecture users échouée: ' . h($e->getMessage());
}

?>
<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Outil DB & CRUD Utilisateurs</title>
<style>
body { font-family: Arial, sans-serif; margin: 20px; }
.container { max-width: 1100px; margin: auto; }
.card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.card h2 { margin-top: 0; }
table { border-collapse: collapse; width: 100%; }
th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
th { background: #f7f7f7; }
input[type=text], input[type=email], input[type=password], select { width: 300px; padding: 6px; }
button { padding: 8px 14px; background: #2c7a7b; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
button:hover { background: #285e61; }
.note { color: #666; font-size: 12px; }
.msg { padding: 10px; border-radius: 6px; background: #f0f9ff; border: 1px solid #b6e0fe; margin-bottom: 10px; }
.bad { background: #fff5f5; border-color: #fed7d7; }
.ok { background: #f0fff4; border-color: #c6f6d5; }
</style>
</head>
<body>
<div class="container">
    <h1>🔧 Outil de Connexion DB & CRUD Utilisateurs</h1>
    <p class="note">Protégé par clé (?key=...), usage interne uniquement.</p>

    <?php if ($actionMsg): ?>
        <div class="msg <?php echo strpos($actionMsg, '❌') !== false ? 'bad' : 'ok'; ?>"><?php echo h($actionMsg); ?></div>
    <?php endif; ?>

    <div class="card">
        <h2>1) État Connexion Base de Données</h2>
        <p>SELECT 1: <?php echo $dbOk ? '✅ OK' : '❌ KO'; ?> </p>
        <p>Nombre d'utilisateurs: <?php echo $usersCount !== null ? h($usersCount) : 'N/A'; ?></p>
        <p><?php echo $tablesInfo; ?></p>
    </div>

    <div class="card">
        <h2>2) Liste des Utilisateurs (100 derniers)</h2>
        <table>
            <thead>
                <tr>
                    <th>ID</th><th>Prénom</th><th>Nom</th><th>Email</th><th>Rôle</th><th>Actif</th><th>Créé</th><th>MAJ</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($users)): ?>
                    <tr><td colspan="8">Aucun utilisateur à afficher.</td></tr>
                <?php else: foreach ($users as $u): ?>
                    <tr>
                        <td><?php echo h($u['id']); ?></td>
                        <td><?php echo h($u['firstName']); ?></td>
                        <td><?php echo h($u['lastName']); ?></td>
                        <td><?php echo h($u['email']); ?></td>
                        <td><?php echo h($u['role']); ?></td>
                        <td><?php echo isset($u['isActive']) ? (intval($u['isActive']) ? 'Oui' : 'Non') : 'N/A'; ?></td>
                        <td><?php echo h($u['createdAt']); ?></td>
                        <td><?php echo h($u['updatedAt']); ?></td>
                    </tr>
                <?php endforeach; endif; ?>
            </tbody>
        </table>
    </div>

    <div class="card">
        <h2>3) Créer un Utilisateur</h2>
        <form method="post">
            <input type="hidden" name="action" value="create">
            <div>
                <label>Prénom<br><input type="text" name="firstName" placeholder="Prénom"></label>
            </div>
            <div>
                <label>Nom<br><input type="text" name="lastName" placeholder="Nom"></label>
            </div>
            <div>
                <label>Email*<br><input type="email" name="email" required placeholder="email@domaine"></label>
            </div>
            <div>
                <label>Mot de passe*<br><input type="password" name="password" required placeholder="Mot de passe"></label>
            </div>
            <div>
                <label>Rôle<br>
                    <select name="role">
                        <option value="user">user</option>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                    </select>
                </label>
            </div>
            <div>
                <label><input type="checkbox" name="isActive" checked> Actif</label>
            </div>
            <button type="submit">Créer</button>
        </form>
    </div>

    <div class="card">
        <h2>4) Mettre à Jour un Utilisateur</h2>
        <form method="post">
            <input type="hidden" name="action" value="update">
            <div>
                <label>ID Utilisateur*<br><input type="text" name="id" required placeholder="ID"></label>
            </div>
            <div>
                <label>Prénom<br><input type="text" name="firstName" placeholder="Prénom"></label>
            </div>
            <div>
                <label>Nom<br><input type="text" name="lastName" placeholder="Nom"></label>
            </div>
            <div>
                <label>Email<br><input type="email" name="email" placeholder="email@domaine"></label>
            </div>
            <div>
                <label>Mot de passe (laisser vide pour ne pas changer)<br><input type="password" name="password" placeholder="Nouveau mot de passe"></label>
            </div>
            <div>
                <label>Rôle<br>
                    <select name="role">
                        <option value="user">user</option>
                        <option value="staff">staff</option>
                        <option value="admin">admin</option>
                    </select>
                </label>
            </div>
            <div>
                <label><input type="checkbox" name="isActive"> Actif</label>
            </div>
            <button type="submit">Mettre à jour</button>
        </form>
    </div>

    <div class="card">
        <h2>5) Supprimer un Utilisateur</h2>
        <form method="post" onsubmit="return confirm('Confirmer la suppression ?');">
            <input type="hidden" name="action" value="delete">
            <div>
                <label>ID Utilisateur*<br><input type="text" name="id" required placeholder="ID"></label>
            </div>
            <button type="submit">Supprimer</button>
        </form>
        <p class="note">Attention: action destructive. Aucun retour arrière.</p>
    </div>

    <div class="card">
        <h2>6) Créer / Mettre à jour l'Administrateur par défaut</h2>
        <p class="note">Emails utilisés: admin@agria-rouen.fr (prioritaire) ou admin@agriarouen.fr si le premier n'existe pas.</p>
        <form method="post">
            <input type="hidden" name="action" value="create_admin_default">
            <div>
                <label>Mot de passe admin*<br><input type="password" name="password" required placeholder="Mot de passe fort"></label>
            </div>
            <button type="submit">Créer / Mettre à jour l'admin</button>
        </form>
    </div>
</div>
</body>
</html>