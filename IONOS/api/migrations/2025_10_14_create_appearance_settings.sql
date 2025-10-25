-- Migration: Création de la table appearance_settings pour AGRIA ROUEN
-- Sûr à exécuter plusieurs fois (CREATE TABLE IF NOT EXISTS)

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;