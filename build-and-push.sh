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

# Verificar que estamos en una rama válida
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
  echo "❌ Error: No se pudo determinar la rama actual"
  exit 1
fi

# Leer versión actual del package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📋 Current version: ${CURRENT_VERSION}"

# Incrementar versión automáticamente (minor por defecto)
# Acepta parámetro opcional: patch, minor, major
VERSION_TYPE="${1:-minor}"

# Función para incrementar versión
increment_version() {
  local version=$1
  local type=$2
  local major minor patch
  
  IFS='.' read -r major minor patch <<< "$version"
  
  case $type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "❌ Error: Tipo de versión inválido. Usa: patch, minor o major"
      exit 1
      ;;
  esac
  
  echo "${major}.${minor}.${patch}"
}

# Incrementar versión
VERSION=$(increment_version "$CURRENT_VERSION" "$VERSION_TYPE")
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BUILD_TAG="${VERSION}-${TIMESTAMP}"

# Extraer major.minor para el tag (1.0, 1.1, etc.)
MAJOR_MINOR=$(echo "$VERSION" | cut -d. -f1,2)
GIT_TAG="${MAJOR_MINOR}"

echo "🚀 Incrementing version: ${CURRENT_VERSION} → ${VERSION} (${VERSION_TYPE})"
echo "📦 Building backend..."
echo "📋 New version: ${VERSION}"
echo "🏷️  Build tag: ${BUILD_TAG}"
echo "🏷️  Git tag: ${GIT_TAG}"
echo "🌿 Current branch: ${CURRENT_BRANCH}"
echo ""

# Actualizar package.json con la nueva versión
echo "📝 Updating package.json version..."
node -e "
const fs = require('fs');
const pkg = require('./package.json');
pkg.version = '${VERSION}';
fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"
echo "✅ package.json updated to version ${VERSION}"

# Usar version.json local del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$SCRIPT_DIR/version.json"

# Crear o actualizar version.json local
cat > "$VERSION_FILE" <<EOF
{
  "version": "${VERSION}",
  "buildTag": "${BUILD_TAG}",
  "timestamp": "${TIMESTAMP}"
}
EOF
echo "✅ version.json updated"

# Usar BUILD_TAG como IMAGE_TAG
IMAGE_TAG="${BUILD_TAG}"

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

# También taggear como latest
LATEST_TAG="${REGISTRY}/${IMAGE_NAME}:latest"
echo "🏷️  Also tagging as latest..."
docker tag ${FULL_IMAGE_NAME} ${LATEST_TAG}

echo "⬆️  Pushing image to registry..."
docker push ${FULL_IMAGE_NAME}
docker push ${LATEST_TAG}

echo "✅ Backend image uploaded to registry with tag: ${IMAGE_TAG}!"

# Commit, tag y push al final (solo si todo fue bien)
echo ""
echo "📝 Committing changes (package.json + version.json)..."
cd "$SCRIPT_DIR"
if [ -d ".git" ]; then
  # Añadir package.json y version.json al staging
  git add package.json version.json
  
  # Commit con todos los cambios (usando major.minor)
  git commit -m "chore: bump version to ${GIT_TAG} (${VERSION_TYPE})" || {
    echo "⚠️  Warning: No hay cambios para commitear"
  }

  # Crear tag si no existe
  if git rev-parse "$GIT_TAG" >/dev/null 2>&1; then
    echo "⚠️  Warning: El tag ${GIT_TAG} ya existe. Eliminando tag local para recrearlo..."
    git tag -d "${GIT_TAG}" 2>/dev/null || true
  fi
  
  echo "🏷️  Creating git tag: ${GIT_TAG}"
  git tag -a "${GIT_TAG}" -m "Release ${GIT_TAG} - ${TIMESTAMP}"
  
  # Hacer push del commit y tag al remoto
  echo "⬆️  Pushing commit and tag to remote..."
  git push origin HEAD || {
    echo "❌ Error: No se pudo hacer push del commit."
    exit 1
  }
  git push origin "${GIT_TAG}" || {
    echo "❌ Error: No se pudo hacer push del tag."
    exit 1
  }
  echo "✅ Commit and tag pushed successfully!"
else
  echo "⚠️  Warning: No se encontró repositorio git en el proyecto"
fi

echo ""
echo "🎉 All done! Version ${VERSION} deployed successfully!"

