# ==========================================
# SERVER CONFIGURATION
# ==========================================
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# ==========================================
# CORS CONFIGURATION
# ==========================================
# Comma-separated list of allowed origins
CORS_ORIGINS=http://localhost:4200,http://localhost:8100,http://localhost:8080

# ==========================================
# DATABASE CONFIGURATION
# ==========================================
DATABASE_HOST=store.scrum-app.com
DATABASE_PORT=5432
DATABASE_USER=scrum_store
DATABASE_PASSWORD=scrum_store
DATABASE_NAME=scrum_store
# Set to 'true' only in development - NEVER in production!
DATABASE_SYNCHRONIZE=true
# ==========================================
# JWT CONFIGURATION
# ==========================================
# IMPORTANT: Change these secrets in production!
JWT_SECRET=dev-secret-key-change-in-production-12345
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=dev-refresh-token-secret-change-in-production-67890
REFRESH_TOKEN_EXPIRES_IN=7d

# ==========================================
# AWS S3 CONFIGURATION (Future use)
# ==========================================
# Actualmente no se usa - las imágenes se guardan en /images
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=scrum-store-bucket

# ==========================================
# RATE LIMITING
# ==========================================
THROTTLE_TTL=60
THROTTLE_LIMIT=10
