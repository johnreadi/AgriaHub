#!/bin/bash

# Script de monitoring pour AGRIA Hub
# Usage: ./scripts/monitor.sh [status|logs|health|metrics]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MONITOR_TYPE=${1:-status}
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

# Statut des services
check_status() {
    log_info "Vérification du statut des services..."
    
    echo "=== STATUT DES CONTENEURS ==="
    docker-compose ps
    
    echo -e "\n=== UTILISATION DES RESSOURCES ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo -e "\n=== ESPACE DISQUE ==="
    df -h
    
    echo -e "\n=== MÉMOIRE SYSTÈME ==="
    free -h
}

# Vérification de santé
check_health() {
    log_info "Vérification de la santé de l'application..."
    
    local services=("frontend" "backend" "database")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        echo -n "Service $service: "
        
        if docker-compose ps "$service" | grep -q "Up (healthy)"; then
            echo -e "${GREEN}HEALTHY${NC}"
        elif docker-compose ps "$service" | grep -q "Up"; then
            echo -e "${YELLOW}RUNNING${NC}"
        else
            echo -e "${RED}DOWN${NC}"
            all_healthy=false
        fi
    done
    
    # Test des endpoints
    echo -e "\n=== ENDPOINTS ==="
    
    # Frontend
    echo -n "Frontend (https://$DOMAIN): "
    if curl -f -s -o /dev/null "https://$DOMAIN"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
        all_healthy=false
    fi
    
    # Backend API
    echo -n "Backend API (https://$DOMAIN/api/health): "
    if curl -f -s -o /dev/null "https://$DOMAIN/api/health"; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FAILED${NC}"
        all_healthy=false
    fi
    
    # Résumé
    echo -e "\n=== RÉSUMÉ ==="
    if [ "$all_healthy" = true ]; then
        log_success "Tous les services sont opérationnels"
    else
        log_error "Certains services présentent des problèmes"
    fi
}

# Affichage des logs
show_logs() {
    local service=${2:-all}
    
    log_info "Affichage des logs - Service: $service"
    
    if [ "$service" = "all" ]; then
        docker-compose logs --tail=100 -f
    else
        docker-compose logs --tail=100 -f "$service"
    fi
}

# Métriques détaillées
show_metrics() {
    log_info "Métriques détaillées..."
    
    echo "=== MÉTRIQUES SYSTÈME ==="
    echo "Date: $(date)"
    echo "Uptime: $(uptime)"
    
    echo -e "\n=== MÉTRIQUES DOCKER ==="
    docker system df
    
    echo -e "\n=== MÉTRIQUES RÉSEAU ==="
    docker network ls
    
    echo -e "\n=== VOLUMES ==="
    docker volume ls
    
    echo -e "\n=== IMAGES ==="
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    
    # Métriques de base de données
    echo -e "\n=== BASE DE DONNÉES ==="
    if docker-compose ps database | grep -q "Up"; then
        docker-compose exec database mysql -u"$DB_USER" -p"$DB_PASS" -e "
            SELECT 
                table_schema as 'Database',
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as 'Size (MB)'
            FROM information_schema.tables 
            WHERE table_schema = '$DB_NAME'
            GROUP BY table_schema;
        " 2>/dev/null || echo "Impossible de récupérer les métriques DB"
    else
        echo "Base de données non disponible"
    fi
}

# Alertes automatiques
check_alerts() {
    log_info "Vérification des alertes..."
    
    local alerts=()
    
    # Vérifier l'utilisation CPU
    local cpu_usage=$(docker stats --no-stream --format "{{.CPUPerc}}" | sed 's/%//' | sort -nr | head -1)
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        alerts+=("CPU élevé: ${cpu_usage}%")
    fi
    
    # Vérifier l'utilisation mémoire
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    if (( $(echo "$mem_usage > 85" | bc -l) )); then
        alerts+=("Mémoire élevée: ${mem_usage}%")
    fi
    
    # Vérifier l'espace disque
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 90 ]; then
        alerts+=("Disque plein: ${disk_usage}%")
    fi
    
    # Vérifier les services
    local services=("frontend" "backend" "database")
    for service in "${services[@]}"; do
        if ! docker-compose ps "$service" | grep -q "Up"; then
            alerts+=("Service $service arrêté")
        fi
    done
    
    # Afficher les alertes
    if [ ${#alerts[@]} -gt 0 ]; then
        log_error "ALERTES DÉTECTÉES:"
        for alert in "${alerts[@]}"; do
            echo -e "${RED}  - $alert${NC}"
        done
        
        # Envoyer des notifications (si configuré)
        send_notifications "${alerts[@]}"
    else
        log_success "Aucune alerte détectée"
    fi
}

# Envoi de notifications
send_notifications() {
    local alerts=("$@")
    
    # Notification Slack
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local message="🚨 AGRIA Hub - Alertes détectées:\n"
        for alert in "${alerts[@]}"; do
            message+="• $alert\n"
        done
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" &>/dev/null || true
    fi
    
    # Notification par email
    if [ -n "$ADMIN_EMAIL" ] && command -v mail &> /dev/null; then
        local subject="AGRIA Hub - Alertes système"
        local body="Alertes détectées sur AGRIA Hub:\n\n"
        for alert in "${alerts[@]}"; do
            body+="- $alert\n"
        done
        
        echo -e "$body" | mail -s "$subject" "$ADMIN_EMAIL" || true
    fi
}

# Fonction principale
main() {
    log_info "Monitoring AGRIA Hub - Type: $MONITOR_TYPE"
    
    case $MONITOR_TYPE in
        "status")
            check_status
            ;;
        "health")
            check_health
            ;;
        "logs")
            show_logs "$@"
            ;;
        "metrics")
            show_metrics
            ;;
        "alerts")
            check_alerts
            ;;
        "all")
            check_status
            echo -e "\n" && check_health
            echo -e "\n" && show_metrics
            echo -e "\n" && check_alerts
            ;;
        *)
            log_error "Type de monitoring invalide: $MONITOR_TYPE"
            log_info "Usage: $0 [status|health|logs|metrics|alerts|all]"
            exit 1
            ;;
    esac
}

# Exécution
main "$@"