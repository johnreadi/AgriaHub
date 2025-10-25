-- Script SQL pour créer l'utilisateur administrateur (Compatible MySQL/MariaDB)
-- À exécuter après l'import de la base de données principale

-- Vérifier si l'utilisateur admin existe déjà (optionnel - pour information)
-- SELECT id FROM users WHERE email = 'admin@agria-rouen.fr';

-- Insérer l'utilisateur administrateur
-- Note: Le mot de passe haché correspond à 'admin123'
INSERT IGNORE INTO users (
    first_name, 
    last_name, 
    email, 
    password, 
    role, 
    is_active, 
    is_verified, 
    created_at, 
    updated_at
) VALUES (
    'Admin',
    'AGRIA',
    'admin@agria-rouen.fr',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Mot de passe: admin123
    'admin',
    1,
    1,
    NOW(),
    NOW()
);

-- Vérification de l'insertion
SELECT 'Utilisateur admin créé avec succès!' as message, 
       id, first_name, last_name, email, role 
FROM users 
WHERE email = 'admin@agria-rouen.fr';