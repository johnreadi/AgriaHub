<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== TEST ENDPOINT AUTH ===\n";

// Simuler une requête POST vers l'endpoint auth
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['CONTENT_TYPE'] = 'application/json';
// Forcer l'action login et le mode debug
$_GET['action'] = 'login';
$_GET['debug'] = '1';
$_SERVER['REQUEST_URI'] = '/api/auth.php?action=login&debug=1';
$_SERVER['HTTP_X_DEBUG'] = '1';

// Données de test
$postData = json_encode([
    'email' => 'demo',
    'password' => 'demo123'
]);

// Simuler php://input
$tempFile = tmpfile();
fwrite($tempFile, $postData);
rewind($tempFile);

// Capturer la sortie
ob_start();

// Inclure le fichier auth.php
try {
    // Rediriger php://input vers notre fichier temporaire
    stream_wrapper_unregister("php");
    stream_wrapper_register("php", "TestInputWrapper");
    TestInputWrapper::$data = $postData;
    
    include 'api/auth.php';
    
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
}

$output = ob_get_clean();
echo "Sortie de auth.php:\n";
echo $output . "\n";

// Classe pour simuler php://input
class TestInputWrapper {
    public static $data = '';
    private $position = 0;
    
    public function stream_open($path, $mode, $options, &$opened_path) {
        $this->position = 0;
        return true;
    }
    
    public function stream_read($count) {
        $ret = substr(self::$data, $this->position, $count);
        $this->position += strlen($ret);
        return $ret;
    }
    
    public function stream_eof() {
        return $this->position >= strlen(self::$data);
    }
    
    public function stream_stat() {
        return array();
    }
}

echo "\n=== FIN TEST ===\n";
?>