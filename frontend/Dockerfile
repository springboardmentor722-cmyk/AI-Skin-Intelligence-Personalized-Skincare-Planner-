# ============================================
# GLOW & THRIVE - FRONTEND DOCKERFILE
# ============================================

# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies (handle missing package-lock.json)
RUN npm install --legacy-peer-deps

# Copy all source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Copy public folder
COPY public ./public

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

# Run application
CMD ["serve", "-s", "build", "-l", "3000"]