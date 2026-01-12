#!/bin/bash

set -e

IMAGE_NAME="scrum-store-backend"

# Cargar variables del registry desde archivo de configuración
REGISTRY_CONFIG=".docker-registry.env"
if [ ! -f "$REGISTRY_CONFIG" ]; then
  echo "❌ Error: No se encontró el archivo de configuración $REGISTRY_CONFIG"
  echo "Por favor, crea el archivo copiando .docker-registry.env.example y completa tus credenciales"
  exit 1
fi

# Cargar variables del archivo
source "$REGISTRY_CONFIG"

# Verificar que las variables estén definidas
if [ -z "$REGISTRY" ] || [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
  echo "❌ Error: Faltan variables de configuración en $REGISTRY_CONFIG"
  echo "Asegúrate de definir: REGISTRY, USERNAME, PASSWORD"
  exit 1
fi

# Verificar que estamos en un repositorio git
if [ ! -d ".git" ]; then
  echo "❌ Error: No se encontró un repositorio git en este directorio"
  exit 1
fi

# Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Hay cambios sin commitear en el repositorio"
  echo "Por favor, haz commit de todos los cambios antes de hacer deploy"
  git status --short
  exit 1
fi

# Verificar que estamos en una rama válida
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
  echo "❌ Error: No se pudo determinar la rama actual"
  exit 1
fi

# Leer versión del package.json
VERSION=$(node -p "require('./package.json').version")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Si se pasa un argumento, usarlo como tag; si no, usar versión + timestamp
if [ -n "$1" ]; then
  IMAGE_TAG="$1"
  GIT_TAG="backend-${IMAGE_TAG}"
else
  IMAGE_TAG="${VERSION}-${TIMESTAMP}"
  GIT_TAG="backend-${IMAGE_TAG}"
fi

echo "📦 Version from package.json: ${VERSION}"
echo "🏷️  Image tag: ${IMAGE_TAG}"
echo "🌿 Current branch: ${CURRENT_BRANCH}"

# Crear tag en git
if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
  echo "⚠️  Warning: El tag ${GIT_TAG} ya existe. Usando tag existente."
else
  echo "🏷️  Creating git tag: ${GIT_TAG}"
  git tag -a "${GIT_TAG}" -m "Backend deployment ${IMAGE_TAG}"
  
  # Hacer push del tag al remoto
  echo "⬆️  Pushing tag to remote..."
  git push origin "${GIT_TAG}" || {
    echo "⚠️  Warning: No se pudo hacer push del tag. Continuando con el build..."
  }
fi

echo "🔐 Logging into registry..."
echo "$PASSWORD" | docker login $REGISTRY -u $USERNAME --password-stdin

# Construir la imagen con buildx
FULL_IMAGE_NAME="${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
echo "🔨 Building backend image with buildx..."
echo "🏷️  Image: ${FULL_IMAGE_NAME}"

docker buildx build \
  --platform linux/amd64 \
  --build-arg APP_VERSION=${VERSION} \
  -t ${FULL_IMAGE_NAME} \
  --load \
  .

# También taggear como latest si no se pasó tag personalizado
if [ -z "$1" ]; then
  LATEST_TAG="${REGISTRY}/${IMAGE_NAME}:latest"
  echo "🏷️  Also tagging as latest..."
  docker tag ${FULL_IMAGE_NAME} ${LATEST_TAG}
fi

echo "⬆️  Pushing image to registry..."
docker push ${FULL_IMAGE_NAME}

if [ -z "$1" ]; then
  docker push ${LATEST_TAG}
fi

echo "✅ Backend image uploaded to registry with tag: ${IMAGE_TAG}!"

