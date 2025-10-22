<?php
// Test POST /api/auth.php?action=refresh in CLI with a locally generated refresh token
require_once __DIR__ . '/api/config.php';

$payload = ['user_id' => 0, 'type' => 'refresh'];
$secret = (defined('JWT_SECRET') ? JWT_SECRET : 'dev_secret') . '_refresh';
$refreshToken = sec_generateJWT($payload, $secret);

// Simulate environment
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/auth.php?action=refresh&debug=1';
$_SERVER['CONTENT_TYPE'] = 'application/json';
$_SERVER['HTTP_X_DEBUG'] = '1';
$GLOBALS['RAW_BODY_CACHED'] = json_encode(['refresh_token' => $refreshToken]);
$_GET['action'] = 'refresh';
$_GET['debug'] = '1';

// Dispatch to endpoint
include __DIR__ . '/api/auth.php';