-- Migration: Mise à jour/Création de la table weekly_menus pour AGRIA ROUEN
-- Sûr à exécuter plusieurs fois (CREATE TABLE IF NOT EXISTS)

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
    created_by INT NULL,
    updated_by INT NULL,
    metadata JSON,
    UNIQUE KEY unique_week_year (week_number, year),
    INDEX idx_week_year (week_number, year),
    INDEX idx_start_date (start_date),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Si une ancienne version utilise menu_data/is_active, ajoutez-les au besoin:
-- ALTER TABLE weekly_menus ADD COLUMN menu_data JSON NULL; -- optionnel
-- ALTER TABLE weekly_menus ADD COLUMN is_active BOOLEAN DEFAULT FALSE; -- optionnel

-- Remarque: Les clés étrangères vers users(id) sont omises pour compat mutualisé.