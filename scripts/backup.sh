#!/bin/bash

# Script de sauvegarde pour AGRIA Hub
# Usage: ./scripts/backup.sh [database|files|all]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_TYPE=${1:-all}
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
PROJECT_NAME="agria-hub"

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

# Préparation
prepare_backup() {
    log_info "Préparation de la sauvegarde..."
    
    # Créer le dossier de sauvegarde
    mkdir -p "$BACKUP_DIR"
    
    # Charger les variables d'environnement
    if [ -f ".env" ]; then
        source .env
    else
        log_error "Fichier .env manquant"
        exit 1
    fi
    
    log_success "Préparation terminée"
}

# Sauvegarde de la base de données
backup_database() {
    log_info "Sauvegarde de la base de données..."
    
    local backup_file="$BACKUP_DIR/database_${DATE}.sql"
    
    # Sauvegarde MySQL
    docker-compose exec -T database mysqldump \
        -u"$DB_USER" \
        -p"$DB_PASS" \
        "$DB_NAME" > "$backup_file"
    
    # Compression
    gzip "$backup_file"
    
    log_success "Base de données sauvegardée: ${backup_file}.gz"
}

# Sauvegarde des fichiers
backup_files() {
    log_info "Sauvegarde des fichiers..."
    
    local backup_file="$BACKUP_DIR/files_${DATE}.tar.gz"
    
    # Fichiers à sauvegarder
    local files_to_backup=(
        ".env"
        "config/"
        "backend/uploads/"
        "backend/logs/"
    )
    
    # Créer l'archive
    tar -czf "$backup_file" "${files_to_backup[@]}" 2>/dev/null || true
    
    log_success "Fichiers sauvegardés: $backup_file"
}

# Sauvegarde complète
backup_all() {
    log_info "Sauvegarde complète..."
    
    backup_database
    backup_files
    
    # Créer une archive complète
    local complete_backup="$BACKUP_DIR/complete_${DATE}.tar.gz"
    tar -czf "$complete_backup" -C "$BACKUP_DIR" \
        "database_${DATE}.sql.gz" \
        "files_${DATE}.tar.gz"
    
    log_success "Sauvegarde complète: $complete_backup"
}

# Upload vers S3 (optionnel)
upload_to_s3() {
    if [ -n "$BACKUP_S3_BUCKET" ] && [ -n "$BACKUP_S3_ACCESS_KEY" ]; then
        log_info "Upload vers S3..."
        
        # Utiliser aws-cli si disponible
        if command -v aws &> /dev/null; then
            aws s3 cp "$BACKUP_DIR/" "s3://$BACKUP_S3_BUCKET/agria-hub/" --recursive --exclude "*" --include "*${DATE}*"
            log_success "Sauvegarde uploadée vers S3"
        else
            log_warning "AWS CLI non disponible - upload S3 ignoré"
        fi
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log_info "Nettoyage des anciennes sauvegardes..."
    
    # Garder les 7 dernières sauvegardes
    find "$BACKUP_DIR" -name "*.gz" -type f -mtime +7 -delete 2>/dev/null || true
    find "$BACKUP_DIR" -name "*.tar.gz" -type f -mtime +7 -delete 2>/dev/null || true
    
    log_success "Anciennes sauvegardes nettoyées"
}

# Fonction principale
main() {
    log_info "Début de la sauvegarde AGRIA Hub - Type: $BACKUP_TYPE"
    
    prepare_backup
    
    case $BACKUP_TYPE in
        "database")
            backup_database
            ;;
        "files")
            backup_files
            ;;
        "all")
            backup_all
            ;;
        *)
            log_error "Type de sauvegarde invalide: $BACKUP_TYPE"
            log_info "Usage: $0 [database|files|all]"
            exit 1
            ;;
    esac
    
    upload_to_s3
    cleanup_old_backups
    
    log_success "Sauvegarde terminée avec succès!"
}

# Gestion des signaux
trap 'log_error "Sauvegarde interrompue"; exit 1' INT TERM

# Exécution
main "$@"