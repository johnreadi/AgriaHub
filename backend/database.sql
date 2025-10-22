-- Script de création de base de données pour AGRIA ROUEN
-- Compatible MySQL/MariaDB pour hébergement IONOS

-- Création de la base de données (si nécessaire)
-- CREATE DATABASE IF NOT EXISTS agria_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE agria_db;

-- Table des entreprises (doit être créée en premier car référencée par users)
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    registration_code VARCHAR(20) NOT NULL UNIQUE,
    address JSON,
    phone VARCHAR(20),
    email VARCHAR(100),
    website VARCHAR(255),
    industry VARCHAR(100),
    max_users INT DEFAULT 50,
    is_active BOOLEAN DEFAULT TRUE,
    logo_url VARCHAR(255),
    description TEXT,
    settings JSON,
    subscription_plan ENUM('free', 'basic', 'premium', 'enterprise') DEFAULT 'free',
    subscription_expires_at DATE,
    billing_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_registration_code (registration_code),
    INDEX idx_is_active (is_active),
    INDEX idx_subscription_plan (subscription_plan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    role ENUM('admin', 'moderator', 'employee', 'user') DEFAULT 'user',
    company_id INT,
    balance DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    password VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMP NULL,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP NULL,
    verification_token VARCHAR(255),
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    preferences JSON,
    card_number VARCHAR(20) UNIQUE,
    date_of_birth DATE,
    profile_data JSON,
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_card_number (card_number),
    INDEX idx_role (role),
    INDEX idx_company_id (company_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des activités
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE,
    content TEXT,
    excerpt TEXT,
    type ENUM('news', 'event', 'announcement', 'update', 'maintenance', 'promotion') DEFAULT 'news',
    status ENUM('draft', 'published', 'archived', 'scheduled') DEFAULT 'draft',
    author_id INT NOT NULL,
    company_id INT,
    featured_image VARCHAR(500),
    gallery JSON,
    tags JSON,
    metadata JSON,
    seo_data JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP NULL,
    scheduled_at TIMESTAMP NULL,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    shares_count INT DEFAULT 0,
    reading_time INT DEFAULT 0,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    expires_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_author_id (author_id),
    INDEX idx_company_id (company_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_slug (slug),
    INDEX idx_published_at (published_at),
    INDEX idx_is_featured (is_featured),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des éléments de menu
CREATE TABLE IF NOT EXISTS menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE,
    description TEXT,
    price DECIMAL(8,2) NOT NULL,
    cost_price DECIMAL(8,2),
    category ENUM('starter', 'main', 'dessert', 'drink', 'side') DEFAULT 'main',
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_vegetarian BOOLEAN DEFAULT FALSE,
    is_vegan BOOLEAN DEFAULT FALSE,
    allergens JSON,
    nutritional_info JSON,
    company_id INT,
    preparation_time INT DEFAULT 0,
    ingredients JSON,
    cooking_instructions JSON,
    storage_instructions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_available (is_available),
    INDEX idx_featured (is_featured),
    INDEX idx_company_id (company_id),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des menus quotidiens
CREATE TABLE IF NOT EXISTS daily_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    title VARCHAR(100),
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    metadata JSON,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_date (date),
    INDEX idx_date (date),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des menus hebdomadaires
CREATE TABLE IF NOT EXISTS weekly_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    week_number INT NOT NULL,
    year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    title VARCHAR(200),
    description TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    updated_by INT,
    metadata JSON,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_week_year (week_number, year),
    INDEX idx_week_year (week_number, year),
    INDEX idx_start_date (start_date),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des abonnés newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    is_subscribed BOOLEAN DEFAULT TRUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    source ENUM('website', 'app', 'manual', 'import', 'api') DEFAULT 'website',
    preferences JSON,
    tags JSON,
    custom_fields JSON,
    metadata JSON,
    INDEX idx_email (email),
    INDEX idx_is_subscribed (is_subscribed),
    INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des campagnes newsletter
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    plain_text_content TEXT,
    type ENUM('newsletter', 'promotional', 'announcement', 'welcome', 'reminder') DEFAULT 'newsletter',
    status ENUM('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed') DEFAULT 'draft',
    scheduled_at TIMESTAMP NULL,
    sent_at TIMESTAMP NULL,
    sent_count INT DEFAULT 0,
    created_by INT NOT NULL,
    approved_by INT,
    approved_at TIMESTAMP NULL,
    template_data JSON,
    tracking_settings JSON,
    delivery_settings JSON,
    analytics_data JSON,
    tags JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created_by (created_by),
    INDEX idx_status (status),
    INDEX idx_type (type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des interactions email (envois newsletter)
CREATE TABLE IF NOT EXISTS email_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subscriber_id INT NOT NULL,
    campaign_id INT NOT NULL,
    type ENUM('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained') NOT NULL,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    location TEXT,
    FOREIGN KEY (subscriber_id) REFERENCES newsletter_subscribers(id) ON DELETE CASCADE,
    FOREIGN KEY (campaign_id) REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
    INDEX idx_subscriber_id (subscriber_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_type (type),
    INDEX idx_occurred_at (occurred_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des conversations
CREATE TABLE IF NOT EXISTS conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    type ENUM('direct', 'group', 'channel', 'support', 'announcement') DEFAULT 'direct',
    description TEXT,
    is_private BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP NULL,
    created_by INT NOT NULL,
    company_id INT,
    last_message_id INT,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    participants_count INT DEFAULT 0,
    messages_count INT DEFAULT 0,
    metadata JSON,
    settings JSON,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    INDEX idx_created_by (created_by),
    INDEX idx_company_id (company_id),
    INDEX idx_type (type),
    INDEX idx_is_private (is_private),
    INDEX idx_last_activity_at (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des messages
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    type ENUM('text', 'image', 'file', 'system', 'notification') DEFAULT 'text',
    sender_id INT NOT NULL,
    conversation_id INT NOT NULL,
    parent_message_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    attachments JSON,
    reactions JSON,
    mentions JSON,
    metadata JSON,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_message_id) REFERENCES messages(id) ON DELETE CASCADE,
    INDEX idx_sender_id (sender_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_parent_message_id (parent_message_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des entreprises/compagnies
-- Table des informations de l'entreprise (pour compatibilité)
CREATE TABLE IF NOT EXISTS company_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    opening_hours TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content TEXT NOT NULL,
    author_id INT NOT NULL,
    activity_id INT NOT NULL,
    parent_comment_id INT,
    is_approved BOOLEAN DEFAULT TRUE,
    approved_by_id INT,
    approved_at TIMESTAMP NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMP NULL,
    metadata JSON,
    attachments JSON,
    reactions JSON,
    priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_author_id (author_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_parent_comment_id (parent_comment_id),
    INDEX idx_is_approved (is_approved),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des vues d'activités
CREATE TABLE IF NOT EXISTS activity_views (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    activity_id INT NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_duration INT DEFAULT 0,
    metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_activity (user_id, activity_id),
    INDEX idx_user_id (user_id),
    INDEX idx_activity_id (activity_id),
    INDEX idx_viewed_at (viewed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS conversation_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'admin', 'moderator', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL,
    is_muted BOOLEAN DEFAULT FALSE,
    last_read_message_id INT,
    last_activity_at TIMESTAMP NULL,
    permissions JSON,
    metadata JSON,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_read_message_id) REFERENCES messages(id) ON DELETE SET NULL,
    UNIQUE KEY unique_conversation_user (conversation_id, user_id),
    INDEX idx_conversation_id (conversation_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion des données par défaut

-- Insertion d'une entreprise par défaut
INSERT INTO companies (name, registration_code, address, phone, email, website, industry, description) VALUES 
('AGRIA ROUEN', 'AGRIA2024', '{"street": "123 Rue de la République", "city": "Rouen", "postal_code": "76000", "country": "France"}', '02.35.XX.XX.XX', 'contact@agria-rouen.fr', 'https://agria-rouen.fr', 'Restaurant', 'Restaurant universitaire moderne proposant une cuisine de qualité aux étudiants et personnels de Rouen.')
ON DUPLICATE KEY UPDATE name = name;

-- Utilisateur administrateur par défaut
INSERT INTO users (email, password, first_name, last_name, phone, card_number, role, company_id) VALUES 
('admin@agria-rouen.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'AGRIA', '02.35.XX.XX.XX', 'AG000001', 'admin', 1)
ON DUPLICATE KEY UPDATE email = email;

-- Informations de l'entreprise (pour compatibilité)
INSERT INTO company_info (name, address, phone, email, opening_hours, description) VALUES 
('AGRIA ROUEN', '123 Rue de la République, 76000 Rouen', '02.35.XX.XX.XX', 'contact@agria-rouen.fr', 
'Lundi - Vendredi: 11h30 - 14h30, 18h30 - 22h30\nSamedi - Dimanche: 18h30 - 22h30', 
'Restaurant universitaire moderne proposant une cuisine de qualité aux étudiants et personnels de Rouen.')
ON DUPLICATE KEY UPDATE name = name;

-- Exemples d'éléments de menu
INSERT INTO menu_items (name, slug, description, price, category, is_available, company_id) VALUES 
('Menu Étudiant', 'menu-etudiant', 'Plat + Dessert + Boisson', 4.50, 'main', TRUE, 1),
('Menu Complet', 'menu-complet', 'Entrée + Plat + Dessert + Boisson', 6.80, 'main', TRUE, 1),
('Salade César', 'salade-cesar', 'Salade verte, croûtons, parmesan, sauce césar', 5.20, 'starter', TRUE, 1),
('Pasta Bolognaise', 'pasta-bolognaise', 'Pâtes fraîches, sauce bolognaise maison', 4.80, 'main', TRUE, 1),
('Tiramisu', 'tiramisu', 'Dessert italien traditionnel', 3.20, 'dessert', TRUE, 1)
ON DUPLICATE KEY UPDATE name = name;

-- Optimisation des performances
OPTIMIZE TABLE users;
OPTIMIZE TABLE companies;
OPTIMIZE TABLE activities;
OPTIMIZE TABLE menu_items;
OPTIMIZE TABLE daily_menus;
OPTIMIZE TABLE weekly_menus;
OPTIMIZE TABLE newsletter_subscribers;
OPTIMIZE TABLE newsletter_campaigns;
OPTIMIZE TABLE email_interactions;
OPTIMIZE TABLE conversations;
OPTIMIZE TABLE messages;
OPTIMIZE TABLE conversation_participants;
OPTIMIZE TABLE comments;
OPTIMIZE TABLE activity_views;
OPTIMIZE TABLE company_info;

-- Ajout de la contrainte de clé étrangère pour last_message_id après création de toutes les tables
ALTER TABLE conversations ADD CONSTRAINT fk_conversations_last_message 
FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;