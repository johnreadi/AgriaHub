<?php
/**
 * Fonctions de base de données pour AGRIA ROUEN
 * Compatible avec hébergement mutualisé IONOS
 */

require_once __DIR__ . '/config.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset = 'utf8mb4';
    private $options = []; // initialized safely in constructor to avoid fatal when PDO is missing
    
    private static $instance = null;
    public $conn;

    public function __construct() {
        // Configuration depuis les variables d'environnement ou config
        $this->host = DB_HOST ?? "db5018629781.hosting-data.io";
        $this->db_name = DB_NAME ?? "dbs14768810";
        $this->username = DB_USER ?? "dbu3279635";
        $this->password = DB_PASS ?? "Resto.AgriaRouen76100";
        
        // Initialiser les options PDO de manière sûre seulement si PDO est disponible
        if (class_exists('PDO')) {
            $this->options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
                PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
                PDO::ATTR_TIMEOUT => 30,
                PDO::ATTR_PERSISTENT => false,
            ];
        } else {
            $this->options = [];
        }
    }
    
    /**
     * Singleton pattern pour éviter les connexions multiples
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        if ($this->conn === null) {
            try {
                if (!class_exists('PDO')) {
                    throw new Exception('PDO extension not available');
                }
                $dsn = "mysql:host={$this->host};port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname={$this->db_name};charset={$this->charset}";
                $this->conn = new PDO($dsn, $this->username, $this->password, $this->options);
                
                // Configuration de sécurité supplémentaire (compat MySQL 8)
                try {
                    $this->conn->exec("SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
                    $this->conn->exec("SET SESSION sql_safe_updates = 1");
                } catch (PDOException $e) {
                    // Journaliser et continuer si le serveur n'accepte pas certains modes
                    logError('SET sql_mode/sql_safe_updates échoué', ['error' => $e->getMessage()]);
                }
                
                // Log de connexion réussie (sans informations sensibles)
                if (ENVIRONMENT === 'development') {
                    logError('Connexion base de données établie', ['host' => $this->host, 'database' => $this->db_name]);
                }
                
            } catch (Throwable $exception) {
                // Log sécurisé de l'erreur (couvre PDOException et Error: class PDO not found)
                $errorMessage = "Erreur de connexion à la base de données";
                $errorDetails = [
                    'error_code' => method_exists($exception, 'getCode') ? $exception->getCode() : null,
                    'host' => $this->host,
                    'database' => $this->db_name
                ];
                
                // En développement, inclure plus de détails
                if (defined('ENVIRONMENT') && ENVIRONMENT === 'development') {
                    $errorDetails['error_message'] = $exception->getMessage();
                }
                
                logError($errorMessage, $errorDetails);
                
                // En production, ne pas exposer les détails de l'erreur
                if (defined('ENVIRONMENT') && ENVIRONMENT === 'production') {
                    throw new Exception("Erreur de connexion à la base de données");
                } else {
                    throw new Exception("Erreur de connexion: " . $exception->getMessage());
                }
            }
        }

        return $this->conn;
    }
    
    /**
     * Exécuter une requête préparée de manière sécurisée
     */
    public function executeQuery($query, $params = []) {
        try {
            $stmt = $this->getConnection()->prepare($query);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            logError('Erreur lors de l\'exécution de la requête', [
                'error' => $e->getMessage(),
                'query' => $query,
                'params' => $this->sanitizeParamsForLog($params)
            ]);
            throw $e;
        }
    }
    
    /**
     * Récupérer un seul enregistrement
     */
    public function fetchOne($query, $params = []) {
        $stmt = $this->executeQuery($query, $params);
        return $stmt->fetch();
    }
    
    /**
     * Récupérer tous les enregistrements
     */
    public function fetchAll($query, $params = []) {
        $stmt = $this->executeQuery($query, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Insérer un enregistrement et retourner l'ID
     */
    public function insert($table, $data) {
        $fields = array_keys($data);
        $placeholders = ':' . implode(', :', $fields);
        $fieldsList = implode(', ', $fields);
        
        $query = "INSERT INTO {$table} ({$fieldsList}) VALUES ({$placeholders})";
        
        $this->executeQuery($query, $data);
        return $this->getConnection()->lastInsertId();
    }
    
    /**
     * Mettre à jour un enregistrement
     */
    public function update($table, $data, $where, $whereParams = []) {
        $fields = [];
        foreach (array_keys($data) as $field) {
            $fields[] = "{$field} = :{$field}";
        }
        $fieldsList = implode(', ', $fields);
        
        $query = "UPDATE {$table} SET {$fieldsList} WHERE {$where}";
        $params = array_merge($data, $whereParams);
        
        $stmt = $this->executeQuery($query, $params);
        return $stmt->rowCount();
    }
    
    /**
     * Supprimer un enregistrement
     */
    public function delete($table, $where, $whereParams = []) {
        $query = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->executeQuery($query, $whereParams);
        return $stmt->rowCount();
    }
    
    /**
     * Commencer une transaction
     */
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }
    
    /**
     * Valider une transaction
     */
    public function commit() {
        return $this->getConnection()->commit();
    }
    
    /**
     * Annuler une transaction
     */
    public function rollback() {
        return $this->getConnection()->rollback();
    }
    
    /**
     * Vérifier si une table existe
     */
    public function tableExists($tableName) {
        // Utiliser information_schema au lieu de SHOW TABLES avec placeholders (évite les erreurs 1064 sur certains hébergeurs)
        $sql = "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = :table_name LIMIT 1";
        $stmt = $this->executeQuery($sql, ['db_name' => $this->db_name, 'table_name' => $tableName]);
        return $stmt->fetch() !== false;
    }
    
    /**
     * Obtenir des informations sur la base de données
     */
    public function getDatabaseInfo() {
        $info = [];
        
        try {
            // Version MySQL
            $stmt = $this->executeQuery("SELECT VERSION() as version");
            $info['mysql_version'] = $stmt->fetch()['version'];
            
            // Taille de la base de données
            $query = "SELECT 
                        SUM(data_length + index_length) / 1024 / 1024 AS size_mb
                      FROM information_schema.tables 
                      WHERE table_schema = :db_name";
            $stmt = $this->executeQuery($query, ['db_name' => $this->db_name]);
            $info['database_size_mb'] = round($stmt->fetch()['size_mb'], 2);
            
            // Nombre de tables
            $query = "SELECT COUNT(*) as table_count 
                      FROM information_schema.tables 
                      WHERE table_schema = :db_name";
            $stmt = $this->executeQuery($query, ['db_name' => $this->db_name]);
            $info['table_count'] = $stmt->fetch()['table_count'];
            
        } catch (Exception $e) {
            logError('Erreur lors de la récupération des informations de la base de données', [
                'error' => $e->getMessage()
            ]);
        }
        
        return $info;
    }
    
    /**
     * Nettoyer les paramètres pour les logs (supprimer les mots de passe)
     */
    private function sanitizeParamsForLog($params) {
        $sanitized = $params;
        $sensitiveFields = ['password', 'token', 'secret', 'key'];
        
        foreach ($sensitiveFields as $field) {
            if (isset($sanitized[$field])) {
                $sanitized[$field] = '[REDACTED]';
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Fermer la connexion
     */
    public function closeConnection() {
        $this->conn = null;
    }
    
    /**
     * Destructeur pour s'assurer que la connexion est fermée
     */
    public function __destruct() {
        $this->closeConnection();
    }
}

/**
 * Récupère tous les utilisateurs
 */
function getAllUsers($limit = 100, $offset = 0) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, email, first_name, last_name, phone, card_number, balance, role, created_at 
            FROM users 
            ORDER BY created_at DESC 
            LIMIT :limit OFFSET :offset
        ");
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getAllUsers: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère un utilisateur par ID
 */
function getUserById($userId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, email, first_name, last_name, phone, card_number, balance, role, created_at 
            FROM users 
            WHERE id = :id
        ");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getUserById: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère un utilisateur par email
 */
function getUserByEmail($email) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, email, password, first_name, last_name, phone, card_number, balance, role, created_at 
            FROM users 
            WHERE email = :email
        ");
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getUserByEmail: " . $e->getMessage());
        return false;
    }
}

/**
 * Crée un nouvel utilisateur
 */
function createUser($userData) {
    global $pdo;
    
    try {
        // Génération automatique du numéro de carte
        $cardNumber = generateCardNumber();
        
        $stmt = $pdo->prepare("
            INSERT INTO users (email, password, first_name, last_name, phone, card_number, balance, role) 
            VALUES (:email, :password, :first_name, :last_name, :phone, :card_number, :balance, :role)
        ");
        
        $stmt->bindValue(':email', $userData['email'], PDO::PARAM_STR);
        $stmt->bindValue(':password', sec_hashPassword($userData['password']), PDO::PARAM_STR);
        $stmt->bindValue(':first_name', $userData['first_name'], PDO::PARAM_STR);
        $stmt->bindValue(':last_name', $userData['last_name'], PDO::PARAM_STR);
        $stmt->bindValue(':phone', $userData['phone'] ?? null, PDO::PARAM_STR);
        $stmt->bindValue(':card_number', $cardNumber, PDO::PARAM_STR);
        $stmt->bindValue(':balance', $userData['balance'] ?? 0.00, PDO::PARAM_STR);
        $stmt->bindValue(':role', $userData['role'] ?? 'user', PDO::PARAM_STR);
        
        $stmt->execute();
        
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        error_log("Erreur createUser: " . $e->getMessage());
        return false;
    }
}

/**
 * Met à jour un utilisateur
 */
function updateUser($userId, $userData) {
    global $pdo;
    
    try {
        $fields = [];
        $params = [':id' => $userId];
        
        foreach ($userData as $key => $value) {
            if ($key !== 'id' && $key !== 'password') {
                $fields[] = "$key = :$key";
                $params[":$key"] = $value;
            }
        }
        
        if (isset($userData['password'])) {
            $fields[] = "password = :password";
            $params[':password'] = sec_hashPassword($userData['password']);
        }
        
        if (empty($fields)) {
            return false;
        }
        
        $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        
        return $stmt->execute($params);
    } catch (PDOException $e) {
        error_log("Erreur updateUser: " . $e->getMessage());
        return false;
    }
}

/**
 * Supprime un utilisateur
 */
function deleteUser($userId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur deleteUser: " . $e->getMessage());
        return false;
    }
}

/**
 * Recharge le solde d'une carte
 */
function rechargeCard($userId, $amount) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Mise à jour du solde
        $stmt = $pdo->prepare("UPDATE users SET balance = balance + :amount WHERE id = :id");
        $stmt->bindValue(':amount', $amount, PDO::PARAM_STR);
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();
        
        // Enregistrement de l'activité
        $stmt = $pdo->prepare("
            INSERT INTO activities (user_id, type, description, amount) 
            VALUES (:user_id, 'recharge', 'Rechargement de carte', :amount)
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':amount', $amount, PDO::PARAM_STR);
        $stmt->execute();
        
        $pdo->commit();
        return true;
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Erreur rechargeCard: " . $e->getMessage());
        return false;
    }
}

