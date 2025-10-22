#!/bin/bash

# Script de déploiement AGRIA Hub vers Dokploy
# Usage: ./scripts/deploy.sh [staging|production]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="agria-hub"
DOKPLOY_URL=${DOKPLOY_API_URL:-"https://dokploy.agriarouen.fr"}
DOMAIN=${DOMAIN:-"mobile.agriarouen.fr"}

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
    log_info "Vérification des prérequis pour le déploiement..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    
    # Vérifier les fichiers requis
    local required_files=(
        ".env"
        "docker-compose.yml"
        "Dockerfile.frontend"
        "Dockerfile.backend"
        "config/dokploy.config.yml"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "Fichier requis manquant: $file"
            exit 1
        fi
    done
    
    # Vérifier les variables d'environnement critiques
    source .env
    local required_vars=(
        "DB_NAME"
        "DB_USER"
        "DB_PASS"
        "JWT_SECRET"
        "DOMAIN"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Variable d'environnement manquante: $var"
            exit 1
        fi
    done
    
    log_success "Prérequis vérifiés"
}

# Préparation du déploiement
prepare_deployment() {
    log_info "Préparation du déploiement pour l'environnement: $ENVIRONMENT"
    
    # Créer le dossier de déploiement temporaire
    local deploy_dir="./deploy-$ENVIRONMENT"
    rm -rf "$deploy_dir"
    mkdir -p "$deploy_dir"
    
    # Copier les fichiers nécessaires
    cp docker-compose.yml "$deploy_dir/"
    cp Dockerfile.* "$deploy_dir/"
    cp .env "$deploy_dir/"
    cp -r config "$deploy_dir/"
    
    # Copier le code source
    if [ -d "frontend/dist" ]; then
        cp -r frontend/dist "$deploy_dir/frontend-dist"
    else
        log_warning "Build frontend manquant - exécution du build..."
        ./scripts/build.sh frontend
        cp -r frontend/dist "$deploy_dir/frontend-dist"
    fi
    
    cp -r backend "$deploy_dir/"
    
    log_success "Déploiement préparé dans $deploy_dir"
}

# Build des images pour la production
build_production_images() {
    log_info "Build des images de production..."
    
    local deploy_dir="./deploy-$ENVIRONMENT"
    cd "$deploy_dir"
    
    # Build avec optimisations de production
    docker-compose build \
        --no-cache \
        --compress \
        --parallel
    
    # Tag des images
    docker tag "${PROJECT_NAME}_frontend:latest" "${PROJECT_NAME}_frontend:$ENVIRONMENT"
    docker tag "${PROJECT_NAME}_backend:latest" "${PROJECT_NAME}_backend:$ENVIRONMENT"
    
    cd ..
    log_success "Images de production buildées"
}

# Tests de pré-déploiement
run_pre_deployment_tests() {
    log_info "Exécution des tests de pré-déploiement..."
    
    local deploy_dir="./deploy-$ENVIRONMENT"
    cd "$deploy_dir"
    
    # Test de démarrage des conteneurs
    log_info "Test de démarrage des conteneurs..."
    docker-compose up -d
    
    # Attendre que les services soient prêts
    sleep 30
    
    # Test de santé des services
    local services=("frontend" "backend" "database")
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "Service $service: OK"
        else
            log_error "Service $service: ÉCHEC"
            docker-compose logs "$service"
            docker-compose down
            cd ..
            exit 1
        fi
    done
    
    # Test des endpoints
    log_info "Test des endpoints..."
    
    # Test frontend
    if curl -f -s http://localhost:8080/health > /dev/null; then
        log_success "Frontend endpoint: OK"
    else
        log_warning "Frontend endpoint: Non disponible"
    fi
    
    # Test backend
    if curl -f -s http://localhost:9000/api/health > /dev/null; then
        log_success "Backend endpoint: OK"
    else
        log_warning "Backend endpoint: Non disponible"
    fi
    
    # Arrêter les conteneurs de test
    docker-compose down
    
    cd ..
    log_success "Tests de pré-déploiement terminés"
}

# Déploiement vers Dokploy
deploy_to_dokploy() {
    log_info "Déploiement vers Dokploy..."
    
    local deploy_dir="./deploy-$ENVIRONMENT"
    
    # Créer l'archive de déploiement
    log_info "Création de l'archive de déploiement..."
    tar -czf "agria-hub-$ENVIRONMENT.tar.gz" -C "$deploy_dir" .
    
    # Upload vers Dokploy (simulation - à adapter selon l'API Dokploy)
    log_info "Upload vers Dokploy..."
    
    # Ici, vous devrez adapter selon l'API de votre instance Dokploy
    # Exemple avec curl (à personnaliser):
    # curl -X POST \
    #   -H "Authorization: Bearer $DOKPLOY_API_TOKEN" \
    #   -F "file=@agria-hub-$ENVIRONMENT.tar.gz" \
    #   "$DOKPLOY_URL/api/projects/$PROJECT_NAME/deploy"
    
    log_info "Instructions pour Dokploy:"
    log_info "1. Connectez-vous à votre interface Dokploy"
    log_info "2. Créez un nouveau projet: $PROJECT_NAME"
    log_info "3. Uploadez l'archive: agria-hub-$ENVIRONMENT.tar.gz"
    log_info "4. Configurez le domaine: $DOMAIN"
    log_info "5. Lancez le déploiement"
    
    log_success "Archive de déploiement créée: agria-hub-$ENVIRONMENT.tar.gz"
}

# Vérification post-déploiement
verify_deployment() {
    log_info "Vérification du déploiement..."
    
    # Attendre que le déploiement soit actif
    log_info "Attente de la disponibilité du service..."
    sleep 60
    
    # Test de l'application déployée
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_info "Tentative $attempt/$max_attempts..."
        
        if curl -f -s "https://$DOMAIN/health" > /dev/null; then
            log_success "Application accessible sur https://$DOMAIN"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_error "Application non accessible après $max_attempts tentatives"
            exit 1
        fi
        
        sleep 30
        ((attempt++))
    done
    
    # Tests fonctionnels de base
    log_info "Tests fonctionnels..."
    
    # Test API
    if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
        log_success "API fonctionnelle"
    else
        log_warning "API non accessible"
    fi
    
    log_success "Déploiement vérifié avec succès"
}

# Nettoyage post-déploiement
cleanup_deployment() {
    log_info "Nettoyage post-déploiement..."
    
    # Supprimer les fichiers temporaires
    rm -rf "./deploy-$ENVIRONMENT"
    
    # Nettoyer les images Docker locales (optionnel)
    if [ "$ENVIRONMENT" = "production" ]; then
        docker system prune -f
    fi
    
    log_success "Nettoyage terminé"
}

# Rollback en cas d'échec
rollback() {
    log_error "Échec du déploiement - Rollback nécessaire"
    log_info "Veuillez effectuer un rollback manuel dans Dokploy"
    cleanup_deployment
    exit 1
}

# Fonction principale
main() {
    log_info "Début du déploiement AGRIA Hub vers $ENVIRONMENT"
    
    # Gestion des erreurs
    trap rollback ERR
    
    check_requirements
    prepare_deployment
    build_production_images
    run_pre_deployment_tests
    deploy_to_dokploy
    verify_deployment
    cleanup_deployment
    
    log_success "Déploiement terminé avec succès!"
    log_info "Application disponible sur: https://$DOMAIN"
}

# Gestion des signaux
trap 'log_error "Déploiement interrompu"; cleanup_deployment; exit 1' INT TERM

# Exécution
main "$@"