<?php
/**
 * Script de test de connexion à la base de données IONOS
 * À utiliser pour diagnostiquer les problèmes de connexion
 */

// Affichage des erreurs pour le debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>🔍 Test de Connexion Base de Données IONOS</h1>";
echo "<hr>";

// Test 1: Vérification des extensions PHP
echo "<h2>1. Extensions PHP</h2>";
echo "PDO disponible: " . (extension_loaded('pdo') ? '✅ OUI' : '❌ NON') . "<br>";
echo "PDO MySQL disponible: " . (extension_loaded('pdo_mysql') ? '✅ OUI' : '❌ NON') . "<br>";
echo "Version PHP: " . phpversion() . "<br>";
echo "<hr>";

// Test 2: Configuration actuelle
echo "<h2>2. Configuration Actuelle</h2>";
if (file_exists('config.php')) {
    require_once 'config.php';
    echo "Fichier config.php: ✅ Trouvé<br>";
    echo "DB_HOST: " . (defined('DB_HOST') ? DB_HOST : '❌ Non défini') . "<br>";
    echo "DB_NAME: " . (defined('DB_NAME') ? DB_NAME : '❌ Non défini') . "<br>";
    echo "DB_USER: " . (defined('DB_USER') ? DB_USER : '❌ Non défini') . "<br>";
    echo "DB_PASS: " . (defined('DB_PASS') ? (DB_PASS ? '✅ Défini' : '❌ Vide') : '❌ Non défini') . "<br>";
} else {
    echo "❌ Fichier config.php non trouvé<br>";
}
echo "<hr>";

// Test 3: Test de connexion avec config actuelle
echo "<h2>3. Test de Connexion (Config Actuelle)</h2>";
if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        if (class_exists('PDO')) {
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_TIMEOUT => 10
            ];
        } else {
            $options = [];
        }
        
        if (!class_exists('PDO')) {
            throw new Exception("Extension PDO non disponible");
        }
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        echo "✅ Connexion réussie!<br>";
        
        // Test de requête simple
        $stmt = $pdo->query("SELECT 1 as test, CURRENT_TIMESTAMP as server_time");
        $result = $stmt->fetch();
        echo "✅ Test de requête réussi<br>";
        echo "Heure serveur: " . $result['server_time'] . "<br>";
        
        // Vérification des tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Tables trouvées (" . count($tables) . "): " . implode(', ', $tables) . "<br>";
        
        // Vérification de la table users
        if (in_array('users', $tables)) {
            echo "✅ Table 'users' trouvée<br>";
            
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
            $userCount = $stmt->fetch();
            echo "Nombre d'utilisateurs: " . $userCount['count'] . "<br>";
            
            // Vérification de l'admin
            $stmt = $pdo->prepare("SELECT id, email, role FROM users WHERE role = 'admin' LIMIT 1");
            $stmt->execute();
            $admin = $stmt->fetch();
            
            if ($admin) {
                echo "✅ Utilisateur admin trouvé: " . $admin['email'] . " (ID: " . $admin['id'] . ")<br>";
            } else {
                echo "❌ Aucun utilisateur admin trouvé<br>";
            }
        } else {
            echo "❌ Table 'users' non trouvée<br>";
        }
        
    } catch (Throwable $e) {
        echo "❌ Erreur de connexion: " . $e->getMessage() . "<br>";
        if (!class_exists('PDO')) {
            echo "⚠️ PDO non disponible, tentative de test avec MySQLi...<br>";
        }
        // Fallback MySQLi
        echo "➡️ Test MySQLi...<br>";
        $mysqli = @mysqli_connect(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($mysqli) {
            echo "✅ Connexion MySQLi réussie!<br>";
            $res = $mysqli->query("SELECT 1 AS test");
            if ($res) {
                $row = $res->fetch_assoc();
                echo "✅ Test de requête MySQLi réussi (test=" . $row['test'] . ")<br>";
            }
            // Compter utilisateurs si table users existe
            $resTables = $mysqli->query("SHOW TABLES");
            $tables = [];
            if ($resTables) {
                while ($t = $resTables->fetch_row()) { $tables[] = $t[0]; }
                echo "Tables trouvées (" . count($tables) . "): " . implode(', ', $tables) . "<br>";
                if (in_array('users', $tables)) {
                    $resUsers = $mysqli->query("SELECT COUNT(*) AS count FROM users");
                    if ($resUsers) {
                        $u = $resUsers->fetch_assoc();
                        echo "Nombre d'utilisateurs: " . $u['count'] . "<br>";
                    }
                }
            }
            $mysqli->close();
        } else {
            echo "❌ Connexion MySQLi échouée: " . mysqli_connect_error() . "<br>";
        }
    }
} else {
    echo "❌ Configuration incomplète<br>";
}
echo "<hr>";

