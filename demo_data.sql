-- Script de données de démonstration pour AGRIA ROUEN
-- Ce script insère des données de test pour le restaurant

-- Données utilisateur admin
INSERT INTO users (email, password, role, created_at) VALUES 
('admin@agriarouen.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW()),
('manager@agriarouen.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', NOW());

-- Données de menu
INSERT INTO menu (name, description, price, category, image_url, is_available, created_at) VALUES 
('Menu du Jour', 'Entrée + Plat + Dessert', 15.50, 'menu_jour', 'images/menu_jour.jpg', 1, NOW()),
('Menu Enfant', 'Mini burger + frites + dessert', 8.90, 'menu_enfant', 'images/menu_enfant.jpg', 1, NOW()),
('Menu Végétarien', 'Salade composée + quiche + dessert', 12.50, 'menu_vegetarien', 'images/menu_vegetarien.jpg', 1, NOW()),
('Formule Express', 'Sandwich + boisson + dessert', 9.90, 'formule', 'images/formule_express.jpg', 1, NOW()),
('Salade César', 'Poulet, laitue, parmesan, croûtons', 11.50, 'salade', 'images/salade_cesar.jpg', 1, NOW()),
('Quiche Lorraine', 'Quiche maison servie avec salade', 8.50, 'plat', 'images/quiche_lorraine.jpg', 1, NOW()),
('Burger Maison', 'Steak haché, tomates, salade, sauce spéciale', 12.90, 'burger', 'images/burger_maison.jpg', 1, NOW()),
('Tarte aux Pommes', 'Tarte maison servie avec crème', 4.50, 'dessert', 'images/tarte_pommes.jpg', 1, NOW()),
('Crème Brûlée', 'Dessert traditionnel', 5.50, 'dessert', 'images/creme_brulee.jpg', 1, NOW()),
('Café Gourmand', 'Café avec mini-desserts', 6.50, 'dessert', 'images/cafe_gourmand.jpg', 1, NOW());

-- Données de menu hebdomadaire
INSERT INTO weekly_menus (week_number, year, day_of_week, menu_items, is_active, created_at) VALUES 
(43, 2025, 'lundi', 'Salade César, Quiche Lorraine, Tarte aux Pommes', 1, NOW()),
(43, 2025, 'mardi', 'Soupe du jour, Burger Maison, Crème Brûlée', 1, NOW()),
(43, 2025, 'mercredi', 'Assiette de crudités, Poisson du jour, Café Gourmand', 1, NOW()),
(43, 2025, 'jeudi', 'Terrine maison, Steak frites, Tarte Tatin', 1, NOW()),
(43, 2025, 'vendredi', 'Cocktail de crevettes, Pavé de saumon, Mousse au chocolat', 1, NOW()),
(44, 2025, 'lundi', 'Taboulé, Poulet rôti, Salade de fruits', 1, NOW()),
(44, 2025, 'mardi', 'Carottes rapées, Lasagne, Glace vanille', 1, NOW()),
(44, 2025, 'mercredi', 'Betteraves, Curry de légumes, Fromage blanc', 1, NOW());

-- Données de slides pour le carousel
INSERT INTO slides (title, description, image_url, link_url, position, is_active, created_at) VALUES 
('Bienvenue chez AGRIA', 'Restaurant traditionnel à Rouen', 'images/slide1.jpg', '#', 1, 1, NOW()),
('Menu du Jour', 'Découvrez notre menu du jour à 15.50€', 'images/slide2.jpg', '#menu', 2, 1, NOW()),
('Menu Enfant', 'Spécial enfants à 8.90€', 'images/slide3.jpg', '#menu-enfant', 3, 1, NOW()),
('Réservation', 'Réservez votre table en ligne', 'images/slide4.jpg', '#reservation', 4, 1, NOW()),
('Événements', 'Organisez vos événements d\'entreprise', 'images/slide5.jpg', '#evenements', 5, 1, NOW());

-- Données d'actualités
INSERT INTO news (title, content, image_url, is_active, created_at) VALUES 
('Nouveau Menu Automne', 'Découvrez notre nouveau menu automne avec des produits locaux et de saison. Des plats chauds et réconfortants vous attendent!', 'images/news_automne.jpg', 1, NOW()),
('Ouverture du Samedi', 'Nous sommes maintenant ouverts le samedi midi! Venez profiter de nos formules express pour votre pause déjeuner du week-end.', 'images/news_samedi.jpg', 1, NOW()),
('Partenariat Local', 'Nouveau partenariat avec les producteurs locaux de Normandie pour vous offrir les meilleurs produits frais.', 'images/news_partenariat.jpg', 1, NOW()),
('Service Traiteur', 'Nous proposons maintenant un service traiteur pour vos événements professionnels et privés.', 'images/news_traiteur.jpg', 1, NOW());

-- Données d'informations pratiques
INSERT INTO infos (title, content, icon, is_active, created_at) VALUES 
('Horaires', 'Lundi au Vendredi: 11h30 - 14h30\nSamedi: 11h30 - 14h30\nFermé Dimanche et jours fériés', 'clock', 1, NOW()),
('Adresse', '123 Rue de la République\n76000 ROUEN\nÀ côté de la mairie', 'map-marker', 1, NOW()),
('Contact', 'Téléphone: 02 35 XX XX XX\nEmail: contact@agriarouen.fr\nRéservation en ligne disponible', 'phone', 1, NOW()),
('Parking', 'Parking gratuit à proximité\nStationnement facile\nAccès handicapé', 'parking', 1, NOW()),
('Groupes', 'Accueil groupes sur réservation\nMenu groupe à partir de 10 personnes\nSalle privative disponible', 'users', 1, NOW());

-- Données de réservation (exemples)
INSERT INTO reservations (name, email, phone, date, time, guests, message, status, created_at) VALUES 
('Dupont Jean', 'jean.dupont@email.com', '06 12 34 56 78', '2025-10-25', '12:30', 4, 'Anniversaire d\'anniversaire', 'confirmed', NOW()),
('Martin Sophie', 'sophie.martin@email.com', '06 98 76 54 32', '2025-10-26', '13:00', 2, 'Déjeuner d\'affaires', 'pending', NOW()),
('Bernard Pierre', 'pierre.bernard@email.com', '02 35 12 34 56', '2025-10-27', '12:00', 8, 'Repas d\'équipe', 'confirmed', NOW());

-- Données de contact (messages reçus)
INSERT INTO contacts (name, email, subject, message, status, created_at) VALUES 
('Marie Lefèvre', 'marie.lefevre@email.com', 'Demande d\'information', 'Bonjour, pouvez-vous me dire si vous proposez des menus sans gluten? Merci!', 'new', NOW()),
('Robert Dubois', 'robert.dubois@email.com', 'Réservation groupe', 'Bonjour, nous souhaiterions réserver pour un groupe de 15 personnes le 15 novembre. Est-ce possible?', 'new', NOW()),
('Julie Petit', 'julie.petit@email.com', 'Question menu', 'Bonjour, vos menus changent-ils chaque jour? Cordialement', 'answered', NOW());