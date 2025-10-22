-- Schéma de la table `slides` pour le slider AGRIA (IONOS / MySQL)
-- À importer dans votre base MySQL avant le déploiement ou après si la table n'existe pas

CREATE TABLE IF NOT EXISTS `slides` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `subtitle` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `image_url` VARCHAR(512) NOT NULL,
  `button_text` VARCHAR(255) NULL,
  `button_url` VARCHAR(512) NULL,
  `background_color` VARCHAR(32) DEFAULT 'rgba(0,0,0,0.3)',
  `text_color` VARCHAR(32) DEFAULT '#ffffff',
  `order_index` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_slides_active` (`is_active`),
  INDEX `idx_slides_order` (`order_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Exemples d'insertion (à adapter selon vos besoins)
INSERT INTO `slides` (`title`, `description`, `image_url`, `background_color`, `text_color`, `order_index`, `is_active`) VALUES
('Bienvenue chez AGRIA ROUEN', 'Découvrez nos spécialités culinaires dans un cadre chaleureux', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2070&q=80', 'rgba(0,0,0,0.4)', '#ffffff', 1, 1),
('Cuisine Authentique', 'Des plats préparés avec passion et des ingrédients frais', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2070&q=80', 'rgba(0,154,88,0.3)', '#ffffff', 2, 1);