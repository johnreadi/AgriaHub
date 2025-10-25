<?php
require_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];

// Extraire le chemin après /api/conversations/
$path = str_replace('/api/conversations/', '', parse_url($request_uri, PHP_URL_PATH));
// Support direct script access (/api/conversations.php) et override via ?path=... ou ?action=...
$pathOnly = trim(parse_url($request_uri, PHP_URL_PATH), '/');
if (preg_match('#api/conversations\.php$#', $pathOnly)) { $path = ''; }
if (isset($_GET['path']) && is_string($_GET['path'])) { $path = $_GET['path']; }
elseif (isset($_GET['action']) && is_string($_GET['action'])) { $path = $_GET['action']; }
$path = is_string($path) ? trim($path, '/') : '';
$path_parts = $path !== '' ? explode('/', $path) : [];

// Vérifier l'authentification pour toutes les routes (robuste même si getallheaders n'existe pas)
// Helpers pour récupérer un jeton de manière robuste (Authorization, cookies, query)
$headers = function_exists('getallheaders') ? getallheaders() : [];
$authHeader = null;
if (isset($headers['Authorization'])) { $authHeader = $headers['Authorization']; }
elseif (!empty($_SERVER['HTTP_AUTHORIZATION'])) { $authHeader = $_SERVER['HTTP_AUTHORIZATION']; }
elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) { $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION']; }
$token = $authHeader ? str_replace('Bearer ', '', $authHeader) : null;
if (!$token) {
    // X-Access-Token header
    $xToken = $headers['X-Access-Token'] ?? $headers['x-access-token'] ?? null;
    if ($xToken && is_string($xToken) && $xToken !== '') { $token = trim($xToken); }
}
if (!$token) {
    // Cookies
    if (isset($_COOKIE['AGRIA_TOKEN']) && is_string($_COOKIE['AGRIA_TOKEN']) && $_COOKIE['AGRIA_TOKEN'] !== '') { $token = trim($_COOKIE['AGRIA_TOKEN']); }
    elseif (isset($_COOKIE['auth_token']) && is_string($_COOKIE['auth_token']) && $_COOKIE['auth_token'] !== '') { $token = trim($_COOKIE['auth_token']); }
}
if (!$token) {
    // Querystring fallback (debug/proxy environnements)
    $qs = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_QUERY);
    if ($qs) { parse_str($qs, $qsa); foreach (['access_token','token'] as $k) { if (isset($qsa[$k]) && is_string($qsa[$k]) && $qsa[$k] !== '') { $token = trim($qsa[$k]); break; } } }
}

// Activer le mode debug via querystring ou en-tête, même sans getallheaders
$hDebug = $headers['X-Debug'] ?? $headers['x-debug'] ?? ($_SERVER['HTTP_X_DEBUG'] ?? null);
$debug = (isset($_GET['debug']) && $_GET['debug'] == '1') || ($hDebug === '1');
$user_data = validateToken($token);

if (!$user_data) {
    jsonResponse(['error' => 'Token invalide'], 401);
}

