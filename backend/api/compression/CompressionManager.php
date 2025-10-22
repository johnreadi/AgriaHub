<?php

class CompressionManager {
    private $config;
    private $supportedEncodings = ['gzip', 'deflate', 'br'];
    private $minCompressionSize = 1024; // 1KB minimum
    private $compressionLevel = 6; // Niveau par défaut (1-9)
    
    public function __construct($config = []) {
        $this->config = array_merge([
            'enabled' => true,
            'min_size' => 1024,
            'level' => 6,
            'types' => [
                'application/json',
                'application/xml',
                'text/html',
                'text/css',
                'text/javascript',
                'application/javascript',
                'text/plain',
                'image/svg+xml'
            ],
            'exclude_extensions' => ['jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', '7z'],
            'cache_compressed' => true,
            'cache_ttl' => 3600
        ], $config);
        
        $this->minCompressionSize = $this->config['min_size'];
        $this->compressionLevel = max(1, min(9, $this->config['level']));
    }
    
    /**
     * Compresser automatiquement la réponse HTTP
     */
    public function compressResponse($content, $contentType = null, $options = []) {
        if (!$this->config['enabled']) {
            return $content;
        }
        
        // Vérifier si la compression est appropriée
        if (!$this->shouldCompress($content, $contentType, $options)) {
            return $content;
        }
        
        // Détecter l'encodage supporté par le client
        $encoding = $this->negotiateEncoding();
        
        if (!$encoding) {
            return $content;
        }
        
        // Vérifier le cache de compression
        $cacheKey = null;
        if ($this->config['cache_compressed'] && isset($options['cache_key'])) {
            $cacheKey = "compressed:{$encoding}:" . $options['cache_key'];
            
            if (isset($options['cache']) && $options['cache']) {
                $cached = $options['cache']->get($cacheKey);
                if ($cached !== null) {
                    $this->setCompressionHeaders($encoding, strlen($cached), strlen($content));
                    return $cached;
                }
            }
        }
        
        // Compresser le contenu
        $compressed = $this->compress($content, $encoding);
        
        if ($compressed === false) {
            return $content;
        }
        
        // Mettre en cache si configuré
        if ($cacheKey && isset($options['cache']) && $options['cache']) {
            $options['cache']->set($cacheKey, $compressed, $this->config['cache_ttl']);
        }
        
        // Définir les en-têtes de compression
        $this->setCompressionHeaders($encoding, strlen($compressed), strlen($content));
        
        // Logger les statistiques
        $this->logCompressionStats($encoding, strlen($content), strlen($compressed));
        
        return $compressed;
    }
    
    /**
     * Compresser du contenu avec l'algorithme spécifié
     */
    public function compress($content, $encoding = 'gzip') {
        if (empty($content)) {
            return $content;
        }
        
        switch ($encoding) {
            case 'gzip':
                return $this->gzipCompress($content);
                
            case 'deflate':
                return $this->deflateCompress($content);
                
            case 'br':
                return $this->brotliCompress($content);
                
            default:
                return false;
        }
    }
    
    /**
     * Décompresser du contenu
     */
    public function decompress($content, $encoding) {
        if (empty($content)) {
            return $content;
        }
        
        switch ($encoding) {
            case 'gzip':
                return gzdecode($content);
                
            case 'deflate':
                return gzinflate($content);
                
            case 'br':
                return $this->brotliDecompress($content);
                
            default:
                return false;
        }
    }
    
    /**
     * Compression GZIP
     */
    private function gzipCompress($content) {
        if (!function_exists('gzencode')) {
            return false;
        }
        
        return gzencode($content, $this->compressionLevel);
    }
    
    /**
     * Compression Deflate
     */
    private function deflateCompress($content) {
        if (!function_exists('gzdeflate')) {
            return false;
        }
        
        return gzdeflate($content, $this->compressionLevel);
    }
    
    /**
     * Compression Brotli
     */
    private function brotliCompress($content) {
        if (!function_exists('brotli_compress')) {
            return false;
        }
        
        return brotli_compress($content, $this->compressionLevel);
    }
    
    /**
     * Décompression Brotli
     */
    private function brotliDecompress($content) {
        if (!function_exists('brotli_uncompress')) {
            return false;
        }
        
        return brotli_uncompress($content);
    }
    
    /**
     * Négocier l'encodage avec le client
     */
    private function negotiateEncoding() {
        $acceptEncoding = $_SERVER['HTTP_ACCEPT_ENCODING'] ?? '';
        
        if (empty($acceptEncoding)) {
            return null;
        }
        
        // Parser l'en-tête Accept-Encoding
        $encodings = $this->parseAcceptEncoding($acceptEncoding);
        
        // Trouver le meilleur encodage supporté
        foreach ($this->supportedEncodings as $encoding) {
            if (isset($encodings[$encoding]) && $encodings[$encoding] > 0) {
                return $encoding;
            }
        }
        
        return null;
    }
    