/**
 * Génère un numéro de carte unique
 */
function generateCardNumber() {
    global $pdo;
    
    do {
        $cardNumber = 'AG' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT);
        
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE card_number = :card_number");
        $stmt->bindValue(':card_number', $cardNumber, PDO::PARAM_STR);
        $stmt->execute();
        
        $exists = $stmt->fetchColumn() > 0;
    } while ($exists);
    
    return $cardNumber;
}

/**
 * Récupère les activités d'un utilisateur
 */
function getUserActivities($userId, $limit = 50) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT type, description, amount, created_at 
            FROM activities 
            WHERE user_id = :user_id 
            ORDER BY created_at DESC 
            LIMIT :limit
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getUserActivities: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les éléments du menu
 */
function getMenuItems($category = null) {
    global $pdo;
    
    try {
        $sql = "SELECT * FROM menu_items WHERE available = 1";
        $params = [];
        
        if ($category) {
            $sql .= " AND category = :category";
            $params[':category'] = $category;
        }
        
        $sql .= " ORDER BY category, name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getMenuItems: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les informations de l'entreprise
 */
function getCompanyInfo() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM company_info ORDER BY id DESC LIMIT 1");
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getCompanyInfo: " . $e->getMessage());
        return false;
    }
}

/**
 * Met à jour les informations de l'entreprise
 */
function updateCompanyInfo($data) {
    global $pdo;
    
    try {
        // Vérifier s'il existe déjà des informations
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM company_info");
        $stmt->execute();
        $exists = $stmt->fetchColumn() > 0;
        
        if ($exists) {
            $stmt = $pdo->prepare("
                UPDATE company_info SET 
                name = :name, 
                address = :address, 
                phone = :phone, 
                email = :email, 
                opening_hours = :opening_hours, 
                description = :description
            ");
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO company_info (name, address, phone, email, opening_hours, description) 
                VALUES (:name, :address, :phone, :email, :opening_hours, :description)
            ");
        }
        
        $stmt->bindValue(':name', $data['name'], PDO::PARAM_STR);
        $stmt->bindValue(':address', $data['address'], PDO::PARAM_STR);
        $stmt->bindValue(':phone', $data['phone'], PDO::PARAM_STR);
        $stmt->bindValue(':email', $data['email'], PDO::PARAM_STR);
        $stmt->bindValue(':opening_hours', $data['opening_hours'], PDO::PARAM_STR);
        $stmt->bindValue(':description', $data['description'], PDO::PARAM_STR);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur updateCompanyInfo: " . $e->getMessage());
        return false;
    }
}
?>