<?php

class CacheManager {
    private $adapter;
    private $prefix;
    private $defaultTTL = 3600; // 1 heure par défaut
    
    public function __construct($config = []) {
        $this->prefix = $config['prefix'] ?? 'agria_';
        $this->defaultTTL = $config['default_ttl'] ?? 3600;
        
        // Déterminer l'adaptateur de cache à utiliser
        if (isset($config['adapter'])) {
            $this->adapter = $this->createAdapter($config['adapter'], $config);
        } else {
            $this->adapter = $this->autoDetectAdapter($config);
        }
    }
    
    /**
     * Créer l'adaptateur de cache spécifié
     */
    private function createAdapter($type, $config) {
        switch (strtolower($type)) {
            case 'redis':
                return new RedisAdapter($config);
            case 'memcached':
                return new MemcachedAdapter($config);
            case 'file':
                return new FileAdapter($config);
            case 'memory':
                return new MemoryAdapter($config);
            default:
                throw new Exception("Adaptateur de cache non supporté: {$type}");
        }
    }
    
    /**
     * Détecter automatiquement le meilleur adaptateur disponible
     */
    private function autoDetectAdapter($config) {
        // Priorité: Redis > Memcached > File > Memory
        if (extension_loaded('redis')) {
            try {
                return new RedisAdapter($config);
            } catch (Exception $e) {
                logError('Redis non disponible, tentative Memcached', ['error' => $e->getMessage()]);
            }
        }
        
        if (extension_loaded('memcached')) {
            try {
                return new MemcachedAdapter($config);
            } catch (Exception $e) {
                logError('Memcached non disponible, utilisation du cache fichier', ['error' => $e->getMessage()]);
            }
        }
        
        // Fallback vers le cache fichier
        return new FileAdapter($config);
    }
    
