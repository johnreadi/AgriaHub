<?php
session_start();

require_once __DIR__ . '/api/config.php';

try {
    $pdo = new PDO(
        sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', DB_HOST, DB_NAME),
        DB_USER,
        DB_PASS,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
} catch (Throwable $e) {
    http_response_code(500);
    echo '<h1>Erreur de connexion à la base</h1>';
    echo '<p>' . htmlspecialchars($e->getMessage(), ENT_QUOTES, 'UTF-8') . '</p>';
    exit;
}

$roles = ['admin', 'moderator', 'employee', 'user'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $flash = ['status' => 'error', 'message' => "Action inconnue"];

    try {
        if ($action === 'create') {
            $firstName = trim($_POST['first_name'] ?? '');
            $lastName = trim($_POST['last_name'] ?? '');
            $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
            $role = in_array($_POST['role'] ?? 'user', $roles, true) ? $_POST['role'] : 'user';
            $isActive = isset($_POST['is_active']) ? 1 : 0;
            $password = $_POST['password'] ?? '';

            if ($firstName === '' || $lastName === '' || $email === '' || $password === '') {
                throw new RuntimeException('Tous les champs obligatoires doivent être remplis.');
            }

            $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
            $stmt->execute([':email' => $email]);
            if ($stmt->fetch()) {
                throw new RuntimeException('Un utilisateur existe déjà avec cet email.');
            }

            $hash = password_hash($password, PASSWORD_DEFAULT);
            $insert = $pdo->prepare('INSERT INTO users (first_name, last_name, email, role, is_active, password, created_at, updated_at) VALUES (:first_name, :last_name, :email, :role, :is_active, :password, NOW(), NOW())');
            $insert->execute([
                ':first_name' => $firstName,
                ':last_name' => $lastName,
                ':email' => $email,
                ':role' => $role,
                ':is_active' => $isActive,
                ':password' => $hash,
            ]);

            $flash = ['status' => 'success', 'message' => 'Utilisateur créé avec succès.'];
        } elseif ($action === 'update') {
            $id = (int)($_POST['id'] ?? 0);
            $firstName = trim($_POST['first_name'] ?? '');
            $lastName = trim($_POST['last_name'] ?? '');
            $email = filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL);
            $role = in_array($_POST['role'] ?? 'user', $roles, true) ? $_POST['role'] : 'user';
            $isActive = isset($_POST['is_active']) ? 1 : 0;
            $newPassword = $_POST['password'] ?? '';

            if ($id <= 0) {
                throw new RuntimeException('Identifiant utilisateur invalide.');
            }
            if ($firstName === '' || $lastName === '' || $email === '') {
                throw new RuntimeException('Les champs prénom, nom et email sont obligatoires.');
            }

            $params = [
                ':id' => $id,
                ':first_name' => $firstName,
                ':last_name' => $lastName,
                ':email' => $email,
                ':role' => $role,
                ':is_active' => $isActive,
            ];

            $sql = 'UPDATE users SET first_name = :first_name, last_name = :last_name, email = :email, role = :role, is_active = :is_active, updated_at = NOW()';
            if ($newPassword !== '') {
                $sql .= ', password = :password';
                $params[':password'] = password_hash($newPassword, PASSWORD_DEFAULT);
            }
            $sql .= ' WHERE id = :id';

            $update = $pdo->prepare($sql);
            $update->execute($params);

            $flash = ['status' => 'success', 'message' => 'Utilisateur mis à jour.'];
        } elseif ($action === 'delete') {
            $id = (int)($_POST['id'] ?? 0);
            if ($id <= 0) {
                throw new RuntimeException('Identifiant utilisateur invalide.');
            }

            $delete = $pdo->prepare('DELETE FROM users WHERE id = :id LIMIT 1');
            $delete->execute([':id' => $id]);

            $flash = ['status' => 'success', 'message' => 'Utilisateur supprimé.'];
        }
    } catch (Throwable $e) {
        $flash = ['status' => 'error', 'message' => $e->getMessage()];
    }

    $_SESSION['flash'] = $flash;
    header('Location: ' . $_SERVER['PHP_SELF']);
    exit;
}

$flash = $_SESSION['flash'] ?? null;
unset($_SESSION['flash']);

$users = [];
try {
    $stmt = $pdo->query('SELECT id, first_name, last_name, email, role, is_active, created_at, updated_at FROM users ORDER BY id ASC');
    $users = $stmt->fetchAll();
} catch (Throwable $e) {
    $flash = $flash ?: ['status' => 'error', 'message' => 'Impossible de récupérer les utilisateurs: ' . $e->getMessage()];
}

