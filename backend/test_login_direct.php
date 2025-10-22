<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== TEST LOGIN DIRECT ===\n";

// Simuler les variables globales nécessaires
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/auth/login';
$_SERVER['HTTP_ORIGIN'] = 'http://localhost:3000';

// Inclure la configuration
require_once 'api/config.php';

// Créer l'instance de base de données
$database = new Database();
$db = $database->getConnection();

// Simuler les données POST
$postData = json_encode([
    'email' => 'admin@agria-rouen.fr',
    'password' => 'admin123'
]);

// Créer un fichier temporaire pour simuler php://input
$tempFile = tmpfile();
fwrite($tempFile, $postData);
rewind($tempFile);

// Rediriger php://input
stream_wrapper_unregister("php");
stream_wrapper_register("php", "TestInputWrapper");
TestInputWrapper::$data = $postData;

// Inclure les fonctions d'auth
require_once 'api/auth.php';

echo "Appel de la fonction login...\n";

try {
    // Capturer la sortie
    ob_start();
    login($db);
    $output = ob_get_clean();
    echo "Sortie: " . $output . "\n";
} catch (Exception $e) {
    echo "Erreur: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}

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