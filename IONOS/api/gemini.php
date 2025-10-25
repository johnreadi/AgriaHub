<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/Security.php';

// CORS headers
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header('Access-Control-Allow-Origin: ' . ($origin ?: '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Access-Token');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Basic routing via action (supports /gemini.php?action=chat or /gemini/chat)
$action = $_GET['action'] ?? ($_POST['action'] ?? 'chat');

// Rate limiting per client IP
$clientIp = Security::getClientIP() ?: ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (!Security::rateLimiting('gemini_' . $clientIp, 120, 60)) { // 120 req / minute
    jsonResponse(['error' => 'Rate limit exceeded'], 429);
}

if ($action !== 'chat') {
    jsonResponse(['error' => 'Unsupported action'], 400);
}

// Ensure API key exists server-side
if (!defined('GEMINI_API_KEY') || GEMINI_API_KEY === '') {
    jsonResponse(['error' => 'Gemini API key not configured on server'], 500);
}

// Read request body
$data = getRequestData();
$message = isset($data['message']) ? trim((string)$data['message']) : '';
$history = (isset($data['history']) && is_array($data['history'])) ? $data['history'] : [];
$systemInstruction = isset($data['systemInstruction']) ? (string)$data['systemInstruction'] : '';
$model = isset($data['model']) ? (string)$data['model'] : 'gemini-2.5-flash';

if ($message === '') {
    jsonResponse(['error' => 'message is required'], 400);
}

// Build REST payload for Gemini API
$contents = [];
// Add conversation history if provided
foreach ($history as $msg) {
    if (!is_array($msg)) { continue; }
    $role = isset($msg['role']) ? (string)$msg['role'] : 'user';
    $text = isset($msg['content']) ? (string)$msg['content'] : '';
    if ($text === '') { continue; }
    $contents[] = [
        'role' => $role,
        'parts' => [ ['text' => $text] ]
    ];
}
// Append current user message
$contents[] = [
    'role' => 'user',
    'parts' => [ ['text' => $message] ]
];

$payload = [ 'contents' => $contents ];
if ($systemInstruction !== '') {
    $payload['system_instruction'] = [ 'parts' => [ ['text' => $systemInstruction] ] ];
}

// Prepare cURL request to Gemini API
$endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/' . $model . ':generateContent';
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-goog-api-key: ' . GEMINI_API_KEY,
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$responseBody = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($responseBody === false) {
    logError('gemini_curl_failed', [ 'error' => $curlErr ]);
    jsonResponse(['error' => 'Upstream request failed', 'details' => $curlErr], 502);
}

$resp = json_decode($responseBody, true);
if ($httpCode < 200 || $httpCode >= 300) {
    logError('gemini_http_error', [ 'status' => $httpCode, 'resp' => $resp ]);
    $errMsg = isset($resp['error']['message']) ? $resp['error']['message'] : ('HTTP ' . $httpCode);
    jsonResponse(['error' => $errMsg, 'status' => $httpCode, 'upstream' => $resp], 502);
}

// Extract text from first candidate
$text = '';
try {
    if (isset($resp['candidates'][0]['content']['parts'][0]['text'])) {
        $text = (string)$resp['candidates'][0]['content']['parts'][0]['text'];
    } elseif (isset($resp['candidates'][0]['content']['parts'][0])) {
        $text = (string)$resp['candidates'][0]['content']['parts'][0];
    }
} catch (Throwable $e) {
    logError('gemini_parse_failure', [ 'e' => $e->getMessage(), 'resp_peek' => substr($responseBody, 0, 500) ]);
}

jsonResponse([
    'text' => $text,
    'model' => $model,
    'candidate' => $resp['candidates'][0] ?? null,
    'prompt_feedback' => $resp['promptFeedback'] ?? null,
]);