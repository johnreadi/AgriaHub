<?php

class AuthMiddleware {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    /**
     * Vérifier l'authentification de l'utilisateur
     */
    public function authenticate($requiredRole = null) {
        $token = $this->getBearerToken();
        
        if (!$token) {
            sec_log('auth_missing_token', ['ip' => sec_getClientIP()]);
            jsonResponse(['error' => 'Token d\'authentification requis'], 401);
        }
        
        $payload = sec_verifyJWT($token);
        if (!$payload) {
            sec_log('auth_invalid_token', ['ip' => sec_getClientIP()]);
            jsonResponse(['error' => 'Token invalide ou expiré'], 401);
        }
        
        // Vérifier que l'utilisateur existe et est actif
        $user = $this->getUserById($payload['user_id']);
        if (!$user || !$user['active']) {
            sec_log('auth_inactive_user', ['user_id' => $payload['user_id']]);
            jsonResponse(['error' => 'Utilisateur inactif'], 401);
        }
        
        // Vérifier le rôle si requis
        if ($requiredRole && !$this->hasRole($user['role'], $requiredRole)) {
            sec_log('auth_insufficient_permissions', [
                'user_id' => $user['id'],
                'required_role' => $requiredRole,
                'user_role' => $user['role']
            ]);
            jsonResponse(['error' => 'Permissions insuffisantes'], 403);
        }
        
        // Mettre à jour la dernière activité
        $this->updateLastActivity($user['id']);
        
        return $user;
    }
    
