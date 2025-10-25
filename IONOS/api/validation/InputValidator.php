<?php

class InputValidator {
    
    /**
     * Valider et nettoyer les données d'entrée selon les règles définies
     */
    public static function validate($data, $rules) {
        $errors = [];
        $cleanData = [];
        
        foreach ($rules as $field => $fieldRules) {
            $value = $data[$field] ?? null;
            $fieldErrors = [];
            
            // Vérifier si le champ est requis
            if (isset($fieldRules['required']) && $fieldRules['required']) {
                if ($value === null || $value === '') {
                    $fieldErrors[] = "Le champ {$field} est requis";
                    continue;
                }
            }
            
            // Si le champ n'est pas requis et est vide, passer au suivant
            if ($value === null || $value === '') {
                $cleanData[$field] = $value;
                continue;
            }
            
            // Validation du type
            if (isset($fieldRules['type'])) {
                $typeError = self::validateType($value, $fieldRules['type'], $field);
                if ($typeError) {
                    $fieldErrors[] = $typeError;
                }
            }
            
            // Validation de la longueur minimale
            if (isset($fieldRules['min_length'])) {
                if (strlen($value) < $fieldRules['min_length']) {
                    $fieldErrors[] = "Le champ {$field} doit contenir au moins {$fieldRules['min_length']} caractères";
                }
            }
            
            // Validation de la longueur maximale
            if (isset($fieldRules['max_length'])) {
                if (strlen($value) > $fieldRules['max_length']) {
                    $fieldErrors[] = "Le champ {$field} ne peut pas dépasser {$fieldRules['max_length']} caractères";
                }
            }
            
            // Validation de l'email
            if (isset($fieldRules['email']) && $fieldRules['email']) {
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                    $fieldErrors[] = "Le champ {$field} doit être une adresse email valide";
                }
            }
            
            // Validation du téléphone
            if (isset($fieldRules['phone']) && $fieldRules['phone']) {
                if (!self::validatePhone($value)) {
                    $fieldErrors[] = "Le champ {$field} doit être un numéro de téléphone valide";
                }
            }
            
            // Validation du mot de passe
            if (isset($fieldRules['password']) && $fieldRules['password']) {
                $passwordError = self::validatePassword($value);
                if ($passwordError) {
                    $fieldErrors[] = $passwordError;
                }
            }
            
            // Validation des valeurs autorisées
            if (isset($fieldRules['in'])) {
                if (!in_array($value, $fieldRules['in'])) {
                    $fieldErrors[] = "Le champ {$field} doit être l'une des valeurs suivantes: " . implode(', ', $fieldRules['in']);
                }
            }
            
            // Validation des expressions régulières
            if (isset($fieldRules['regex'])) {
                if (!preg_match($fieldRules['regex'], $value)) {
                    $fieldErrors[] = "Le champ {$field} ne respecte pas le format requis";
                }
            }
            
            // Validation numérique
            if (isset($fieldRules['numeric']) && $fieldRules['numeric']) {
                if (!is_numeric($value)) {
                    $fieldErrors[] = "Le champ {$field} doit être numérique";
                }
            }
            
            // Validation des valeurs min/max pour les nombres
            if (isset($fieldRules['min']) && is_numeric($value)) {
                if ($value < $fieldRules['min']) {
                    $fieldErrors[] = "Le champ {$field} doit être supérieur ou égal à {$fieldRules['min']}";
                }
            }
            
            if (isset($fieldRules['max']) && is_numeric($value)) {
                if ($value > $fieldRules['max']) {
                    $fieldErrors[] = "Le champ {$field} doit être inférieur ou égal à {$fieldRules['max']}";
                }
            }
            
            // Validation des dates
            if (isset($fieldRules['date']) && $fieldRules['date']) {
                if (!self::validateDate($value)) {
                    $fieldErrors[] = "Le champ {$field} doit être une date valide (YYYY-MM-DD)";
                }
            }
            
            // Validation des URLs
            if (isset($fieldRules['url']) && $fieldRules['url']) {
                if (!filter_var($value, FILTER_VALIDATE_URL)) {
                    $fieldErrors[] = "Le champ {$field} doit être une URL valide";
                }
            }
            
            // Validation personnalisée
            if (isset($fieldRules['custom']) && is_callable($fieldRules['custom'])) {
                $customError = $fieldRules['custom']($value, $field);
                if ($customError) {
                    $fieldErrors[] = $customError;
                }
            }
            
            // Si pas d'erreurs, nettoyer et ajouter la valeur
            if (empty($fieldErrors)) {
                $cleanData[$field] = self::sanitizeValue($value, $fieldRules);
            } else {
                $errors[$field] = $fieldErrors;
            }
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'data' => $cleanData
        ];
    }
    
    /**
     * Valider le type de données
     */
    private static function validateType($value, $type, $field) {
        switch ($type) {
            case 'string':
                if (!is_string($value)) {
                    return "Le champ {$field} doit être une chaîne de caractères";
                }
                break;
                
            case 'integer':
                if (!filter_var($value, FILTER_VALIDATE_INT)) {
                    return "Le champ {$field} doit être un nombre entier";
                }
                break;
                
            case 'float':
                if (!filter_var($value, FILTER_VALIDATE_FLOAT)) {
                    return "Le champ {$field} doit être un nombre décimal";
                }
                break;
                
            case 'boolean':
                if (!is_bool($value) && !in_array($value, ['true', 'false', '1', '0', 1, 0])) {
                    return "Le champ {$field} doit être un booléen";
                }
                break;
                
            case 'array':
                if (!is_array($value)) {
                    return "Le champ {$field} doit être un tableau";
                }
                break;
        }
        
        return null;
    }
    
    /**
     * Valider un numéro de téléphone français
     */
    private static function validatePhone($phone) {
        // Supprimer tous les espaces, tirets et points
        $cleanPhone = preg_replace('/[\s\-\.]/', '', $phone);
        
        // Vérifier le format français (commence par 0 et 10 chiffres)
        // ou international (commence par +33 et 9 chiffres après)
        $patterns = [
            '/^0[1-9][0-9]{8}$/',           // Format français: 0123456789
            '/^\+33[1-9][0-9]{8}$/',        // Format international: +33123456789
            '/^33[1-9][0-9]{8}$/'           // Format international sans +: 33123456789
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $cleanPhone)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Valider la force d'un mot de passe
     */
    private static function validatePassword($password) {
        if (strlen($password) < 8) {
            return "Le mot de passe doit contenir au moins 8 caractères";
        }
        
        if (!preg_match('/[A-Z]/', $password)) {
            return "Le mot de passe doit contenir au moins une lettre majuscule";
        }
        
        if (!preg_match('/[a-z]/', $password)) {
            return "Le mot de passe doit contenir au moins une lettre minuscule";
        }
        
        if (!preg_match('/[0-9]/', $password)) {
            return "Le mot de passe doit contenir au moins un chiffre";
        }
        
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return "Le mot de passe doit contenir au moins un caractère spécial";
        }
        
        // Vérifier les mots de passe communs
        $commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ];
        
        if (in_array(strtolower($password), $commonPasswords)) {
            return "Ce mot de passe est trop commun, veuillez en choisir un autre";
        }
        
        return null;
    }
    
    /**
     * Valider une date
     */
    private static function validateDate($date, $format = 'Y-m-d') {
        $d = DateTime::createFromFormat($format, $date);
        return $d && $d->format($format) === $date;
    }
    
    /**
     * Nettoyer une valeur selon les règles
     */
    private static function sanitizeValue($value, $rules) {
        // Nettoyer les chaînes de caractères
        if (is_string($value)) {
            // Supprimer les espaces en début et fin
            $value = trim($value);
            
            // Échapper les caractères HTML si demandé
            if (isset($rules['escape_html']) && $rules['escape_html']) {
                $value = htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
            }
            
            // Supprimer les balises HTML si demandé
            if (isset($rules['strip_tags']) && $rules['strip_tags']) {
                $value = strip_tags($value);
            }
        }
        
        // Convertir les booléens
        if (isset($rules['type']) && $rules['type'] === 'boolean') {
            $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
        }
        
        // Convertir les entiers
        if (isset($rules['type']) && $rules['type'] === 'integer') {
            $value = (int) $value;
        }
        
        // Convertir les flottants
        if (isset($rules['type']) && $rules['type'] === 'float') {
            $value = (float) $value;
        }
        
        return $value;
    }
    
    /**
     * Valider un fichier uploadé
     */
    public static function validateFile($file, $rules) {
        $errors = [];
        
        // Vérifier si le fichier a été uploadé
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['Le fichier n\'a pas été correctement uploadé'];
        }
        
        // Vérifier la taille du fichier
        if (isset($rules['max_size'])) {
            if ($file['size'] > $rules['max_size']) {
                $maxSizeMB = round($rules['max_size'] / 1024 / 1024, 2);
                $errors[] = "Le fichier ne peut pas dépasser {$maxSizeMB} MB";
            }
        }
        
        // Vérifier le type MIME
        if (isset($rules['allowed_types'])) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            if (!in_array($mimeType, $rules['allowed_types'])) {
                $errors[] = "Type de fichier non autorisé. Types acceptés: " . implode(', ', $rules['allowed_types']);
            }
        }
        
        // Vérifier l'extension
        if (isset($rules['allowed_extensions'])) {
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($extension, $rules['allowed_extensions'])) {
                $errors[] = "Extension de fichier non autorisée. Extensions acceptées: " . implode(', ', $rules['allowed_extensions']);
            }
        }
        
        return $errors;
    }
    
    /**
     * Règles de validation prédéfinies pour les champs communs
     */
    public static function getCommonRules() {
        return [
            'email' => [
                'required' => true,
                'type' => 'string',
                'email' => true,
                'max_length' => 255
            ],
            'password' => [
                'required' => true,
                'type' => 'string',
                'password' => true
            ],
            'first_name' => [
                'required' => true,
                'type' => 'string',
                'min_length' => 2,
                'max_length' => 50,
                'strip_tags' => true
            ],
            'last_name' => [
                'required' => true,
                'type' => 'string',
                'min_length' => 2,
                'max_length' => 50,
                'strip_tags' => true
            ],
            'phone' => [
                'required' => true,
                'type' => 'string',
                'phone' => true
            ],
            'amount' => [
                'required' => true,
                'type' => 'float',
                'min' => 0,
                'max' => 9999.99
            ]
        ];
    }
}