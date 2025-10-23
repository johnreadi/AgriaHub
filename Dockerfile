# Dockerfile principal pour AgriaHub
# Utilise Docker Compose pour orchestrer les services

FROM docker/compose:latest

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration Docker
COPY docker-compose.yml .
COPY Dockerfile.backend .
COPY Dockerfile.frontend .
COPY .env.example .

# Copier les dossiers source
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY config/ ./config/
COPY scripts/ ./scripts/

# Exposer les ports
EXPOSE 80 443 3306

# Commande par défaut
CMD ["docker-compose", "up", "-d", "--build"]