-- Script de création de la base de données sécurisée pour AGRIA ROUEN
-- Exécuter ce script pour créer les tables nécessaires avec les champs de sécurité

-- Table des utilisateurs avec champs de sécurité
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    card_number VARCHAR(20) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    role ENUM('user', 'admin', 'manager') DEFAULT 'user',
    active BOOLEAN DEFAULT TRUE,
    failed_login_attempts INT DEFAULT 0,
    last_failed_login TIMESTAMP NULL,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_card_number (card_number),
    INDEX idx_active (active),
    INDEX idx_role (role)
);

-- Table des refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_revoked (revoked)
);

-- Table des logs de sécurité
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id INT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    data JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_type (event_type),
    INDEX idx_user_id (user_id),
    INDEX idx_ip_address (ip_address),
    INDEX idx_created_at (created_at)
);

-- Table de rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    requests_count INT DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_identifier (identifier),
    INDEX idx_window_start (window_start)
);

-- Table des transactions (si nécessaire pour le système de cartes)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('credit', 'debit', 'refund') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    reference VARCHAR(100) NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Table des sessions (optionnelle, pour un tracking plus avancé)
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NULL,
    expires_at TIMESTAMP NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session_token (session_token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_active (active)
);

-- Procédure pour nettoyer les tokens expirés
DELIMITER //
CREATE PROCEDURE CleanExpiredTokens()
BEGIN
    -- Supprimer les refresh tokens expirés
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    
    -- Supprimer les sessions expirées
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Nettoyer les anciens logs de sécurité (garder 90 jours)
    DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Nettoyer les anciens rate limits (garder 24 heures)
    DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END //
DELIMITER ;

-- Événement pour exécuter automatiquement le nettoyage
CREATE EVENT IF NOT EXISTS cleanup_expired_data
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL CleanExpiredTokens();

-- Insertion d'un utilisateur admin par défaut (mot de passe: Admin123!)
-- ATTENTION: Changer ce mot de passe en production !
INSERT INTO users (email, password, first_name, last_name, phone, card_number, role, active) 
VALUES (
    'admin@agria-rouen.fr', 
    '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/UnxPrx.LbUnfaSWWO', -- Admin123!
    'Admin', 
    'AGRIA', 
    '0235000000', 
    'AGRIA000001', 
    'admin', 
    TRUE
) ON DUPLICATE KEY UPDATE id=id;

-- Afficher les informations de création
SELECT 'Base de données créée avec succès!' as message;
SELECT 'Utilisateur admin créé: admin@agria-rouen.fr / Admin123!' as admin_info;
SELECT 'ATTENTION: Changez le mot de passe admin en production!' as warning;