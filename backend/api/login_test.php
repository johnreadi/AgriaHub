<?php
/**
 * API de connexion temporaire - TEST MODE
 * Accepte TOUS les identifiants pour tester la redirection admin
 */

// Configuration des headers CORS et sécurité
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

// Gestion des requêtes OPTIONS (CORS préflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Seules les requêtes POST sont autorisées
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Méthode non autorisée']);
    exit;
}

// Fonction de réponse JSON
function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// Récupération des données d'entrée
$data = json_decode(file_get_contents('php://input'), true) ?: $_POST;
$identifier = trim($data['identifier'] ?? $data['username'] ?? $data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($identifier) || empty($password)) {
    jsonResponse(['error' => 'Identifiant et mot de passe requis'], 400);
}

// ⚠️ MODE TEST : TOUT ACCEPTÉ ⚠️
// Simuler une connexion réussie pour tester la redirection
$user = [
    'id' => 1,
    'email' => $identifier,
    'username' => $identifier,
    'role' => 'admin',
    'first_name' => 'Test',
    'last_name' => 'User'
];

jsonResponse([
    'success' => true,
    'message' => 'Connexion réussie (MODE TEST)',
    'user' => $user
]);