function e(string $value): string {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Gestion des utilisateurs</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 2rem; background: #f7f7f7; }
        h1 { color: #0b703d; }
        .flash { padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; }
        .flash.success { background: #e6f7ed; border: 1px solid #48a868; color: #27643c; }
        .flash.error { background: #fdecea; border: 1px solid #f1998e; color: #7a2b24; }
        form { background: #fff; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }
        form + form { margin-top: 1rem; }
        fieldset { border: none; margin: 0; padding: 0; }
        label { display: block; margin-bottom: 0.3rem; font-weight: 600; }
        input[type="text"], input[type="email"], input[type="password"], select { width: 100%; padding: 0.5rem; margin-bottom: 0.8rem; border: 1px solid #ccc; border-radius: 4px; }
        .inline { display: flex; gap: 1rem; }
        .inline > div { flex: 1; }
        button { background: #0b703d; color: #fff; border: none; border-radius: 4px; padding: 0.6rem 1.2rem; cursor: pointer; }
        button.delete { background: #c0392b; }
        table { width: 100%; border-collapse: collapse; margin-top: 2rem; }
        th, td { padding: 0.6rem; border-bottom: 1px solid #ddd; text-align: left; }
        th { background: #0b703d; color: #fff; }
        .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        @media (max-width: 780px) {
            .inline { flex-direction: column; }
        }
    </style>
</head>
<body>
    <h1>Gestion des utilisateurs</h1>

    <?php if ($flash): ?>
        <div class="flash <?php echo e($flash['status']); ?>"><?php echo e($flash['message']); ?></div>
    <?php endif; ?>

    <form method="post">
        <h2>Créer un utilisateur</h2>
        <input type="hidden" name="action" value="create">
        <div class="inline">
            <div>
                <label for="create_first_name">Prénom *</label>
                <input id="create_first_name" name="first_name" type="text" required>
            </div>
            <div>
                <label for="create_last_name">Nom *</label>
                <input id="create_last_name" name="last_name" type="text" required>
            </div>
        </div>
        <label for="create_email">Email *</label>
        <input id="create_email" name="email" type="email" required>

        <div class="inline">
            <div>
                <label for="create_role">Rôle</label>
                <select id="create_role" name="role">
                    <?php foreach ($roles as $role): ?>
                        <option value="<?php echo e($role); ?>"><?php echo e(ucfirst($role)); ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            <div>
                <label for="create_password">Mot de passe *</label>
                <input id="create_password" name="password" type="password" required>
            </div>
        </div>

        <label>
            <input type="checkbox" name="is_active" value="1" checked>
            Compte actif
        </label>

        <button type="submit">Créer</button>
    </form>

    <h2>Utilisateurs existants</h2>

    <?php if (empty($users)): ?>
        <p>Aucun utilisateur enregistré.</p>
    <?php else: ?>
        <?php foreach ($users as $user): ?>
            <form method="post">
                <fieldset>
                    <legend><?php echo e($user['email']); ?> (ID <?php echo (int)$user['id']; ?>)</legend>
                    <input type="hidden" name="action" value="update">
                    <input type="hidden" name="id" value="<?php echo (int)$user['id']; ?>">
                    <div class="inline">
                        <div>
                            <label>Prénom</label>
                            <input name="first_name" type="text" value="<?php echo e($user['first_name']); ?>" required>
                        </div>
                        <div>
                            <label>Nom</label>
                            <input name="last_name" type="text" value="<?php echo e($user['last_name']); ?>" required>
                        </div>
                    </div>
                    <label>Email</label>
                    <input name="email" type="email" value="<?php echo e($user['email']); ?>" required>

                    <div class="inline">
                        <div>
                            <label>Rôle</label>
                            <select name="role">
                                <?php foreach ($roles as $role): ?>
                                    <option value="<?php echo e($role); ?>" <?php echo $role === $user['role'] ? 'selected' : ''; ?>><?php echo e(ucfirst($role)); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div>
                            <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                            <input name="password" type="password" placeholder="••••••">
                        </div>
                    </div>

                    <label>
                        <input type="checkbox" name="is_active" value="1" <?php echo ((int)$user['is_active'] === 1) ? 'checked' : ''; ?>>
                        Compte actif
                    </label>

                    <div class="actions">
                        <button type="submit">Mettre à jour</button>
                    </div>
                </fieldset>
            </form>
            <form method="post" onsubmit="return confirm('Supprimer cet utilisateur ?');">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="id" value="<?php echo (int)$user['id']; ?>">
                <button type="submit" class="delete">Supprimer</button>
            </form>
        <?php endforeach; ?>
    <?php endif; ?>
</body>
</html>
