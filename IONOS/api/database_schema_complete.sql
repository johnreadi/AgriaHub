-- Script de création de la base de données complète pour AGRIA ROUEN
-- Inclut toutes les tables nécessaires pour l'administration et le fonctionnement

-- ========================================
-- TABLES UTILISATEURS ET SÉCURITÉ
-- ========================================

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

-- ========================================
-- TABLES PARAMÈTRES ET CONFIGURATION
-- ========================================

-- Table des paramètres généraux du restaurant
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    restaurant_name VARCHAR(255) NOT NULL DEFAULT 'AGRIA ROUEN',
    address TEXT NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    opening_hours TEXT NOT NULL,
    description TEXT NULL,
    website_url VARCHAR(255) NULL,
    facebook_url VARCHAR(255) NULL,
    instagram_url VARCHAR(255) NULL,
    twitter_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des paramètres d'apparence
CREATE TABLE IF NOT EXISTS appearance_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    logo TEXT NULL,
    background_type ENUM('color', 'image') DEFAULT 'color',
    background_value TEXT NULL,
    
    -- Header settings
    header_title_text VARCHAR(255) NULL,
    header_background_color VARCHAR(7) DEFAULT '#ffffff',
    header_title_color VARCHAR(7) DEFAULT '#000000',
    header_title_font_family VARCHAR(100) DEFAULT 'Arial',
    
    -- Menu settings
    menu_background_color VARCHAR(7) DEFAULT '#ffffff',
    menu_text_color VARCHAR(7) DEFAULT '#000000',
    menu_title_color VARCHAR(7) DEFAULT '#000000',
    menu_font_size VARCHAR(20) DEFAULT '16px',
    menu_font_family VARCHAR(100) DEFAULT 'Arial',
    
    -- Footer settings
    footer_logo TEXT NULL,
    footer_background_color VARCHAR(7) DEFAULT '#f8f9fa',
    footer_text_color VARCHAR(7) DEFAULT '#6c757d',
    footer_title_color VARCHAR(7) DEFAULT '#343a40',
    footer_font_family VARCHAR(100) DEFAULT 'Arial',
    footer_description_text TEXT NULL,
    footer_copyright_text VARCHAR(255) NULL,
    footer_show_links BOOLEAN DEFAULT TRUE,
    footer_show_social BOOLEAN DEFAULT TRUE,
    footer_show_newsletter BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des paramètres email
CREATE TABLE IF NOT EXISTS email_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    provider ENUM('smtp', 'sendgrid', 'mailgun', 'ses') DEFAULT 'smtp',
    from_name VARCHAR(255) NOT NULL DEFAULT 'AGRIA ROUEN',
    from_email VARCHAR(255) NOT NULL,
    
    -- SMTP settings
    smtp_host VARCHAR(255) NULL,
    smtp_port INT DEFAULT 587,
    smtp_user VARCHAR(255) NULL,
    smtp_pass VARCHAR(255) NULL,
    smtp_secure BOOLEAN DEFAULT TRUE,
    
    -- API settings (SendGrid, Mailgun, etc.)
    api_key VARCHAR(255) NULL,
    api_domain VARCHAR(255) NULL,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_test_at TIMESTAMP NULL,
    last_test_status ENUM('success', 'failed') NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ========================================
-- TABLES SLIDER ET CONTENU DYNAMIQUE
-- ========================================

-- Table des paramètres du slider
CREATE TABLE IF NOT EXISTS slider_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title_text VARCHAR(255) DEFAULT 'Nos Services',
    title_color VARCHAR(7) DEFAULT '#000000',
    title_font VARCHAR(100) DEFAULT 'Arial',
    title_size VARCHAR(20) DEFAULT '2rem',
    subtitle_text VARCHAR(255) DEFAULT 'Découvrez notre offre',
    subtitle_color VARCHAR(7) DEFAULT '#666666',
    subtitle_font VARCHAR(100) DEFAULT 'Arial',
    subtitle_size VARCHAR(20) DEFAULT '1rem',
    autoplay BOOLEAN DEFAULT TRUE,
    autoplay_delay INT DEFAULT 5000,
    show_navigation BOOLEAN DEFAULT TRUE,
    show_pagination BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des slides
