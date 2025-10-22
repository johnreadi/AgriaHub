-- phpMyAdmin SQL Dump
-- version 4.9.11
-- https://www.phpmyadmin.net/
--
-- Hôte : db5018629781.hosting-data.io
-- Généré le : mar. 07 oct. 2025 à 15:35
-- Version du serveur : 8.0.36
-- Version de PHP : 7.4.33

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `dbs14768810`
--

DELIMITER $$
--
-- Procédures
--
CREATE DEFINER=`o14768810`@`%` PROCEDURE `CleanExpiredTokens` ()   BEGIN
    -- Supprimer les refresh tokens expirés
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    
    -- Supprimer les sessions expirées
    DELETE FROM user_sessions WHERE expires_at < NOW();
    
    -- Nettoyer les anciens logs de sécurité (garder 90 jours)
    DELETE FROM security_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Nettoyer les anciens rate limits (garder 24 heures)
    DELETE FROM rate_limits WHERE window_start < DATE_SUB(NOW(), INTERVAL 24 HOUR);
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `activities`
--

CREATE TABLE `activities` (
  `id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `excerpt` text COLLATE utf8mb4_unicode_ci,
  `type` enum('news','event','announcement','update','maintenance','promotion') COLLATE utf8mb4_unicode_ci DEFAULT 'news',
  `status` enum('draft','published','archived','scheduled') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `author_id` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `featured_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gallery` json DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `seo_data` json DEFAULT NULL,
  `is_featured` tinyint(1) DEFAULT '0',
  `is_pinned` tinyint(1) DEFAULT '0',
  `published_at` timestamp NULL DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `views_count` int DEFAULT '0',
  `likes_count` int DEFAULT '0',
  `comments_count` int DEFAULT '0',
  `shares_count` int DEFAULT '0',
  `reading_time` int DEFAULT '0',
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `activity_views`
--

CREATE TABLE `activity_views` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `viewed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `view_duration` int DEFAULT '0',
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `appearance_settings`
--

CREATE TABLE `appearance_settings` (
  `id` int NOT NULL,
  `logo` text COLLATE utf8mb4_general_ci,
  `background_type` enum('color','image') COLLATE utf8mb4_general_ci DEFAULT 'color',
  `background_value` text COLLATE utf8mb4_general_ci,
  `header_title_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `header_background_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `header_title_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#000000',
  `header_title_font_family` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Arial',
  `menu_background_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#ffffff',
  `menu_text_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#000000',
  `menu_title_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#000000',
  `menu_font_size` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '16px',
  `menu_font_family` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Arial',
  `footer_logo` text COLLATE utf8mb4_general_ci,
  `footer_background_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#f8f9fa',
  `footer_text_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#6c757d',
  `footer_title_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#343a40',
  `footer_font_family` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Arial',
  `footer_description_text` text COLLATE utf8mb4_general_ci,
  `footer_copyright_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `footer_show_links` tinyint(1) DEFAULT '1',
  `footer_show_social` tinyint(1) DEFAULT '1',
  `footer_show_newsletter` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `appearance_settings`
--

INSERT INTO `appearance_settings` (`id`, `logo`, `background_type`, `background_value`, `header_title_text`, `header_background_color`, `header_title_color`, `header_title_font_family`, `menu_background_color`, `menu_text_color`, `menu_title_color`, `menu_font_size`, `menu_font_family`, `footer_logo`, `footer_background_color`, `footer_text_color`, `footer_title_color`, `footer_font_family`, `footer_description_text`, `footer_copyright_text`, `footer_show_links`, `footer_show_social`, `footer_show_newsletter`, `created_at`) VALUES
(1, NULL, 'color', NULL, 'AGRIA ROUEN', '#ffffff', '#000000', 'Arial', '#ffffff', '#000000', '#000000', '16px', 'Arial', NULL, '#f8f9fa', '#6c757d', '#343a40', 'Arial', 'Restaurant d\'entreprise proposant une cuisine de qualité dans un cadre convivial.', '© 2024 AGRIA ROUEN. Tous droits réservés.', 1, 1, 1, '2025-10-05 02:23:45');

-- --------------------------------------------------------

--
-- Structure de la table `comments`
--

CREATE TABLE `comments` (
  `id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `author_id` int NOT NULL,
  `activity_id` int NOT NULL,
  `parent_comment_id` int DEFAULT NULL,
  `is_approved` tinyint(1) DEFAULT '1',
  `approved_by_id` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT '0',
  `edited_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `reactions` json DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `companies`
--

CREATE TABLE `companies` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `registration_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` json DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `industry` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_users` int DEFAULT '50',
  `is_active` tinyint(1) DEFAULT '1',
  `logo_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `settings` json DEFAULT NULL,
  `subscription_plan` enum('free','basic','premium','enterprise') COLLATE utf8mb4_unicode_ci DEFAULT 'free',
  `subscription_expires_at` date DEFAULT NULL,
  `billing_info` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `companies`
--

INSERT INTO `companies` (`id`, `name`, `registration_code`, `address`, `phone`, `email`, `website`, `industry`, `max_users`, `is_active`, `logo_url`, `description`, `settings`, `subscription_plan`, `subscription_expires_at`, `billing_info`, `created_at`) VALUES
(1, 'AGRIA ROUEN', 'AGRIA2024', '{\"city\": \"Rouen\", \"street\": \"123 Rue de la République\", \"country\": \"France\", \"postal_code\": \"76000\"}', '02.35.XX.XX.XX', 'contact@agria-rouen.fr', 'https://agria-rouen.fr', 'Restaurant', 50, 1, NULL, 'Restaurant universitaire moderne proposant une cuisine de qualité aux étudiants et personnels de Rouen.', NULL, 'free', NULL, NULL, '2025-10-03 12:49:49');

-- --------------------------------------------------------

--
-- Structure de la table `company_info`
--

CREATE TABLE `company_info` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `opening_hours` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `company_info`
--

INSERT INTO `company_info` (`id`, `name`, `address`, `phone`, `email`, `opening_hours`, `description`) VALUES
(1, 'AGRIA ROUEN', '123 Rue de la République, 76000 Rouen', '02.35.XX.XX.XX', 'contact@agria-rouen.fr', 'Lundi - Vendredi: 11h30 - 14h30, 18h30 - 22h30\nSamedi - Dimanche: 18h30 - 22h30', 'Restaurant universitaire moderne proposant une cuisine de qualité aux étudiants et personnels de Rouen.');

-- --------------------------------------------------------

--
-- Structure de la table `concept_paragraphs`
--

CREATE TABLE `concept_paragraphs` (
  `id` int NOT NULL,
  `section_id` int NOT NULL,
  `text` text COLLATE utf8mb4_general_ci NOT NULL,
  `image` text COLLATE utf8mb4_general_ci,
  `image_position` enum('left','right') COLLATE utf8mb4_general_ci DEFAULT 'right',
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `conversations`
--

CREATE TABLE `conversations` (
  `id` int NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('direct','group','channel','support','announcement') COLLATE utf8mb4_unicode_ci DEFAULT 'direct',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_private` tinyint(1) DEFAULT '1',
  `is_archived` tinyint(1) DEFAULT '0',
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_by` int NOT NULL,
  `company_id` int DEFAULT NULL,
  `last_message_id` int DEFAULT NULL,
  `last_activity_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `participants_count` int DEFAULT '0',
  `messages_count` int DEFAULT '0',
  `metadata` json DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `conversation_participants`
--

CREATE TABLE `conversation_participants` (
  `id` int NOT NULL,
  `conversation_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` enum('owner','admin','moderator','member') COLLATE utf8mb4_unicode_ci DEFAULT 'member',
  `joined_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `left_at` timestamp NULL DEFAULT NULL,
  `is_muted` tinyint(1) DEFAULT '0',
  `last_read_message_id` int DEFAULT NULL,
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `permissions` json DEFAULT NULL,
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `daily_menus`
--

CREATE TABLE `daily_menus` (
  `id` int NOT NULL,
  `date` date NOT NULL,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_published` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_by` int DEFAULT NULL,
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `email_interactions`
--

CREATE TABLE `email_interactions` (
  `id` int NOT NULL,
  `subscriber_id` int NOT NULL,
  `campaign_id` int NOT NULL,
  `type` enum('sent','delivered','opened','clicked','bounced','unsubscribed','complained') COLLATE utf8mb4_unicode_ci NOT NULL,
  `occurred_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `location` text COLLATE utf8mb4_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `email_settings`
--

CREATE TABLE `email_settings` (
  `id` int NOT NULL,
  `provider` enum('smtp','sendgrid','mailgun','ses') COLLATE utf8mb4_general_ci DEFAULT 'smtp',
  `from_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'AGRIA ROUEN',
  `from_email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `smtp_host` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `smtp_port` int DEFAULT '587',
  `smtp_user` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `smtp_pass` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `smtp_secure` tinyint(1) DEFAULT '1',
  `api_key` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `api_domain` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_test_at` timestamp NULL DEFAULT NULL,
  `last_test_status` enum('success','failed') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `email_settings`
--

INSERT INTO `email_settings` (`id`, `provider`, `from_name`, `from_email`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_secure`, `api_key`, `api_domain`, `is_active`, `last_test_at`, `last_test_status`, `created_at`) VALUES
(1, 'smtp', 'AGRIA ROUEN', 'noreply@agria-rouen.fr', NULL, 587, NULL, NULL, 1, NULL, NULL, 1, NULL, NULL, '2025-10-05 02:23:45');

-- --------------------------------------------------------

--
-- Structure de la table `menu_items`
--

CREATE TABLE `menu_items` (
  `id` int NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `price` decimal(8,2) NOT NULL,
  `cost_price` decimal(8,2) DEFAULT NULL,
  `category` enum('starter','main','dessert','drink','side') COLLATE utf8mb4_unicode_ci DEFAULT 'main',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_vegetarian` tinyint(1) DEFAULT '0',
  `is_vegan` tinyint(1) DEFAULT '0',
  `allergens` json DEFAULT NULL,
  `nutritional_info` json DEFAULT NULL,
  `company_id` int DEFAULT NULL,
  `preparation_time` int DEFAULT '0',
  `ingredients` json DEFAULT NULL,
  `cooking_instructions` json DEFAULT NULL,
  `storage_instructions` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `menu_items`
--

INSERT INTO `menu_items` (`id`, `name`, `slug`, `description`, `price`, `cost_price`, `category`, `image_url`, `is_available`, `is_featured`, `is_vegetarian`, `is_vegan`, `allergens`, `nutritional_info`, `company_id`, `preparation_time`, `ingredients`, `cooking_instructions`, `storage_instructions`, `created_at`) VALUES
(1, 'Menu Étudiant', 'menu-etudiant', 'Plat + Dessert + Boisson', '4.50', NULL, 'main', NULL, 1, 0, 0, 0, NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-10-03 12:49:49'),
(2, 'Menu Complet', 'menu-complet', 'Entrée + Plat + Dessert + Boisson', '6.80', NULL, 'main', NULL, 1, 0, 0, 0, NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-10-03 12:49:49'),
(3, 'Salade César', 'salade-cesar', 'Salade verte, croûtons, parmesan, sauce césar', '5.20', NULL, 'starter', NULL, 1, 0, 0, 0, NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-10-03 12:49:49'),
(4, 'Pasta Bolognaise', 'pasta-bolognaise', 'Pâtes fraîches, sauce bolognaise maison', '4.80', NULL, 'main', NULL, 1, 0, 0, 0, NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-10-03 12:49:49'),
(5, 'Tiramisu', 'tiramisu', 'Dessert italien traditionnel', '3.20', NULL, 'dessert', NULL, 1, 0, 0, 0, NULL, NULL, 1, 0, NULL, NULL, NULL, '2025-10-03 12:49:49');

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

CREATE TABLE `messages` (
  `id` int NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('text','image','file','system','notification') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `sender_id` int NOT NULL,
  `conversation_id` int NOT NULL,
  `parent_message_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `is_edited` tinyint(1) DEFAULT '0',
  `edited_at` timestamp NULL DEFAULT NULL,
  `attachments` json DEFAULT NULL,
  `reactions` json DEFAULT NULL,
  `mentions` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `newsletter_campaigns`
--

CREATE TABLE `newsletter_campaigns` (
  `id` int NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `plain_text_content` text COLLATE utf8mb4_unicode_ci,
  `type` enum('newsletter','promotional','announcement','welcome','reminder') COLLATE utf8mb4_unicode_ci DEFAULT 'newsletter',
  `status` enum('draft','scheduled','sending','sent','cancelled','failed') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `sent_count` int DEFAULT '0',
  `created_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `template_data` json DEFAULT NULL,
  `tracking_settings` json DEFAULT NULL,
  `delivery_settings` json DEFAULT NULL,
  `analytics_data` json DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` int NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_subscribed` tinyint(1) DEFAULT '1',
  `subscribed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `unsubscribed_at` timestamp NULL DEFAULT NULL,
  `source` enum('website','app','manual','import','api') COLLATE utf8mb4_unicode_ci DEFAULT 'website',
  `preferences` json DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `custom_fields` json DEFAULT NULL,
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `rate_limits`
--

CREATE TABLE `rate_limits` (
  `id` int NOT NULL,
  `identifier` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `requests_count` int DEFAULT '1',
  `window_start` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `token` text COLLATE utf8mb4_general_ci NOT NULL,
  `expires_at` timestamp NOT NULL,
  `revoked` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `restaurant_sections`
--

CREATE TABLE `restaurant_sections` (
  `id` int NOT NULL,
  `type` enum('concept','values','image','video') COLLATE utf8mb4_general_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `sort_order` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `section_media`
--

CREATE TABLE `section_media` (
  `id` int NOT NULL,
  `section_id` int NOT NULL,
  `media_url` text COLLATE utf8mb4_general_ci NOT NULL,
  `caption` text COLLATE utf8mb4_general_ci,
  `alt_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `security_logs`
--

CREATE TABLE `security_logs` (
  `id` int NOT NULL,
  `event_type` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `settings`
--

CREATE TABLE `settings` (
  `id` int NOT NULL,
  `restaurant_name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'AGRIA ROUEN',
  `address` text COLLATE utf8mb4_general_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `opening_hours` text COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `website_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `facebook_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `instagram_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `twitter_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `settings`
--

INSERT INTO `settings` (`id`, `restaurant_name`, `address`, `phone`, `email`, `opening_hours`, `description`, `website_url`, `facebook_url`, `instagram_url`, `twitter_url`, `created_at`) VALUES
(1, 'AGRIA ROUEN', '123 Rue de la République, 76000 Rouen', '02 35 00 00 00', 'contact@agria-rouen.fr', 'Lundi-Vendredi: 11h30-14h00 et 18h30-21h30', 'Restaurant d\'entreprise AGRIA ROUEN - Une cuisine de qualité pour tous', NULL, NULL, NULL, NULL, '2025-10-05 02:23:45');

-- --------------------------------------------------------

--
-- Structure de la table `slider_settings`
--

CREATE TABLE `slider_settings` (
  `id` int NOT NULL,
  `title_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'Nos Services',
  `title_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#000000',
  `title_font` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Arial',
  `title_size` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '2rem',
  `subtitle_text` varchar(255) COLLATE utf8mb4_general_ci DEFAULT 'Découvrez notre offre',
  `subtitle_color` varchar(7) COLLATE utf8mb4_general_ci DEFAULT '#666666',
  `subtitle_font` varchar(100) COLLATE utf8mb4_general_ci DEFAULT 'Arial',
  `subtitle_size` varchar(20) COLLATE utf8mb4_general_ci DEFAULT '1rem',
  `autoplay` tinyint(1) DEFAULT '1',
  `autoplay_delay` int DEFAULT '5000',
  `show_navigation` tinyint(1) DEFAULT '1',
  `show_pagination` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `slider_settings`
--

INSERT INTO `slider_settings` (`id`, `title_text`, `title_color`, `title_font`, `title_size`, `subtitle_text`, `subtitle_color`, `subtitle_font`, `subtitle_size`, `autoplay`, `autoplay_delay`, `show_navigation`, `show_pagination`, `created_at`) VALUES
(1, 'Nos Services', '#000000', 'Arial', '2rem', 'Découvrez notre offre de restauration', '#666666', 'Arial', '1rem', 1, 5000, 1, 1, '2025-10-05 02:23:45');

-- --------------------------------------------------------

--
-- Structure de la table `slides`
--

CREATE TABLE `slides` (
  `id` int UNSIGNED NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(512) COLLATE utf8mb4_unicode_ci NOT NULL,
  `button_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `button_url` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `background_color` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT 'rgba(0,0,0,0.3)',
  `text_color` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT '#ffffff',
  `order_index` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `slides`
--

INSERT INTO `slides` (`id`, `title`, `subtitle`, `description`, `image_url`, `button_text`, `button_url`, `background_color`, `text_color`, `order_index`, `is_active`, `created_at`) VALUES
(1, 'Bienvenue chez AGRIA ROUEN', NULL, 'Découvrez nos spécialités culinaires dans un cadre chaleureux', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2070&q=80', NULL, NULL, 'rgba(0,0,0,0.4)', '#ffffff', 1, 1, '2025-10-05 04:23:19'),
(2, 'Cuisine Authentique', NULL, 'Des plats préparés avec passion et des ingrédients frais', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2070&q=80', NULL, NULL, 'rgba(0,154,88,0.3)', '#ffffff', 2, 1, '2025-10-05 04:23:19');

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `type` enum('credit','debit','refund') COLLATE utf8mb4_general_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `reference` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending','completed','failed','cancelled') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `first_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','moderator','employee','user') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `company_id` int DEFAULT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `is_verified` tinyint(1) DEFAULT '0',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `verification_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `failed_login_attempts` int DEFAULT '0',
  `locked_until` timestamp NULL DEFAULT NULL,
  `preferences` json DEFAULT NULL,
  `card_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `profile_data` json DEFAULT NULL,
  `bio` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_failed_login` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `username`, `email`, `phone`, `role`, `company_id`, `balance`, `is_active`, `is_verified`, `password`, `last_login_at`, `password_reset_token`, `password_reset_expires`, `verification_token`, `failed_login_attempts`, `locked_until`, `preferences`, `card_number`, `date_of_birth`, `profile_data`, `bio`, `created_at`, `last_failed_login`, `last_login`, `active`) VALUES
(4, 'jean', 'NJIKAM', 'readi', 'readi@readi.fr', NULL, 'admin', NULL, '0.00', 1, 0, '$2y$10$PwpJ.JauU3y7EVpBt2bdiuO9CGLevDEVqqkl0OoWeo3xAYml5CrMy', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-03 13:46:22', NULL, NULL, 1),
(5, 'Fancy', 'Coffee', NULL, 'admin@readi.fr', NULL, 'admin', NULL, '0.00', 1, 0, '$2y$10$msEPqEVaz9VRLXh8Iv4vsezP2vB2oh9LGSkEeLU9RBYyL9su6n5q.', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-03 14:20:00', NULL, NULL, 1),
(6, 'jean', 'NJIKAM', NULL, 'test@exemple.fr', NULL, 'admin', NULL, '0.00', 1, 0, '$2y$10$kBHvg5vjdd2Pj8aSmQuZzejzE/VJRbNAj5OKGsMyBFiUMHvYlrNsa', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-03 15:05:25', NULL, NULL, 1),
(7, 'jean', 'NJIKAM', NULL, 'admin@test.fr', NULL, 'admin', NULL, '0.00', 1, 0, '$2y$10$VMKKF8.kR.kBQDOCLz4Q2uIvoazmFzEi3Tav6MV5U261Nlw7pQeha', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-03 15:25:02', NULL, NULL, 1),
(8, 'Agria', 'Rouen', 'agria', 'admin@agria-rouen.fr', NULL, 'admin', NULL, '0.00', 1, 1, '$2y$10$J7gTmp5GK6wg9OtX1C/Ta.y/Ldfcp/giMd/W2nyzNTKYs6gkRqppe', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-04 21:16:08', NULL, NULL, 1),
(11, 'Test', 'User', NULL, 'test@agria-rouen.fr', '0123456789', 'user', NULL, '0.00', 1, 0, '$2y$10$gEkcL7D3Hyg/YVvYYFpw5Opw2c/6PyQa0B0yfAG2y0CWK.FU006RC', NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, '2025-10-07 02:52:00', NULL, '2025-10-07 15:02:57', 1);

-- --------------------------------------------------------

--
-- Structure de la table `user_sessions`
--

CREATE TABLE `user_sessions` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `session_token` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `user_agent` text COLLATE utf8mb4_general_ci,
  `expires_at` timestamp NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `value_cards`
--

CREATE TABLE `value_cards` (
  `id` int NOT NULL,
  `section_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci NOT NULL,
  `image` text COLLATE utf8mb4_general_ci,
  `sort_order` int DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `weekly_menus`
--

CREATE TABLE `weekly_menus` (
  `id` int NOT NULL,
  `week_number` int NOT NULL,
  `year` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_published` tinyint(1) DEFAULT '0',
  `is_archived` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  `updated_by` int DEFAULT NULL,
  `metadata` json DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `activities`
--
ALTER TABLE `activities`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_author_id` (`author_id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_slug` (`slug`),
  ADD KEY `idx_published_at` (`published_at`),
  ADD KEY `idx_is_featured` (`is_featured`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `activity_views`
--
ALTER TABLE `activity_views`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_activity` (`user_id`,`activity_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_activity_id` (`activity_id`),
  ADD KEY `idx_viewed_at` (`viewed_at`);

--
-- Index pour la table `appearance_settings`
--
ALTER TABLE `appearance_settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approved_by_id` (`approved_by_id`),
  ADD KEY `idx_author_id` (`author_id`),
  ADD KEY `idx_activity_id` (`activity_id`),
  ADD KEY `idx_parent_comment_id` (`parent_comment_id`),
  ADD KEY `idx_is_approved` (`is_approved`),
  ADD KEY `idx_priority` (`priority`);

--
-- Index pour la table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD UNIQUE KEY `registration_code` (`registration_code`),
  ADD KEY `idx_registration_code` (`registration_code`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_subscription_plan` (`subscription_plan`);

--
-- Index pour la table `company_info`
--
ALTER TABLE `company_info`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `concept_paragraphs`
--
ALTER TABLE `concept_paragraphs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_sort_order` (`sort_order`);

--
-- Index pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_private` (`is_private`),
  ADD KEY `idx_last_activity_at` (`last_activity_at`),
  ADD KEY `fk_conversations_last_message` (`last_message_id`);

--
-- Index pour la table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_conversation_user` (`conversation_id`,`user_id`),
  ADD KEY `last_read_message_id` (`last_read_message_id`),
  ADD KEY `idx_conversation_id` (`conversation_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_role` (`role`);

--
-- Index pour la table `daily_menus`
--
ALTER TABLE `daily_menus`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_date` (`date`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_date` (`date`),
  ADD KEY `idx_is_published` (`is_published`);

--
-- Index pour la table `email_interactions`
--
ALTER TABLE `email_interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_subscriber_id` (`subscriber_id`),
  ADD KEY `idx_campaign_id` (`campaign_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_occurred_at` (`occurred_at`);

--
-- Index pour la table `email_settings`
--
ALTER TABLE `email_settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `menu_items`
--
ALTER TABLE `menu_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_category` (`category`),
  ADD KEY `idx_available` (`is_available`),
  ADD KEY `idx_featured` (`is_featured`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_slug` (`slug`);

--
-- Index pour la table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_conversation_id` (`conversation_id`),
  ADD KEY `idx_parent_message_id` (`parent_message_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_priority` (`priority`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `newsletter_campaigns`
--
ALTER TABLE `newsletter_campaigns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_is_subscribed` (`is_subscribed`),
  ADD KEY `idx_source` (`source`);

--
-- Index pour la table `rate_limits`
--
ALTER TABLE `rate_limits`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_identifier` (`identifier`),
  ADD KEY `idx_window_start` (`window_start`);

--
-- Index pour la table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_revoked` (`revoked`);

--
-- Index pour la table `restaurant_sections`
--
ALTER TABLE `restaurant_sections`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sort_order` (`sort_order`),
  ADD KEY `idx_is_active` (`is_active`),
  ADD KEY `idx_type` (`type`);

--
-- Index pour la table `section_media`
--
ALTER TABLE `section_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_section_id` (`section_id`);

--
-- Index pour la table `security_logs`
--
ALTER TABLE `security_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_event_type` (`event_type`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_ip_address` (`ip_address`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `slider_settings`
--
ALTER TABLE `slider_settings`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `slides`
--
ALTER TABLE `slides`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_slides_active` (`is_active`),
  ADD KEY `idx_slides_order` (`order_index`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_type` (`type`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `card_number` (`card_number`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_card_number` (`card_number`),
  ADD KEY `idx_role` (`role`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Index pour la table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_session_token` (`session_token`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_expires_at` (`expires_at`),
  ADD KEY `idx_active` (`active`);

--
-- Index pour la table `value_cards`
--
ALTER TABLE `value_cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_section_id` (`section_id`),
  ADD KEY `idx_sort_order` (`sort_order`);

--
-- Index pour la table `weekly_menus`
--
ALTER TABLE `weekly_menus`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_week_year` (`week_number`,`year`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `idx_week_year` (`week_number`,`year`),
  ADD KEY `idx_start_date` (`start_date`),
  ADD KEY `idx_is_published` (`is_published`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `activities`
--
ALTER TABLE `activities`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `activity_views`
--
ALTER TABLE `activity_views`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `appearance_settings`
--
ALTER TABLE `appearance_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `company_info`
--
ALTER TABLE `company_info`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `concept_paragraphs`
--
ALTER TABLE `concept_paragraphs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `conversations`
--
ALTER TABLE `conversations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `daily_menus`
--
ALTER TABLE `daily_menus`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `email_interactions`
--
ALTER TABLE `email_interactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `email_settings`
--
ALTER TABLE `email_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `menu_items`
--
ALTER TABLE `menu_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `messages`
--
ALTER TABLE `messages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `newsletter_campaigns`
--
ALTER TABLE `newsletter_campaigns`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `rate_limits`
--
ALTER TABLE `rate_limits`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `restaurant_sections`
--
ALTER TABLE `restaurant_sections`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `section_media`
--
ALTER TABLE `section_media`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `security_logs`
--
ALTER TABLE `security_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `slider_settings`
--
ALTER TABLE `slider_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `slides`
--
ALTER TABLE `slides`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `user_sessions`
--
ALTER TABLE `user_sessions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `value_cards`
--
ALTER TABLE `value_cards`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `weekly_menus`
--
ALTER TABLE `weekly_menus`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activities`
--
ALTER TABLE `activities`
  ADD CONSTRAINT `activities_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activities_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `activity_views`
--
ALTER TABLE `activity_views`
  ADD CONSTRAINT `activity_views_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_views_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_3` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comments_ibfk_4` FOREIGN KEY (`approved_by_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `concept_paragraphs`
--
ALTER TABLE `concept_paragraphs`
  ADD CONSTRAINT `concept_paragraphs_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `restaurant_sections` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `conversations`
--
ALTER TABLE `conversations`
  ADD CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_conversations_last_message` FOREIGN KEY (`last_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `conversation_participants`
--
ALTER TABLE `conversation_participants`
  ADD CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `conversation_participants_ibfk_3` FOREIGN KEY (`last_read_message_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `daily_menus`
--
ALTER TABLE `daily_menus`
  ADD CONSTRAINT `daily_menus_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `daily_menus_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `email_interactions`
--
ALTER TABLE `email_interactions`
  ADD CONSTRAINT `email_interactions_ibfk_1` FOREIGN KEY (`subscriber_id`) REFERENCES `newsletter_subscribers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `email_interactions_ibfk_2` FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `menu_items`
--
ALTER TABLE `menu_items`
  ADD CONSTRAINT `menu_items_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`parent_message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `newsletter_campaigns`
--
ALTER TABLE `newsletter_campaigns`
  ADD CONSTRAINT `newsletter_campaigns_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `newsletter_campaigns_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `section_media`
--
ALTER TABLE `section_media`
  ADD CONSTRAINT `section_media_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `restaurant_sections` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `security_logs`
--
ALTER TABLE `security_logs`
  ADD CONSTRAINT `security_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `user_sessions`
--
ALTER TABLE `user_sessions`
  ADD CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `value_cards`
--
ALTER TABLE `value_cards`
  ADD CONSTRAINT `value_cards_ibfk_1` FOREIGN KEY (`section_id`) REFERENCES `restaurant_sections` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `weekly_menus`
--
ALTER TABLE `weekly_menus`
  ADD CONSTRAINT `weekly_menus_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `weekly_menus_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

DELIMITER $$
--
-- Évènements
--
CREATE DEFINER=`o14768810`@`%` EVENT `cleanup_expired_data` ON SCHEDULE EVERY 1 DAY STARTS '2025-10-01 02:33:25' ON COMPLETION NOT PRESERVE ENABLE DO CALL CleanExpiredTokens()$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
