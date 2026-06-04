# Stage 1: Build stage
FROM node:20-alpine AS builder

# Install build tools required for compiling native node-gyp packages (like sqlite3)
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy application source
COPY tsconfig.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Prune development dependencies to keep the image lightweight
RUN npm prune --production

# Stage 2: Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy compiled files and production node_modules from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Ensure data and uploads directories exist
RUN mkdir -p /app/data /app/uploads

# Expose port 18273
EXPOSE 18273

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=18273

# Run the server
CMD ["node", "dist/server.js"]
