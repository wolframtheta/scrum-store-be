# Stage 1: Build
FROM node:24-alpine AS builder

# Build argument for app version
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Verify build output
RUN ls -la dist && echo "Build completed successfully"

# Stage 2: Production
FROM node:24-alpine AS production

# Build argument for app version
ARG APP_VERSION
ENV APP_VERSION=${APP_VERSION}

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy .env file if exists (optional, prefer env vars from docker-compose)
COPY --chown=nestjs:nodejs .env* ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Change ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]

