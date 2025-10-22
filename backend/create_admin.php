<?php
echo "Création d'un utilisateur administrateur...\n";

try {
    require_once __DIR__ . '/api/config.php';
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    echo "Connexion à la base de données réussie!\n";
    
    // Vérifier si l'utilisateur admin existe déjà
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute(['admin@agria-rouen.fr']);
    $existingUser = $stmt->fetch();
    
    if ($existingUser) {
        echo "L'utilisateur admin existe déjà avec l'ID: " . $existingUser['id'] . "\n";
        // Mise à jour des champs critiques pour garantir l'accès
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $now = date('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare('UPDATE users SET first_name = ?, last_name = ?, role = ?, is_active = ?, is_verified = ?, password = ?, updated_at = ? WHERE email = ?');
        $result = $stmt->execute([
            'Admin',
            'AGRIA',
            'admin',
            1,
            1,
            $hashedPassword,
            $now,
            'admin@agria-rouen.fr'
        ]);

        if ($result) {
            echo "Utilisateur administrateur mis à jour avec succès!\n";
            echo "Email: admin@agria-rouen.fr\n";
            echo "Mot de passe: admin123\n";
        } else {
            echo "Erreur lors de la mise à jour de l'utilisateur administrateur.\n";
        }
    } else {
        // Créer l'utilisateur admin
        $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $now = date('Y-m-d H:i:s');
        
        $stmt = $pdo->prepare('
            INSERT INTO users (
                first_name, last_name, email, password, role, 
                is_active, is_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $result = $stmt->execute([
            'Admin',
            'AGRIA',
            'admin@agria-rouen.fr',
            $hashedPassword,
            'admin',
            1,
            1,
            $now,
            $now
        ]);
        
        if ($result) {
            echo "Utilisateur administrateur créé avec succès!\n";
            echo "Email: admin@agria-rouen.fr\n";
            echo "Mot de passe: admin123\n";
        } else {
            echo "Erreur lors de la création de l'utilisateur.\n";
        }
    }
    
} catch(Exception $e) {
    echo 'Erreur: ' . $e->getMessage() . "\n";
}

echo "Fin du script.\n";
?>