    /**
     * Vérifier les permissions CSRF pour les requêtes POST/PUT/DELETE
     */
    public function validateCSRF() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if (in_array($method, ['POST', 'PUT', 'DELETE', 'PATCH'])) {
            $headers = getallheaders();
            $csrfToken = $headers['X-CSRF-Token'] ?? null;
            
            if (!$csrfToken || !sec_verifyCSRFToken($csrfToken)) {
                sec_log('csrf_validation_failed', ['ip' => sec_getClientIP()]);
                jsonResponse(['error' => 'Token CSRF invalide'], 403);
            }
        }
    }
    
    /**
     * Middleware pour les administrateurs uniquement
     */
    public function requireAdmin() {
        return $this->authenticate('admin');
    }
    
    /**
     * Middleware pour les managers et administrateurs
     */
    public function requireManager() {
        $user = $this->authenticate();
        if (!$this->hasRole($user['role'], 'manager')) {
            sec_log('auth_insufficient_permissions', [
                'user_id' => $user['id'],
                'required_role' => 'manager',
                'user_role' => $user['role']
            ]);
            jsonResponse(['error' => 'Permissions insuffisantes'], 403);
        }
        return $user;
    }
    
    /**
     * Middleware pour vérifier que l'utilisateur accède à ses propres données
     */
    public function requireOwnershipOrAdmin($resourceUserId) {
        $user = $this->authenticate();
        
        if ($user['role'] !== 'admin' && $user['id'] != $resourceUserId) {
            sec_log('auth_unauthorized_access', [
                'user_id' => $user['id'],
                'attempted_resource_user_id' => $resourceUserId
            ]);
            jsonResponse(['error' => 'Accès non autorisé à cette ressource'], 403);
        }
        
        return $user;
    }
    
    /**
     * Extraire le token Bearer de l'en-tête Authorization
     */
    private function getBearerToken() {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
                return $matches[1];
            }
        }
        return null;
    }
    
    /**
     * Récupérer un utilisateur par son ID
     */
    private function getUserById($userId) {
        try {
            // Construire dynamiquement la clause d'activité
            $hasActive = function_exists('dbColumnExists') ? dbColumnExists($this->db, 'active') : false;
            $hasIsActive = function_exists('dbColumnExists') ? dbColumnExists($this->db, 'is_active') : false;
            $activeSelect = $hasIsActive ? ', is_active AS active' : '';
            $activePredicate = ($hasActive || $hasIsActive) ? ' AND (' . implode(' OR ', array_filter([
                $hasActive ? 'active = 1' : null,
                $hasIsActive ? 'is_active = 1' : null
            ])) . ')' : '';

            $query = "SELECT id, email, first_name, last_name, role, last_login" . $activeSelect . " FROM users WHERE id = :id" . $activePredicate;
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            return $user;
        } catch (Exception $e) {
            logError('Erreur lors de la récupération de l\'utilisateur', [
                'error' => $e->getMessage(),
                'user_id' => $userId
            ]);
            return null;
        }
    }
    
    /**
     * Vérifier si l'utilisateur a le rôle requis
     */
    private function hasRole($userRole, $requiredRole) {
        $roleHierarchy = [
            'user' => 1,
            'manager' => 2,
            'admin' => 3
        ];
        
        $userLevel = $roleHierarchy[$userRole] ?? 0;
        $requiredLevel = $roleHierarchy[$requiredRole] ?? 0;
        
        return $userLevel >= $requiredLevel;
    }
    
    /**
     * Mettre à jour la dernière activité de l'utilisateur
     */
    private function updateLastActivity($userId) {
        try {
            $query = "UPDATE users SET last_login = NOW() WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $userId);
            $stmt->execute();
        } catch (Exception $e) {
            // Log l'erreur mais ne pas interrompre le processus
            logError('Erreur lors de la mise à jour de la dernière activité', [
                'error' => $e->getMessage(),
                'user_id' => $userId
            ]);
        }
    }
    
    /**
     * Vérifier si une session est valide (optionnel, pour un tracking plus avancé)
     */
    public function validateSession($sessionToken) {
        try {
            // Clause dynamique pour l'activité utilisateur
            $hasActive = function_exists('dbColumnExists') ? dbColumnExists($this->db, 'active') : false;
            $hasIsActive = function_exists('dbColumnExists') ? dbColumnExists($this->db, 'is_active') : false;
            $userActiveClause = ($hasActive || $hasIsActive) ? '(' . implode(' OR ', array_filter([
                $hasActive ? 'u.active = 1' : null,
                $hasIsActive ? 'u.is_active = 1' : null
            ])) . ')' : '1=1';
            $sessionActiveClause = ($hasActive || $hasIsActive) ? '(' . implode(' OR ', array_filter([
                $hasActive ? 'us.active = 1' : null,
                $hasIsActive ? 'us.is_active = 1' : null
            ])) . ')' : '1=1';

            $query = "SELECT us.* FROM user_sessions us JOIN users u ON us.user_id = u.id WHERE us.session_token = :token AND us.expires_at > NOW() AND " . $sessionActiveClause . " AND " . $userActiveClause;
            
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':token', $sessionToken);
            $stmt->execute();
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($session) {
                // Mettre à jour l'expiration de la session
                $this->extendSession($session['id']);
                return $session;
            }
            
            return null;
        } catch (Exception $e) {
            logError('Erreur lors de la validation de session', [
                'error' => $e->getMessage(),
                'session_token' => substr($sessionToken, 0, 10) . '...'
            ]);
            return null;
        }
    }
    
    /**
     * Étendre la durée de vie d'une session
     */
    private function extendSession($sessionId) {
        try {
            $query = "UPDATE user_sessions 
                      SET expires_at = DATE_ADD(NOW(), INTERVAL " . SESSION_TIMEOUT . " SECOND) 
                      WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':id', $sessionId);
            $stmt->execute();
        } catch (Exception $e) {
            logError('Erreur lors de l\'extension de session', [
                'error' => $e->getMessage(),
                'session_id' => $sessionId
            ]);
        }
    }
    
    /**
     * Invalider toutes les sessions d'un utilisateur
     */
    public function invalidateUserSessions($userId) {
        try {
            $query = "UPDATE user_sessions SET active = 0 WHERE user_id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            
            sec_log('sessions_invalidated', ['user_id' => $userId]);
        } catch (Exception $e) {
            logError('Erreur lors de l\'invalidation des sessions', [
                'error' => $e->getMessage(),
                'user_id' => $userId
            ]);
        }
    }
}