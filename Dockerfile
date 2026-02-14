# =============================================================================
# Stage 1: Build
# =============================================================================
FROM node:20-bookworm AS build

# Install build tools required for native modules (node-pty, better-sqlite3, bcrypt)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for the build)
RUN npm ci

# Copy source files needed for the build
COPY . .

# Build the Vite frontend
RUN npm run build

# =============================================================================
# Stage 2: Production
# =============================================================================
FROM node:20-bookworm-slim

# Install runtime dependencies
# - git: required for Git operations in the UI
# - python3, make, g++: required for native modules (node-pty, better-sqlite3, bcrypt)
# - curl, bash: required for Claude CLI installation
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    curl \
    bash \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI (Anthropic official CLI)
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install production dependencies only (native modules will be compiled here)
RUN npm ci --omit=dev

# Copy built frontend assets from the build stage
COPY --from=build /app/dist ./dist

# Copy server, shared, and public directories
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/

# Create data directory for SQLite database persistence
# and Claude config directory for authentication
RUN mkdir -p /data /root/.claude

# Environment configuration
ENV DATABASE_PATH=/data/auth.db
ENV PORT=3001

EXPOSE 3001

CMD ["node", "server/index.js"]