    /**
     * Parser l'en-tête Accept-Encoding
     */
    private function parseAcceptEncoding($acceptEncoding) {
        $encodings = [];
        $parts = explode(',', $acceptEncoding);
        
        foreach ($parts as $part) {
            $part = trim($part);
            
            if (strpos($part, ';q=') !== false) {
                list($encoding, $quality) = explode(';q=', $part, 2);
                $encodings[trim($encoding)] = (float) $quality;
            } else {
                $encodings[trim($part)] = 1.0;
            }
        }
        
        // Trier par qualité décroissante
        arsort($encodings);
        
        return $encodings;
    }
    
    /**
     * Vérifier si le contenu doit être compressé
     */
    private function shouldCompress($content, $contentType = null, $options = []) {
        // Vérifier la taille minimum
        if (strlen($content) < $this->minCompressionSize) {
            return false;
        }
        
        // Vérifier si déjà compressé
        if ($this->isAlreadyCompressed($content)) {
            return false;
        }
        
        // Vérifier le type de contenu
        if ($contentType && !$this->isCompressibleType($contentType)) {
            return false;
        }
        
        // Vérifier les exclusions spécifiques
        if (isset($options['exclude']) && $options['exclude']) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Vérifier si le contenu est déjà compressé
     */
    private function isAlreadyCompressed($content) {
        // Vérifier les signatures de fichiers compressés
        $signatures = [
            "\x1f\x8b", // GZIP
            "\x78\x9c", // ZLIB/Deflate
            "\x78\x01", // ZLIB/Deflate
            "\x78\xda", // ZLIB/Deflate
            "PK",       // ZIP
            "Rar!",     // RAR
        ];
        
        $start = substr($content, 0, 4);
        
        foreach ($signatures as $signature) {
            if (strpos($start, $signature) === 0) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Vérifier si le type de contenu est compressible
     */
    private function isCompressibleType($contentType) {
        $contentType = strtolower(trim($contentType));
        
        // Supprimer les paramètres (charset, etc.)
        if (strpos($contentType, ';') !== false) {
            $contentType = trim(explode(';', $contentType)[0]);
        }
        
        return in_array($contentType, $this->config['types']);
    }
    
    /**
     * Définir les en-têtes de compression
     */
    private function setCompressionHeaders($encoding, $compressedSize, $originalSize) {
        header("Content-Encoding: {$encoding}");
        header("Content-Length: {$compressedSize}");
        header("Vary: Accept-Encoding");
        
        // Ajouter des informations de compression personnalisées
        $ratio = round((1 - $compressedSize / $originalSize) * 100, 1);
        header("X-Compression-Ratio: {$ratio}%");
        header("X-Original-Size: {$originalSize}");
        header("X-Compressed-Size: {$compressedSize}");
    }
    
    /**
     * Logger les statistiques de compression
     */
    private function logCompressionStats($encoding, $originalSize, $compressedSize) {
        $ratio = round((1 - $compressedSize / $originalSize) * 100, 1);
        $savings = $originalSize - $compressedSize;
        
        logInfo('Compression appliquée', [
            'encoding' => $encoding,
            'original_size' => $originalSize,
            'compressed_size' => $compressedSize,
            'compression_ratio' => $ratio . '%',
            'bytes_saved' => $savings
        ]);
    }
    
    /**
     * Compresser des fichiers statiques
     */
    public function compressStaticFile($filePath, $outputPath = null) {
        if (!file_exists($filePath)) {
            throw new Exception("Fichier non trouvé: {$filePath}");
        }
        
        $content = file_get_contents($filePath);
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        
        // Vérifier si l'extension doit être exclue
        if (in_array(strtolower($extension), $this->config['exclude_extensions'])) {
            return false;
        }
        
        $contentType = $this->getContentTypeFromExtension($extension);
        
        if (!$this->shouldCompress($content, $contentType)) {
            return false;
        }
        
        $outputPath = $outputPath ?: $filePath . '.gz';
        
        // Compresser avec GZIP par défaut pour les fichiers statiques
        $compressed = $this->gzipCompress($content);
        
        if ($compressed === false) {
            return false;
        }
        
        $result = file_put_contents($outputPath, $compressed);
        
        if ($result !== false) {
            $this->logCompressionStats('gzip', strlen($content), strlen($compressed));
            return $outputPath;
        }
        
        return false;
    }
    
    /**
     * Obtenir le type de contenu à partir de l'extension
     */
    private function getContentTypeFromExtension($extension) {
        $mimeTypes = [
            'html' => 'text/html',
            'css' => 'text/css',
            'js' => 'application/javascript',
            'json' => 'application/json',
            'xml' => 'application/xml',
            'txt' => 'text/plain',
            'svg' => 'image/svg+xml'
        ];
        
        return $mimeTypes[strtolower($extension)] ?? 'application/octet-stream';
    }
    
    /**
     * Middleware de compression pour les réponses API
     */
    public function middleware($request, $response, $next) {
        // Exécuter le middleware suivant
        $response = $next($request, $response);
        
        // Compresser la réponse si approprié
        $content = $response->getBody();
        $contentType = $response->getHeader('Content-Type')[0] ?? null;
        
        $compressed = $this->compressResponse($content, $contentType, [
            'cache_key' => md5($request->getUri() . serialize($request->getQueryParams()))
        ]);
        
        if ($compressed !== $content) {
            $response = $response->withBody($compressed);
        }
        
        return $response;
    }
    
    /**
     * Obtenir les statistiques de compression
     */
    public function getStats() {
        return [
            'enabled' => $this->config['enabled'],
            'supported_encodings' => $this->supportedEncodings,
            'min_compression_size' => $this->minCompressionSize,
            'compression_level' => $this->compressionLevel,
            'compressible_types' => $this->config['types'],
            'excluded_extensions' => $this->config['exclude_extensions']
        ];
    }
    
    /**
     * Tester la compression sur un échantillon
     */
    public function testCompression($content, $encoding = 'gzip') {
        $originalSize = strlen($content);
        
        if ($originalSize === 0) {
            return [
                'success' => false,
                'error' => 'Contenu vide'
            ];
        }
        
        $startTime = microtime(true);
        $compressed = $this->compress($content, $encoding);
        $compressionTime = (microtime(true) - $startTime) * 1000;
        
        if ($compressed === false) {
            return [
                'success' => false,
                'error' => 'Échec de la compression'
            ];
        }
        
        $compressedSize = strlen($compressed);
        $ratio = round((1 - $compressedSize / $originalSize) * 100, 1);
        
        // Test de décompression
        $startTime = microtime(true);
        $decompressed = $this->decompress($compressed, $encoding);
        $decompressionTime = (microtime(true) - $startTime) * 1000;
        
        $integrity = ($decompressed === $content);
        
        return [
            'success' => true,
            'encoding' => $encoding,
            'original_size' => $originalSize,
            'compressed_size' => $compressedSize,
            'compression_ratio' => $ratio,
            'bytes_saved' => $originalSize - $compressedSize,
            'compression_time' => $compressionTime,
            'decompression_time' => $decompressionTime,
            'integrity_check' => $integrity
        ];
    }
    
    /**
     * Optimiser automatiquement le niveau de compression
     */
    public function optimizeCompressionLevel($sampleContent, $targetRatio = 70) {
        $bestLevel = $this->compressionLevel;
        $bestRatio = 0;
        $bestTime = PHP_FLOAT_MAX;
        
        for ($level = 1; $level <= 9; $level++) {
            $this->compressionLevel = $level;
            
            $test = $this->testCompression($sampleContent);
            
            if ($test['success']) {
                $ratio = $test['compression_ratio'];
                $time = $test['compression_time'];
                
                // Trouver le meilleur équilibre ratio/temps
                if ($ratio >= $targetRatio && $time < $bestTime) {
                    $bestLevel = $level;
                    $bestRatio = $ratio;
                    $bestTime = $time;
                }
            }
        }
        
        $this->compressionLevel = $bestLevel;
        
        return [
            'optimal_level' => $bestLevel,
            'compression_ratio' => $bestRatio,
            'compression_time' => $bestTime
        ];
    }
}

/**
 * Classe utilitaire pour la minification
 */
class Minifier {
    /**
     * Minifier du JSON
     */
    public static function minifyJson($json) {
        if (is_array($json) || is_object($json)) {
            return json_encode($json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        
        $decoded = json_decode($json, true);
        if ($decoded !== null) {
            return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
        
        return $json;
    }
    
    /**
     * Minifier du CSS (basique)
     */
    public static function minifyCss($css) {
        // Supprimer les commentaires
        $css = preg_replace('/\/\*.*?\*\//s', '', $css);
        
        // Supprimer les espaces inutiles
        $css = preg_replace('/\s+/', ' ', $css);
        $css = preg_replace('/\s*{\s*/', '{', $css);
        $css = preg_replace('/;\s*}/', '}', $css);
        $css = preg_replace('/\s*;\s*/', ';', $css);
        $css = preg_replace('/\s*:\s*/', ':', $css);
        
        return trim($css);
    }
    
    /**
     * Minifier du JavaScript (basique)
     */
    public static function minifyJs($js) {
        // Supprimer les commentaires sur une ligne
        $js = preg_replace('/\/\/.*$/m', '', $js);
        
        // Supprimer les commentaires multi-lignes
        $js = preg_replace('/\/\*.*?\*\//s', '', $js);
        
        // Supprimer les espaces inutiles
        $js = preg_replace('/\s+/', ' ', $js);
        $js = preg_replace('/\s*{\s*/', '{', $js);
        $js = preg_replace('/\s*}\s*/', '}', $js);
        $js = preg_replace('/\s*;\s*/', ';', $js);
        
        return trim($js);
    }
    
    /**
     * Minifier du HTML (basique)
     */
    public static function minifyHtml($html) {
        // Supprimer les commentaires HTML
        $html = preg_replace('/<!--.*?-->/s', '', $html);
        
        // Supprimer les espaces entre les balises
        $html = preg_replace('/>\s+</', '><', $html);
        
        // Supprimer les espaces multiples
        $html = preg_replace('/\s+/', ' ', $html);
        
        return trim($html);
    }
}