// Test 4: Configuration IONOS recommandée
echo "<h2>4. Test avec Configuration IONOS Type</h2>";
echo "<p><strong>⚠️ Modifiez ces valeurs avec vos vraies données IONOS:</strong></p>";

// Exemple de configuration IONOS (à modifier)
$ionos_config = [
    'host' => 'db5018629781.hosting-data.io',
    'dbname' => 'dbs14768810',
    'username' => 'dbu3279635',
    'password' => 'Resto.AgriaRouen76100' // Mot de passe IONOS fourni
];

echo "Host: " . $ionos_config['host'] . "<br>";
echo "Database: " . $ionos_config['dbname'] . "<br>";
echo "Username: " . $ionos_config['username'] . "<br>";
echo "Password: " . (strlen($ionos_config['password']) > 0 ? '✅ Défini (' . strlen($ionos_config['password']) . ' caractères)' : '❌ Vide') . "<br>";

try {
    $dsn = "mysql:host=" . $ionos_config['host'] . ";dbname=" . $ionos_config['dbname'] . ";charset=utf8mb4";
    if (class_exists('PDO')) {
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT => 10
        ];
    } else {
        $options = [];
    }
    
    if (!class_exists('PDO')) {
        throw new Exception("Extension PDO non disponible");
    }
    
    $pdo = new PDO($dsn, $ionos_config['username'], $ionos_config['password'], $options);
    echo "✅ Connexion IONOS réussie!<br>";
    
} catch (Throwable $e) {
    echo "❌ Connexion IONOS échouée: " . $e->getMessage() . "<br>";
    echo "💡 Vérifiez vos identifiants IONOS dans le panneau de contrôle<br>";
    // Fallback MySQLi avec config IONOS
    echo "➡️ Test MySQLi (IONOS)...<br>";
    $mysqli = @mysqli_connect($ionos_config['host'], $ionos_config['username'], $ionos_config['password'], $ionos_config['dbname']);
    if ($mysqli) {
        echo "✅ Connexion MySQLi IONOS réussie!<br>";
        $res = $mysqli->query("SELECT 1 AS test");
        if ($res) {
            $row = $res->fetch_assoc();
            echo "✅ Test de requête MySQLi réussi (test=" . $row['test'] . ")<br>";
        }
        $mysqli->close();
    } else {
        echo "❌ Connexion MySQLi IONOS échouée: " . mysqli_connect_error() . "<br>";
    }
}

echo "<hr>";

// Instructions
echo "<h2>5. Instructions</h2>";
echo "<ol>";
echo "<li><strong>Si la connexion actuelle échoue:</strong> Vérifiez que vous utilisez MySQL et non SQLite</li>";
echo "<li><strong>Récupérez vos identifiants IONOS:</strong> Panneau de contrôle > Bases de données MySQL</li>";
echo "<li><strong>Modifiez config.php</strong> avec vos vraies données IONOS</li>";
echo "<li><strong>Importez database.sql</strong> via phpMyAdmin IONOS</li>";
echo "<li><strong>Exécutez create_admin.sql</strong> pour créer l'utilisateur admin</li>";
echo "</ol>";

echo "<hr>";
echo "<p><em>Script généré le " . date('Y-m-d H:i:s') . "</em></p>";
?>