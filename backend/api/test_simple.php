<?php
// Test simple de l'API sans dépendances complexes

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'POST') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    // Test simple avec identifiants par défaut
    if ($email === 'admin@agria-rouen.fr' && $password === 'Admin123!') {
        echo json_encode([
            'success' => true,
            'message' => 'Connexion réussie',
            'user' => [
                'id' => 1,
                'email' => $email,
                'role' => 'admin',
                'first_name' => 'Admin',
                'last_name' => 'AGRIA'
            ],
            'token' => 'test_token_' . time()
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            'error' => 'Identifiants invalides'
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode([
        'error' => 'Méthode non autorisée'
    ]);
}
?>