switch ($method) {
    case 'GET':
        if (empty($path) || $path === '') {
            getConversations($db, $user_data);
        } elseif (is_numeric($path_parts[0]) && isset($path_parts[1]) && $path_parts[1] === 'messages') {
            getMessages($db, $path_parts[0], $user_data);
        } elseif ($path === 'stats') {
            getConversationStats($db, $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'POST':
        if (empty($path) || $path === '') {
            createConversation($db, $user_data);
        } elseif (is_numeric($path_parts[0]) && isset($path_parts[1]) && $path_parts[1] === 'messages') {
            sendMessage($db, $path_parts[0], $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'PUT':
        if (is_numeric($path_parts[0]) && isset($path_parts[1]) && $path_parts[1] === 'read') {
            markAsRead($db, $path_parts[0], $user_data);
        } elseif (is_numeric($path_parts[0])) {
            updateConversation($db, $path_parts[0], $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    case 'DELETE':
        if (is_numeric($path_parts[0])) {
            deleteConversation($db, $path_parts[0], $user_data);
        } elseif (isset($path_parts[0]) && $path_parts[0] === 'messages' && is_numeric($path_parts[1])) {
            deleteMessage($db, $path_parts[1], $user_data);
        } else {
            jsonResponse(['error' => 'Endpoint non trouvé'], 404);
        }
        break;
    
    default:
        jsonResponse(['error' => 'Méthode non autorisée'], 405);
}

function getConversations($db, $user_data) {
    global $debug;
    try {
        if ($user_data['role'] === 'admin') {
            // Les admins voient toutes les conversations
            $query = "SELECT c.*, u.first_name, u.last_name, u.email,
                            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_type != 'admin') as unread_count,
                            (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                            (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
                      FROM conversations c 
                      LEFT JOIN users u ON c.user_id = u.id 
                      ORDER BY c.updated_at DESC";
            $stmt = $db->prepare($query);
        } else {
            // Les utilisateurs ne voient que leurs conversations
            $query = "SELECT c.*,
                            (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND m.is_read = 0 AND m.sender_type = 'admin') as unread_count,
                            (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message,
                            (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
                      FROM conversations c 
                      WHERE c.user_id = :user_id 
                      ORDER BY c.updated_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user_data['user_id']);
        }
        
        $stmt->execute();
        $conversations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse(['conversations' => $conversations]);
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function createConversation($db, $user_data) {
    global $debug;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['subject']) || !isset($data['message'])) {
        jsonResponse(['error' => 'Sujet et message requis'], 400);
    }
    
    try {
        $db->beginTransaction();
        
        // Créer la conversation
        $conv_query = "INSERT INTO conversations (user_id, subject, status, created_at, updated_at) 
                       VALUES (:user_id, :subject, 'open', NOW(), NOW())";
        $conv_stmt = $db->prepare($conv_query);
        $conv_stmt->bindParam(':user_id', $user_data['user_id']);
        $conv_stmt->bindParam(':subject', $data['subject']);
        $conv_stmt->execute();
        
        $conversation_id = $db->lastInsertId();
        
        // Ajouter le premier message
        $msg_query = "INSERT INTO messages (conversation_id, sender_id, sender_type, content, created_at) 
                      VALUES (:conversation_id, :sender_id, 'user', :content, NOW())";
        $msg_stmt = $db->prepare($msg_query);
        $msg_stmt->bindParam(':conversation_id', $conversation_id);
        $msg_stmt->bindParam(':sender_id', $user_data['user_id']);
        $msg_stmt->bindParam(':content', $data['message']);
        $msg_stmt->execute();
        
        $db->commit();
        
        jsonResponse([
            'success' => true,
            'conversation_id' => $conversation_id,
            'message' => 'Conversation créée avec succès'
        ], 201);
    } catch (PDOException $e) {
        $db->rollBack();
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function getMessages($db, $conversation_id, $user_data) {
    global $debug;
    try {
        // Vérifier l'accès à la conversation
        if ($user_data['role'] !== 'admin') {
            $check_query = "SELECT id FROM conversations WHERE id = :conversation_id AND user_id = :user_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(':conversation_id', $conversation_id);
            $check_stmt->bindParam(':user_id', $user_data['user_id']);
            $check_stmt->execute();
            
            if (!$check_stmt->fetch()) {
                jsonResponse(['error' => 'Accès non autorisé'], 403);
            }
        }
        
        $query = "SELECT m.*, u.first_name, u.last_name 
                  FROM messages m 
                  LEFT JOIN users u ON m.sender_id = u.id 
                  WHERE m.conversation_id = :conversation_id 
                  ORDER BY m.created_at ASC";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':conversation_id', $conversation_id);
        $stmt->execute();
        
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        jsonResponse(['messages' => $messages]);
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function sendMessage($db, $conversation_id, $user_data) {
    global $debug;
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['content']) || empty($data['content'])) {
        jsonResponse(['error' => 'Contenu du message requis'], 400);
    }
    
    try {
        // Vérifier l'accès à la conversation
        if ($user_data['role'] !== 'admin') {
            $check_query = "SELECT id FROM conversations WHERE id = :conversation_id AND user_id = :user_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(':conversation_id', $conversation_id);
            $check_stmt->bindParam(':user_id', $user_data['user_id']);
            $check_stmt->execute();
            
            if (!$check_stmt->fetch()) {
                jsonResponse(['error' => 'Accès non autorisé'], 403);
            }
        }
        
        $db->beginTransaction();
        
        // Ajouter le message
        $sender_type = $user_data['role'] === 'admin' ? 'admin' : 'user';
        $msg_query = "INSERT INTO messages (conversation_id, sender_id, sender_type, content, created_at) 
                      VALUES (:conversation_id, :sender_id, :sender_type, :content, NOW())";
        $msg_stmt = $db->prepare($msg_query);
        $msg_stmt->bindParam(':conversation_id', $conversation_id);
        $msg_stmt->bindParam(':sender_id', $user_data['user_id']);
        $msg_stmt->bindParam(':sender_type', $sender_type);
        $msg_stmt->bindParam(':content', $data['content']);
        $msg_stmt->execute();
        
        // Mettre à jour la conversation
        $update_query = "UPDATE conversations SET updated_at = NOW() WHERE id = :conversation_id";
        $update_stmt = $db->prepare($update_query);
        $update_stmt->bindParam(':conversation_id', $conversation_id);
        $update_stmt->execute();
        
        $db->commit();
        
        jsonResponse(['success' => true, 'message' => 'Message envoyé avec succès'], 201);
    } catch (PDOException $e) {
        $db->rollBack();
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function markAsRead($db, $conversation_id, $user_data) {
    global $debug;
    try {
        // Vérifier l'accès à la conversation
        if ($user_data['role'] !== 'admin') {
            $check_query = "SELECT id FROM conversations WHERE id = :conversation_id AND user_id = :user_id";
            $check_stmt = $db->prepare($check_query);
            $check_stmt->bindParam(':conversation_id', $conversation_id);
            $check_stmt->bindParam(':user_id', $user_data['user_id']);
            $check_stmt->execute();
            
            if (!$check_stmt->fetch()) {
                jsonResponse(['error' => 'Accès non autorisé'], 403);
            }
        }
        
        // Marquer les messages comme lus
        $sender_type_condition = $user_data['role'] === 'admin' ? 'user' : 'admin';
        $query = "UPDATE messages SET is_read = 1 
                  WHERE conversation_id = :conversation_id AND sender_type = :sender_type";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':conversation_id', $conversation_id);
        $stmt->bindParam(':sender_type', $sender_type_condition);
        $stmt->execute();
        
        jsonResponse(['success' => true, 'message' => 'Messages marqués comme lus']);
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function updateConversation($db, $conversation_id, $user_data) {
    global $debug;
    // Seuls les admins peuvent modifier le statut des conversations
    if ($user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($data['status'])) {
        jsonResponse(['error' => 'Statut requis'], 400);
    }
    
    try {
        $query = "UPDATE conversations SET status = :status, updated_at = NOW() WHERE id = :conversation_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $data['status']);
        $stmt->bindParam(':conversation_id', $conversation_id);
        
        if ($stmt->execute()) {
            jsonResponse(['success' => true, 'message' => 'Conversation mise à jour avec succès']);
        } else {
            jsonResponse(['error' => 'Erreur lors de la mise à jour'], 500);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function deleteConversation($db, $conversation_id, $user_data) {
    global $debug;
    // Seuls les admins peuvent supprimer des conversations
    if ($user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "DELETE FROM conversations WHERE id = :conversation_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':conversation_id', $conversation_id);
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            jsonResponse(['success' => true, 'message' => 'Conversation supprimée avec succès']);
        } else {
            jsonResponse(['error' => 'Conversation non trouvée'], 404);
        }
    } catch (PDOException $e) {
        $payload = ['error' => 'Erreur de base de données'];
        if ($debug) { $payload['error_details'] = $e->getMessage(); }
        jsonResponse($payload, 500);
    }
}

function deleteMessage($db, $message_id, $user_data) {
    try {
        // Vérifier que l'utilisateur peut supprimer ce message
        if ($user_data['role'] === 'admin') {
            $query = "DELETE FROM messages WHERE id = :message_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':message_id', $message_id);
        } else {
            // Les utilisateurs ne peuvent supprimer que leurs propres messages
            $query = "DELETE FROM messages WHERE id = :message_id AND sender_id = :user_id AND sender_type = 'user'";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':message_id', $message_id);
            $stmt->bindParam(':user_id', $user_data['user_id']);
        }
        
        if ($stmt->execute() && $stmt->rowCount() > 0) {
            jsonResponse(['success' => true, 'message' => 'Message supprimé avec succès']);
        } else {
            jsonResponse(['error' => 'Message non trouvé ou accès non autorisé'], 404);
        }
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}

function getConversationStats($db, $user_data) {
    // Seuls les admins peuvent voir les statistiques
    if ($user_data['role'] !== 'admin') {
        jsonResponse(['error' => 'Accès non autorisé'], 403);
    }
    
    try {
        $query = "SELECT 
                    COUNT(*) as total_conversations,
                    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_conversations,
                    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_conversations,
                    (SELECT COUNT(*) FROM messages WHERE sender_type = 'user' AND is_read = 0) as unread_messages
                  FROM conversations";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $stats = $stmt->fetch(PDO::FETCH_ASSOC);
        
        jsonResponse(['stats' => $stats]);
    } catch (PDOException $e) {
        jsonResponse(['error' => 'Erreur de base de données'], 500);
    }
}
?>