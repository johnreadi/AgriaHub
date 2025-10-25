<?php
/**
 * Fonctions de base de données pour AGRIA ROUEN
 * Adapté au schéma MySQL spécifique
 */

require_once __DIR__ . '/config.php';

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset = 'utf8mb4';
    private $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ];
    
    private static $instance = null;
    public $conn;

    public function __construct() {
        $this->host = DB_HOST ?? "db5018629781.hosting-data.io";
        $this->db_name = DB_NAME ?? "dbs14768810";
        $this->username = DB_USER ?? "dbu3279635";
        $this->password = DB_PASS ?? "Resto.AgriaRouen76100";
        
        $this->options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        $this->options[PDO::ATTR_TIMEOUT] = 30;
        $this->options[PDO::ATTR_PERSISTENT] = false;
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host={$this->host};port=" . (defined('DB_PORT') ? DB_PORT : 3306) . ";dbname={$this->db_name};charset={$this->charset}";
                $this->conn = new PDO($dsn, $this->username, $this->password, $this->options);
                
                try {
                    $this->conn->exec("SET sql_mode = 'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
                } catch (PDOException $e) {
                    logError('SET sql_mode échoué', ['error' => $e->getMessage()]);
                }
                
                if (ENVIRONMENT === 'development') {
                    logError('Connexion base de données établie', ['host' => $this->host, 'database' => $this->db_name]);
                }
                
            } catch(PDOException $exception) {
                $errorMessage = "Erreur de connexion à la base de données";
                $errorDetails = [
                    'error_code' => $exception->getCode(),
                    'host' => $this->host,
                    'database' => $this->db_name
                ];
                
                if (ENVIRONMENT === 'development') {
                    $errorDetails['error_message'] = $exception->getMessage();
                }
                
                logError($errorMessage, $errorDetails);
                
                if (ENVIRONMENT === 'production') {
                    throw new Exception("Erreur de connexion à la base de données");
                } else {
                    throw new Exception("Erreur de connexion: " . $exception->getMessage());
                }
            }
        }

        return $this->conn;
    }
    
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
    
    public function fetchOne($query, $params = []) {
        $stmt = $this->executeQuery($query, $params);
        return $stmt->fetch();
    }
    
    public function fetchAll($query, $params = []) {
        $stmt = $this->executeQuery($query, $params);
        return $stmt->fetchAll();
    }
    
    public function insert($table, $data) {
        $fields = array_keys($data);
        $placeholders = ':' . implode(', :', $fields);
        $fieldsList = implode(', ', $fields);
        
        $query = "INSERT INTO {$table} ({$fieldsList}) VALUES ({$placeholders})";
        
        $this->executeQuery($query, $data);
        return $this->getConnection()->lastInsertId();
    }
    
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
    
    public function delete($table, $where, $whereParams = []) {
        $query = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->executeQuery($query, $whereParams);
        return $stmt->rowCount();
    }
    
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }
    
    public function commit() {
        return $this->getConnection()->commit();
    }
    
    public function rollback() {
        return $this->getConnection()->rollback();
    }
    
    public function tableExists($tableName) {
        $sql = "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = :table_name LIMIT 1";
        $stmt = $this->executeQuery($sql, ['db_name' => $this->db_name, 'table_name' => $tableName]);
        return $stmt->fetch() !== false;
    }
    
    public function getDatabaseInfo() {
        $info = [];
        
        try {
            $stmt = $this->executeQuery("SELECT VERSION() as version");
            $info['mysql_version'] = $stmt->fetch()['version'];
            
            $query = "SELECT 
                        SUM(data_length + index_length) / 1024 / 1024 AS size_mb
                      FROM information_schema.tables 
                      WHERE table_schema = :db_name";
            $stmt = $this->executeQuery($query, ['db_name' => $this->db_name]);
            $info['database_size_mb'] = round($stmt->fetch()['size_mb'], 2);
            
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
    
    public function closeConnection() {
        $this->conn = null;
    }
    
    public function __destruct() {
        $this->closeConnection();
    }
}

// FONCTIONS ADAPTÉES À VOTRE SCHÉMA MYSQL

/**
 * Récupère tous les utilisateurs (adapté à votre schéma)
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
 * Récupère un utilisateur par ID (adapté à votre schéma)
 */
function getUserById($userId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, email, first_name, last_name, phone, card_number, balance, role, created_at 
            FROM users 
            WHERE id = :id AND (is_active = 1 OR active = 1)
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
 * Récupère un utilisateur par email (adapté à votre schéma)
 */
function getUserByEmail($email) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, email, password, first_name, last_name, phone, card_number, balance, role, created_at 
            FROM users 
            WHERE email = :email AND (is_active = 1 OR active = 1)
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
 * Crée un nouvel utilisateur (adapté à votre schéma)
 */
function createUser($userData) {
    global $pdo;
    
    try {
        // Générer un numéro de carte unique
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
 * Met à jour un utilisateur (adapté à votre schéma)
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
 * Supprime un utilisateur (adapté à votre schéma)
 */
function deleteUser($userId) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("UPDATE users SET is_active = 0, active = 0 WHERE id = :id");
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur deleteUser: " . $e->getMessage());
        return false;
    }
}

/**
 * Recharge le solde d'une carte (adapté à votre schéma)
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
        
        // Enregistrement de l'activité dans user_activities si la table existe
        if (dbTableExists($pdo, 'user_activities')) {
            $stmt = $pdo->prepare("
                INSERT INTO user_activities (user_id, type, description, amount) 
                VALUES (:user_id, 'recharge', 'Rechargement de carte', :amount)
            ");
            $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindValue(':amount', $amount, PDO::PARAM_STR);
            $stmt->execute();
        }
        
        $pdo->commit();
        return true;
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Erreur rechargeCard: " . $e->getMessage());
        return false;
    }
}

/**
 * Génère un numéro de carte unique (adapté à votre schéma)
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
 * Récupère les activités d'un utilisateur (adapté à votre schéma)
 */
function getUserActivities($userId, $limit = 50) {
    global $pdo;
    
    try {
        // Essayer d'abord la table user_activities
        if (dbTableExists($pdo, 'user_activities')) {
            $stmt = $pdo->prepare("
                SELECT type, description, amount, created_at 
                FROM user_activities 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit
            ");
        } else {
            // Fallback sur transactions si user_activities n'existe pas
            $stmt = $pdo->prepare("
                SELECT 'transaction' as type, description, amount, created_at 
                FROM transactions 
                WHERE user_id = :user_id 
                ORDER BY created_at DESC 
                LIMIT :limit
            ");
        }
        
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
 * Récupère les éléments du menu (ADAPTÉ À VOTRE SCHÉMA)
 */
function getMenuItems($category = null) {
    global $pdo;
    
    try {
        $sql = "SELECT id, name, description, price, category, image_url, 
                       is_available as available, is_featured as featured,
                       is_vegetarian as vegetarian, is_vegan as vegan
                FROM menu_items 
                WHERE is_available = 1";
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
 * Récupère les slides (ADAPTÉ À VOTRE SCHÉMA - utilise order_index)
 */
function getSlides() {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT id, title, subtitle, description, image_url, 
                   button_text, button_url, background_color, text_color,
                   order_index as sort_order, is_active
            FROM slides 
            WHERE is_active = 1 
            ORDER BY order_index ASC
        ");
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getSlides: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les informations de l'entreprise (adapté à votre schéma)
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
 * Met à jour les informations de l'entreprise (adapté à votre schéma)
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
                description = :description,
                updated_at = NOW()
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

/**
 * Crée une nouvelle commande (utilise les tables orders/order_items)
 */
function createOrder($orderData) {
    global $pdo;
    
    try {
        $pdo->beginTransaction();
        
        // Générer un numéro de commande unique
        $orderNumber = 'CMD-' . date('Ymd-His') . '-' . rand(1000, 9999);
        
        // Créer la commande
        $orderStmt = $pdo->prepare("
            INSERT INTO orders (user_id, order_number, total_amount, status, payment_status, customer_name, customer_phone)
            VALUES (:user_id, :order_number, :total_amount, 'pending', 'pending', :customer_name, :customer_phone)
        ");
        
        $orderStmt->execute([
            ':user_id' => $orderData['user_id'],
            ':order_number' => $orderNumber,
            ':total_amount' => $orderData['total_amount'],
            ':customer_name' => $orderData['customer_name'],
            ':customer_phone' => $orderData['customer_phone'] ?? null
        ]);
        
        $orderId = $pdo->lastInsertId();
        
        // Ajouter les items de la commande
        foreach ($orderData['items'] as $item) {
            $itemStmt = $pdo->prepare("
                INSERT INTO order_items (order_id, menu_item_id, item_name, item_price, quantity, total_price)
                VALUES (:order_id, :menu_item_id, :item_name, :item_price, :quantity, :total_price)
            ");
            
            $itemStmt->execute([
                ':order_id' => $orderId,
                ':menu_item_id' => $item['menu_item_id'],
                ':item_name' => $item['name'],
                ':item_price' => $item['price'],
                ':quantity' => $item['quantity'],
                ':total_price' => $item['price'] * $item['quantity']
            ]);
        }
        
        $pdo->commit();
        return $orderId;
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Erreur createOrder: " . $e->getMessage());
        return false;
    }
}

/**
 * Récupère les commandes d'un utilisateur
 */
function getUserOrders($userId, $limit = 20) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT o.*, 
                   (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
            FROM orders o 
            WHERE o.user_id = :user_id 
            ORDER BY o.created_at DESC 
            LIMIT :limit
        ");
        $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur getUserOrders: " . $e->getMessage());
        return false;
    }
}

/**
 * Vérifie si une table existe
 */
function dbTableExists($pdo, $tableName) {
    try {
        $stmt = $pdo->prepare("
            SELECT 1 FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = :db_name AND TABLE_NAME = :table_name 
            LIMIT 1
        ");
        $stmt->execute([
            ':db_name' => DB_NAME,
            ':table_name' => $tableName
        ]);
        return $stmt->fetch() !== false;
    } catch (PDOException $e) {
        error_log("Erreur dbTableExists: " . $e->getMessage());
        return false;
    }
}

/**
 * Vérifie si une colonne existe dans une table
 */
function dbColumnExists($pdo, $column, $table = 'users') {
    try {
        $stmt = $pdo->prepare("
            SELECT 1 FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = :db_name 
            AND TABLE_NAME = :table 
            AND COLUMN_NAME = :column 
            LIMIT 1
        ");
        $stmt->execute([
            ':db_name' => DB_NAME,
            ':table' => $table,
            ':column' => $column
        ]);
        return $stmt->fetch() !== false;
    } catch (PDOException $e) {
        error_log("Erreur dbColumnExists: " . $e->getMessage());
        return false;
    }
}

// Initialisation de la connexion PDO globale
try {
    $database = new Database();
    $pdo = $database->getConnection();
} catch (Exception $e) {
    error_log("Erreur initialisation connexion PDO: " . $e->getMessage());
    $pdo = null;
}
?>