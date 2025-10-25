<?php
/**
 * Script de vérification de l'utilisateur admin
 * Teste l'authentification et vérifie les mots de passe
 */

// Affichage des erreurs pour le debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔐 Vérification Utilisateur Admin</h1>";
echo "<hr>";

// Inclusion de la configuration
if (file_exists('config.php')) {
    require_once 'config.php';
    echo "✅ Configuration chargée<br>";
} else {
    echo "❌ Fichier config.php non trouvé<br>";
    exit;
}

try {
    // Connexion à la base de données
    $db = new Database();
    $conn = $db->getConnection();
    echo "✅ Connexion base de données réussie<br>";
    
    // Vérification de la table users
    echo "<h2>1. Vérification de la table users</h2>";
    $stmt = $conn->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Table 'users' trouvée<br>";
        
        // Compter les utilisateurs
        $stmt = $conn->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch();
        echo "Nombre total d'utilisateurs: " . $count['count'] . "<br>";
        
    } else {
        echo "❌ Table 'users' non trouvée<br>";
        echo "💡 Vous devez importer database.sql via phpMyAdmin<br>";
        exit;
    }
    
    echo "<hr>";
    
    // Recherche de l'utilisateur admin
    echo "<h2>2. Recherche Utilisateur Admin</h2>";
    
    $adminEmails = [
        'admin@agria-rouen.fr',
        'admin@agriarouen.fr',
        'admin@localhost'
    ];
    
    $adminFound = false;
    $adminData = null;
    
    foreach ($adminEmails as $email) {
        $stmt = $conn->prepare("SELECT * FROM users WHERE email = ? AND role = 'admin'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user) {
            echo "✅ Admin trouvé: " . $email . "<br>";
            echo "ID: " . $user['id'] . "<br>";
            echo "Nom: " . $user['first_name'] . " " . $user['last_name'] . "<br>";
            echo "Actif: " . ($user['is_active'] ? 'Oui' : 'Non') . "<br>";
            echo "Vérifié: " . ($user['is_verified'] ? 'Oui' : 'Non') . "<br>";
            echo "Créé le: " . $user['created_at'] . "<br>";
            $adminFound = true;
            $adminData = $user;
            break;
        } else {
            echo "❌ Pas d'admin avec: " . $email . "<br>";
        }
    }
    
    if (!$adminFound) {
        echo "<br>❌ <strong>Aucun utilisateur admin trouvé!</strong><br>";
        echo "💡 Vous devez exécuter create_admin.sql<br>";
        
        // Proposer de créer l'admin
        echo "<h3>Création automatique de l'admin</h3>";
        $createSql = "
        INSERT IGNORE INTO users (
            first_name, last_name, email, password, role, 
            is_active, is_verified, created_at, updated_at
        ) VALUES (
            'Admin', 'AGRIA', 'admin@agria-rouen.fr',
            '$2y$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
            'admin', 1, 1, NOW(), NOW()
        )";
        
        try {
            $conn->exec($createSql);
            echo "✅ Utilisateur admin créé automatiquement!<br>";
            echo "Email: admin@agria-rouen.fr<br>";
            echo "Mot de passe: admin123<br>";
            
            // Récupérer les données du nouvel admin
            $stmt = $conn->prepare("SELECT * FROM users WHERE email = 'admin@agria-rouen.fr'");
            $stmt->execute();
            $adminData = $stmt->fetch();
            $adminFound = true;
            
        } catch (Exception $e) {
            echo "❌ Erreur lors de la création: " . $e->getMessage() . "<br>";
        }
    }
    
    echo "<hr>";
    
    // Test du mot de passe
    if ($adminFound && $adminData) {
        echo "<h2>3. Test du Mot de Passe</h2>";
        
        $testPasswords = ['admin123', 'Admin123!', 'password', 'admin'];
        
        foreach ($testPasswords as $testPassword) {
            if (sec_verifyPassword($testPassword, $adminData['password'])) {
                echo "✅ <strong>Mot de passe trouvé: " . $testPassword . "</strong><br>";
                break;
            } else {
                echo "❌ Pas: " . $testPassword . "<br>";
            }
        }
        
        echo "<br>Hash stocké: " . substr($adminData['password'], 0, 50) . "...<br>";
        echo "Longueur du hash: " . strlen($adminData['password']) . " caractères<br>";
        
        // Test de création d'un nouveau hash
        echo "<h3>Test de Hash</h3>";
        $newHash = sec_hashPassword('admin123');
        echo "Nouveau hash pour 'admin123': " . substr($newHash, 0, 50) . "...<br>";
        echo "Vérification: " . (sec_verifyPassword('admin123', $newHash) ? '✅ OK' : '❌ Échec') . "<br>";
    }
    
    echo "<hr>";
    
    // Test de l'endpoint d'authentification
    echo "<h2>4. Test Endpoint Auth</h2>";
    
    if ($adminFound && $adminData) {
        // Simuler une requête d'authentification
        $_POST['email'] = $adminData['email'];
        $_POST['password'] = 'admin123';
        
        echo "Test avec:<br>";
        echo "Email: " . $_POST['email'] . "<br>";
        echo "Password: " . $_POST['password'] . "<br>";
        
        // Vérifier si auth.php existe
        if (file_exists('auth.php')) {
            echo "✅ Fichier auth.php trouvé<br>";
            echo "💡 Testez manuellement: <a href='auth.php' target='_blank'>auth.php</a><br>";
        } else {
            echo "❌ Fichier auth.php non trouvé<br>";
        }
    }
    
    echo "<hr>";
    
    // Résumé
    echo "<h2>5. Résumé</h2>";
    if ($adminFound) {
        echo "✅ <strong>Utilisateur admin configuré</strong><br>";
        echo "📧 Email: " . $adminData['email'] . "<br>";
        echo "🔑 Mot de passe: admin123<br>";
        echo "🌐 Testez la connexion sur votre site<br>";
    } else {
        echo "❌ <strong>Problème de configuration admin</strong><br>";
        echo "💡 Exécutez create_admin.sql ou utilisez ce script pour créer l'admin<br>";
    }
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "<br>";
}

echo "<hr>";
echo "<p><em>Script exécuté le " . date('Y-m-d H:i:s') . "</em></p>";
?>