CREATE TABLE IF NOT EXISTS slides (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('image', 'video', 'html') NOT NULL,
    source TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    title_color VARCHAR(7) DEFAULT '#ffffff',
    description_color VARCHAR(7) DEFAULT '#ffffff',
    title_font VARCHAR(100) DEFAULT 'Arial',
    overlay_color VARCHAR(9) DEFAULT '#00000080',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active)
);

-- ========================================
-- TABLES CONTENU RESTAURANT
-- ========================================

-- Table des sections de la page restaurant
CREATE TABLE IF NOT EXISTS restaurant_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('concept', 'values', 'image', 'video') NOT NULL,
    title VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_sort_order (sort_order),
    INDEX idx_is_active (is_active),
    INDEX idx_type (type)
);

-- Table des paragraphes pour les sections concept
CREATE TABLE IF NOT EXISTS concept_paragraphs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    text TEXT NOT NULL,
    image TEXT NULL,
    image_position ENUM('left', 'right') DEFAULT 'right',
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (section_id) REFERENCES restaurant_sections(id) ON DELETE CASCADE,
    INDEX idx_section_id (section_id),
    INDEX idx_sort_order (sort_order)
);

-- Table des cartes de valeurs
CREATE TABLE IF NOT EXISTS value_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    image TEXT NULL,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (section_id) REFERENCES restaurant_sections(id) ON DELETE CASCADE,
    INDEX idx_section_id (section_id),
    INDEX idx_sort_order (sort_order)
);

-- Table des médias pour les sections image/video
CREATE TABLE IF NOT EXISTS section_media (
    id INT AUTO_INCREMENT PRIMARY KEY,
    section_id INT NOT NULL,
    media_url TEXT NOT NULL,
    caption TEXT NULL,
    alt_text VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (section_id) REFERENCES restaurant_sections(id) ON DELETE CASCADE,
    INDEX idx_section_id (section_id)
);

-- ========================================
-- TABLES EXISTANTES (TRANSACTIONS, ETC.)
-- ========================================

-- Table des transactions
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

-- Table des sessions utilisateur
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

-- ========================================
-- DONNÉES INITIALES
-- ========================================

-- Insertion des paramètres par défaut
INSERT INTO settings (restaurant_name, address, phone, email, opening_hours, description) 
VALUES (
    'AGRIA ROUEN', 
    '123 Rue de la République, 76000 Rouen', 
    '02 35 00 00 00', 
    'contact@agria-rouen.fr',
    'Lundi-Vendredi: 11h30-14h00 et 18h30-21h30',
    'Restaurant d\'entreprise AGRIA ROUEN - Une cuisine de qualité pour tous'
) ON DUPLICATE KEY UPDATE id=id;

-- Insertion des paramètres d'apparence par défaut
INSERT INTO appearance_settings (
    header_title_text, 
    footer_description_text, 
    footer_copyright_text
) VALUES (
    'AGRIA ROUEN',
    'Restaurant d\'entreprise proposant une cuisine de qualité dans un cadre convivial.',
    '© 2024 AGRIA ROUEN. Tous droits réservés.'
) ON DUPLICATE KEY UPDATE id=id;

-- Insertion des paramètres email par défaut
INSERT INTO email_settings (from_name, from_email) 
VALUES ('AGRIA ROUEN', 'noreply@agria-rouen.fr') 
ON DUPLICATE KEY UPDATE id=id;

-- Insertion des paramètres slider par défaut
INSERT INTO slider_settings (title_text, subtitle_text) 
VALUES ('Nos Services', 'Découvrez notre offre de restauration') 
ON DUPLICATE KEY UPDATE id=id;

-- Insertion d'un utilisateur admin par défaut
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

-- ========================================
-- PROCÉDURES ET ÉVÉNEMENTS
-- ========================================

-- Procédure pour nettoyer les données expirées
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

-- Messages de confirmation
SELECT 'Base de données complète créée avec succès!' as message;
SELECT 'Utilisateur admin créé: admin@agria-rouen.fr / Admin123!' as admin_info;
SELECT 'ATTENTION: Changez le mot de passe admin en production!' as warning;