    /**
     * Récupérer une valeur du cache
     */
    public function get($key, $default = null) {
        try {
            $fullKey = $this->prefix . $key;
            $value = $this->adapter->get($fullKey);
            
            if ($value === false || $value === null) {
                return $default;
            }
            
            // Désérialiser si nécessaire
            if (is_string($value) && $this->isSerialized($value)) {
                $value = unserialize($value);
            }
            
            return $value;
        } catch (Exception $e) {
            logError('Erreur lors de la récupération du cache', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return $default;
        }
    }
    
    /**
     * Stocker une valeur dans le cache
     */
    public function set($key, $value, $ttl = null) {
        try {
            $fullKey = $this->prefix . $key;
            $ttl = $ttl ?? $this->defaultTTL;
            
            // Sérialiser les objets et tableaux
            if (is_array($value) || is_object($value)) {
                $value = serialize($value);
            }
            
            return $this->adapter->set($fullKey, $value, $ttl);
        } catch (Exception $e) {
            logError('Erreur lors de la mise en cache', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Supprimer une clé du cache
     */
    public function delete($key) {
        try {
            $fullKey = $this->prefix . $key;
            return $this->adapter->delete($fullKey);
        } catch (Exception $e) {
            logError('Erreur lors de la suppression du cache', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Vider tout le cache
     */
    public function flush() {
        try {
            return $this->adapter->flush();
        } catch (Exception $e) {
            logError('Erreur lors du vidage du cache', ['error' => $e->getMessage()]);
            return false;
        }
    }
    
    /**
     * Récupérer ou définir une valeur (pattern cache-aside)
     */
    public function remember($key, $callback, $ttl = null) {
        $value = $this->get($key);
        
        if ($value !== null) {
            return $value;
        }
        
        // Exécuter le callback pour obtenir la valeur
        $value = $callback();
        
        // Mettre en cache le résultat
        $this->set($key, $value, $ttl);
        
        return $value;
    }
    
    /**
     * Incrémenter une valeur numérique
     */
    public function increment($key, $value = 1) {
        try {
            $fullKey = $this->prefix . $key;
            return $this->adapter->increment($fullKey, $value);
        } catch (Exception $e) {
            logError('Erreur lors de l\'incrémentation', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Décrémenter une valeur numérique
     */
    public function decrement($key, $value = 1) {
        try {
            $fullKey = $this->prefix . $key;
            return $this->adapter->decrement($fullKey, $value);
        } catch (Exception $e) {
            logError('Erreur lors de la décrémentation', [
                'key' => $key,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Récupérer plusieurs clés à la fois
     */
    public function getMultiple($keys) {
        try {
            $fullKeys = array_map(function($key) {
                return $this->prefix . $key;
            }, $keys);
            
            $results = $this->adapter->getMultiple($fullKeys);
            
            // Reconvertir les clés et désérialiser
            $output = [];
            foreach ($keys as $i => $originalKey) {
                $fullKey = $fullKeys[$i];
                if (isset($results[$fullKey])) {
                    $value = $results[$fullKey];
                    if (is_string($value) && $this->isSerialized($value)) {
                        $value = unserialize($value);
                    }
                    $output[$originalKey] = $value;
                }
            }
            
            return $output;
        } catch (Exception $e) {
            logError('Erreur lors de la récupération multiple', [
                'keys' => $keys,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Définir plusieurs clés à la fois
     */
    public function setMultiple($values, $ttl = null) {
        try {
            $ttl = $ttl ?? $this->defaultTTL;
            $fullValues = [];
            
            foreach ($values as $key => $value) {
                $fullKey = $this->prefix . $key;
                if (is_array($value) || is_object($value)) {
                    $value = serialize($value);
                }
                $fullValues[$fullKey] = $value;
            }
            
            return $this->adapter->setMultiple($fullValues, $ttl);
        } catch (Exception $e) {
            logError('Erreur lors de la définition multiple', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }
    
    /**
     * Obtenir des statistiques du cache
     */
    public function getStats() {
        try {
            return $this->adapter->getStats();
        } catch (Exception $e) {
            logError('Erreur lors de la récupération des statistiques', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
    
    /**
     * Vérifier si une chaîne est sérialisée
     */
    private function isSerialized($data) {
        if (!is_string($data)) {
            return false;
        }
        
        $data = trim($data);
        if (empty($data)) {
            return false;
        }
        
        if ($data === 'b:0;' || $data === 'b:1;' || $data === 'N;') {
            return true;
        }
        
        if (!preg_match('/^([adObis]):/', $data, $badions)) {
            return false;
        }
        
        switch ($badions[1]) {
            case 'a':
            case 'O':
            case 's':
                if (preg_match("/^{$badions[1]}:[0-9]+:.*[;}]\$/s", $data)) {
                    return @unserialize($data) !== false;
                }
                break;
            case 'b':
            case 'i':
            case 'd':
                if (preg_match("/^{$badions[1]}:[0-9.E+-]+;\$/", $data)) {
                    return true;
                }
                break;
        }
        
        return false;
    }
}

/**
 * Interface pour les adaptateurs de cache
 */
interface CacheAdapterInterface {
    public function get($key);
    public function set($key, $value, $ttl);
    public function delete($key);
    public function flush();
    public function increment($key, $value = 1);
    public function decrement($key, $value = 1);
    public function getMultiple($keys);
    public function setMultiple($values, $ttl);
    public function getStats();
}

/**
 * Adaptateur Redis
 */
class RedisAdapter implements CacheAdapterInterface {
    private $redis;
    
    public function __construct($config = []) {
        $this->redis = new Redis();
        
        $host = $config['host'] ?? '127.0.0.1';
        $port = $config['port'] ?? 6379;
        $password = $config['password'] ?? null;
        $database = $config['database'] ?? 0;
        
        if (!$this->redis->connect($host, $port)) {
            throw new Exception("Impossible de se connecter à Redis");
        }
        
        if ($password) {
            $this->redis->auth($password);
        }
        
        $this->redis->select($database);
    }
    
    public function get($key) {
        return $this->redis->get($key);
    }
    
    public function set($key, $value, $ttl) {
        if ($ttl > 0) {
            return $this->redis->setex($key, $ttl, $value);
        }
        return $this->redis->set($key, $value);
    }
    
    public function delete($key) {
        return $this->redis->del($key) > 0;
    }
    
    public function flush() {
        return $this->redis->flushDB();
    }
    
    public function increment($key, $value = 1) {
        return $this->redis->incrBy($key, $value);
    }
    
    public function decrement($key, $value = 1) {
        return $this->redis->decrBy($key, $value);
    }
    
    public function getMultiple($keys) {
        $values = $this->redis->mget($keys);
        return array_combine($keys, $values);
    }
    
    public function setMultiple($values, $ttl) {
        $pipe = $this->redis->multi();
        foreach ($values as $key => $value) {
            if ($ttl > 0) {
                $pipe->setex($key, $ttl, $value);
            } else {
                $pipe->set($key, $value);
            }
        }
        return $pipe->exec();
    }
    
    public function getStats() {
        return $this->redis->info();
    }
}

/**
 * Adaptateur Memcached
 */
class MemcachedAdapter implements CacheAdapterInterface {
    private $memcached;
    
    public function __construct($config = []) {
        $this->memcached = new Memcached();
        
        $servers = $config['servers'] ?? [['127.0.0.1', 11211]];
        
        foreach ($servers as $server) {
            $this->memcached->addServer($server[0], $server[1]);
        }
        
        // Test de connexion
        $stats = $this->memcached->getStats();
        if (empty($stats)) {
            throw new Exception("Impossible de se connecter à Memcached");
        }
    }
    
    public function get($key) {
        return $this->memcached->get($key);
    }
    
    public function set($key, $value, $ttl) {
        return $this->memcached->set($key, $value, $ttl);
    }
    
    public function delete($key) {
        return $this->memcached->delete($key);
    }
    
    public function flush() {
        return $this->memcached->flush();
    }
    
    public function increment($key, $value = 1) {
        return $this->memcached->increment($key, $value);
    }
    
    public function decrement($key, $value = 1) {
        return $this->memcached->decrement($key, $value);
    }
    
    public function getMultiple($keys) {
        return $this->memcached->getMulti($keys);
    }
    
    public function setMultiple($values, $ttl) {
        return $this->memcached->setMulti($values, $ttl);
    }
    
    public function getStats() {
        return $this->memcached->getStats();
    }
}

/**
 * Adaptateur fichier (fallback)
 */
class FileAdapter implements CacheAdapterInterface {
    private $cacheDir;
    
    public function __construct($config = []) {
        $this->cacheDir = $config['cache_dir'] ?? sys_get_temp_dir() . '/agria_cache';
        
        if (!is_dir($this->cacheDir)) {
            mkdir($this->cacheDir, 0755, true);
        }
    }
    
    public function get($key) {
        $file = $this->getFilePath($key);
        
        if (!file_exists($file)) {
            return false;
        }
        
        $data = file_get_contents($file);
        $data = json_decode($data, true);
        
        if ($data['expires'] > 0 && $data['expires'] < time()) {
            unlink($file);
            return false;
        }
        
        return $data['value'];
    }
    
    public function set($key, $value, $ttl) {
        $file = $this->getFilePath($key);
        $expires = $ttl > 0 ? time() + $ttl : 0;
        
        $data = json_encode([
            'value' => $value,
            'expires' => $expires
        ]);
        
        return file_put_contents($file, $data) !== false;
    }
    
    public function delete($key) {
        $file = $this->getFilePath($key);
        return file_exists($file) ? unlink($file) : true;
    }
    
    public function flush() {
        $files = glob($this->cacheDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        return true;
    }
    
    public function increment($key, $value = 1) {
        $current = $this->get($key) ?: 0;
        $new = $current + $value;
        $this->set($key, $new, 0);
        return $new;
    }
    
    public function decrement($key, $value = 1) {
        return $this->increment($key, -$value);
    }
    
    public function getMultiple($keys) {
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $this->get($key);
        }
        return $result;
    }
    
    public function setMultiple($values, $ttl) {
        foreach ($values as $key => $value) {
            $this->set($key, $value, $ttl);
        }
        return true;
    }
    
    public function getStats() {
        $files = glob($this->cacheDir . '/*');
        return [
            'files' => count($files),
            'size' => array_sum(array_map('filesize', $files))
        ];
    }
    
    private function getFilePath($key) {
        return $this->cacheDir . '/' . md5($key) . '.cache';
    }
}

/**
 * Adaptateur mémoire (pour les tests)
 */
class MemoryAdapter implements CacheAdapterInterface {
    private $data = [];
    private $expires = [];
    
    public function get($key) {
        if (isset($this->expires[$key]) && $this->expires[$key] < time()) {
            unset($this->data[$key], $this->expires[$key]);
            return false;
        }
        
        return $this->data[$key] ?? false;
    }
    
    public function set($key, $value, $ttl) {
        $this->data[$key] = $value;
        if ($ttl > 0) {
            $this->expires[$key] = time() + $ttl;
        }
        return true;
    }
    
    public function delete($key) {
        unset($this->data[$key], $this->expires[$key]);
        return true;
    }
    
    public function flush() {
        $this->data = [];
        $this->expires = [];
        return true;
    }
    
    public function increment($key, $value = 1) {
        $current = $this->get($key) ?: 0;
        $new = $current + $value;
        $this->set($key, $new, 0);
        return $new;
    }
    
    public function decrement($key, $value = 1) {
        return $this->increment($key, -$value);
    }
    
    public function getMultiple($keys) {
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $this->get($key);
        }
        return $result;
    }
    
    public function setMultiple($values, $ttl) {
        foreach ($values as $key => $value) {
            $this->set($key, $value, $ttl);
        }
        return true;
    }
    
    public function getStats() {
        return [
            'keys' => count($this->data),
            'memory_usage' => memory_get_usage()
        ];
    }
}