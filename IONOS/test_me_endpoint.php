<?php
// Test GET /api/auth.php?action=me in CLI with a locally generated token
require_once __DIR__ . '/api/config.php';

$payload = ['user_id' => 0, 'email' => 'demo@example.com', 'role' => 'user'];
$secret = defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret';
$token = sec_generateJWT($payload, $secret);

// Simulate environment
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/auth.php?action=me&debug=1&access_token=' . urlencode($token);
$_SERVER['HTTP_X_DEBUG'] = '1';
$_GET['action'] = 'me';
$_GET['debug'] = '1';
$_GET['access_token'] = $token;

// Dispatch to endpoint
include __DIR__ . '/api/auth.php';