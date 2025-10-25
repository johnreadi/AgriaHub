<?php
echo "Début du script de vérification des utilisateurs...\n";

try {
    echo "Tentative de connexion à la base de données...\n";
    require_once __DIR__ . '/api/config.php';
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    echo "Connexion réussie!\n";
    
    echo "Exécution de la requête...\n";
    $stmt = $pdo->query('SELECT id, first_name, last_name, email, role FROM users');
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Nombre d'utilisateurs trouvés: " . count($users) . "\n";
    
    if (empty($users)) {
        echo "Aucun utilisateur trouvé dans la base de données.\n";
    } else {
        echo "Utilisateurs trouvés:\n";
        foreach ($users as $user) {
            echo "ID: {$user['id']}, Nom: {$user['first_name']} {$user['last_name']}, Email: {$user['email']}, Rôle: {$user['role']}\n";
        }
    }
} catch(Exception $e) {
    echo 'Erreur: ' . $e->getMessage() . "\n";
}

echo "Fin du script.\n";
?>