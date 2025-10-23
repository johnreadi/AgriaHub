/**
 * Configuration de base de données MySQL pour AgriaHub
 * Compatible avec Heroku Buildpacks et services externes
 */

import mysql from 'mysql2/promise';

// Configuration de la base de données
const dbConfig = {
  // Configuration par défaut (développement local)
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'agriahub',
  
  // Configuration pour les connexions en production
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false
  } : false,
  
  // Pool de connexions pour optimiser les performances
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT) || 60000,
  timeout: parseInt(process.env.DB_TIMEOUT) || 60000,
  
  // Reconnexion automatique
  reconnect: true,
  
  // Configuration du charset
  charset: 'utf8mb4'
};

// Configuration spéciale pour Heroku/services cloud
if (process.env.DATABASE_URL) {
  // Parse de l'URL de base de données (format: mysql://user:pass@host:port/db)
  const url = new URL(process.env.DATABASE_URL);
  
  dbConfig.host = url.hostname;
  dbConfig.port = url.port || 3306;
  dbConfig.user = url.username;
  dbConfig.password = url.password;
  dbConfig.database = url.pathname.slice(1); // Enlever le '/' initial
  
  // SSL requis pour la plupart des services cloud
  dbConfig.ssl = { rejectUnauthorized: false };
}

// Pool de connexions
let pool = null;

/**
 * Initialise le pool de connexions MySQL
 */
export async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    // Test de connexion
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL établie avec succès');
    
    // Création des tables si elles n'existent pas
    await createTables(connection);
    
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return false;
  }
}

/**
 * Crée les tables nécessaires pour AgriaHub
 */
async function createTables(connection) {
  const tables = [
    // Table des utilisateurs
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'farmer', 'viewer') DEFAULT 'farmer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    // Table des exploitations agricoles
    `CREATE TABLE IF NOT EXISTS farms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      owner_id INT NOT NULL,
      location VARCHAR(255),
      size_hectares DECIMAL(10,2),
      crop_types JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    // Table des cultures
    `CREATE TABLE IF NOT EXISTS crops (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farm_id INT NOT NULL,
      name VARCHAR(100) NOT NULL,
      variety VARCHAR(100),
      planting_date DATE,
      expected_harvest_date DATE,
      area_hectares DECIMAL(8,2),
      status ENUM('planned', 'planted', 'growing', 'harvested') DEFAULT 'planned',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    
    // Table des activités/tâches
    `CREATE TABLE IF NOT EXISTS activities (
      id INT AUTO_INCREMENT PRIMARY KEY,
      farm_id INT NOT NULL,
      crop_id INT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      activity_type ENUM('planting', 'watering', 'fertilizing', 'harvesting', 'maintenance', 'other') NOT NULL,
      scheduled_date DATE NOT NULL,
      completed_date DATE NULL,
      status ENUM('pending', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
      assigned_to INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
      FOREIGN KEY (crop_id) REFERENCES crops(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
  ];
  
  for (const tableSQL of tables) {
    try {
      await connection.execute(tableSQL);
      console.log('✅ Table créée/vérifiée avec succès');
    } catch (error) {
      console.error('❌ Erreur création table:', error.message);
    }
  }
}

/**
 * Exécute une requête SQL
 */
export async function executeQuery(sql, params = []) {
  if (!pool) {
    throw new Error('Base de données non initialisée');
  }
  
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur requête SQL:', error.message);
    throw error;
  }
}

/**
 * Ferme le pool de connexions
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('🔒 Connexions MySQL fermées');
  }
}

/**
 * Vérifie l'état de la connexion
 */
export async function checkDatabaseHealth() {
  try {
    if (!pool) return { status: 'disconnected', message: 'Pool non initialisé' };
    
    const [result] = await pool.execute('SELECT 1 as test');
    return { 
      status: 'connected', 
      message: 'Base de données accessible',
      config: {
        host: dbConfig.host,
        database: dbConfig.database,
        ssl: !!dbConfig.ssl
      }
    };
  } catch (error) {
    return { 
      status: 'error', 
      message: error.message 
    };
  }
}

export default {
  initializeDatabase,
  executeQuery,
  closeDatabase,
  checkDatabaseHealth
};