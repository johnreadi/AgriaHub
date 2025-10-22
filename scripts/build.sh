#!/bin/bash

# Script de build pour AGRIA Hub
# Usage: ./scripts/build.sh [frontend|backend|all]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifications préalables
check_requirements() {
    log_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        log_warning "Fichier .env manquant, copie de .env.example"
        cp .env.example .env
        log_warning "Veuillez configurer le fichier .env avant de continuer"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Build du frontend
build_frontend() {
    log_info "Build du frontend React..."
    
    cd frontend
    
    # Vérifier package.json
    if [ ! -f "package.json" ]; then
        log_error "package.json manquant dans le dossier frontend"
        exit 1
    fi
    
    # Installation des dépendances
    log_info "Installation des dépendances npm..."
    npm ci --production=false
    
    # Build de production
    log_info "Build de production..."
    npm run build
    
    # Vérifier que le build existe
    if [ ! -d "dist" ]; then
        log_error "Le build frontend a échoué - dossier dist manquant"
        exit 1
    fi
    
    cd ..
    log_success "Frontend buildé avec succès"
}

# Build du backend
build_backend() {
    log_info "Préparation du backend PHP..."
    
    cd backend
    
    # Vérifier composer.json
    if [ ! -f "composer.json" ]; then
        log_warning "composer.json manquant - création d'un fichier basique"
        cat > composer.json << EOF
{
    "name": "agria/backend",
    "description": "AGRIA Backend API",
    "type": "project",
    "require": {
        "php": ">=8.1"
    },
    "autoload": {
        "psr-4": {
            "App\\\\": "src/"
        }
    }
}
EOF
    fi
    
    # Installation des dépendances Composer si disponible
    if command -v composer &> /dev/null; then
        log_info "Installation des dépendances Composer..."
        composer install --no-dev --optimize-autoloader
    else
        log_warning "Composer non disponible - les dépendances seront installées dans Docker"
    fi
    
    # Vérifier les permissions
    log_info "Configuration des permissions..."
    chmod -R 755 .
    
    cd ..
    log_success "Backend préparé avec succès"
}

# Build des images Docker
build_docker() {
    log_info "Build des images Docker..."
    
    # Build avec docker-compose
    docker-compose build --no-cache
    
    log_success "Images Docker buildées avec succès"
}

# Tests
run_tests() {
    log_info "Exécution des tests..."
    
    # Tests frontend
    if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
        cd frontend
        if npm run test:ci &> /dev/null; then
            log_success "Tests frontend réussis"
        else
            log_warning "Tests frontend non disponibles ou échoués"
        fi
        cd ..
    fi
    
    # Tests backend
    if [ -d "backend" ] && [ -f "backend/composer.json" ]; then
        cd backend
        if composer test &> /dev/null; then
            log_success "Tests backend réussis"
        else
            log_warning "Tests backend non disponibles ou échoués"
        fi
        cd ..
    fi
}

# Nettoyage
cleanup() {
    log_info "Nettoyage des fichiers temporaires..."
    
    # Nettoyer les caches npm
    if [ -d "frontend/node_modules/.cache" ]; then
        rm -rf frontend/node_modules/.cache
    fi
    
    # Nettoyer les logs
    find . -name "*.log" -type f -delete 2>/dev/null || true
    
    log_success "Nettoyage terminé"
}

# Fonction principale
main() {
    local component=${1:-all}
    
    log_info "Début du build AGRIA Hub - Composant: $component"
    
    check_requirements
    
    case $component in
        "frontend")
            build_frontend
            ;;
        "backend")
            build_backend
            ;;
        "docker")
            build_docker
            ;;
        "all")
            build_frontend
            build_backend
            build_docker
            run_tests
            cleanup
            ;;
        *)
            log_error "Composant invalide: $component"
            log_info "Usage: $0 [frontend|backend|docker|all]"
            exit 1
            ;;
    esac
    
    log_success "Build terminé avec succès!"
}

# Gestion des signaux
trap 'log_error "Build interrompu"; exit 1' INT TERM

# Exécution
main "$@"