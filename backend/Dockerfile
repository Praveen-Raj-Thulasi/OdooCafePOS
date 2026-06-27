# Stage 1: Base node image
FROM node:20-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./

# Stage 2: Development Environment (supports nodemon and hot-reloading)
FROM base AS development

# Install all dependencies (including devDependencies)
RUN npm install
# Copy all source files
COPY . .
# Expose default port
EXPOSE 5000
# Run local dev script
CMD ["npm", "run", "dev"]

# Stage 3: Production Builder
FROM base AS builder

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 4: Production Runtime
FROM node:20-alpine AS production
# Set node env to production
ENV NODE_ENV=production
WORKDIR /usr/src/app
# Copy only production dependencies from builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Copy package configuration
COPY package*.json ./
# Copy application source code
COPY server.js ./
COPY registerMock.js ./
COPY seeder.js seedMenu.js seedOrders.js seedHistory.js ./
COPY config/ ./config/
COPY controllers/ ./controllers/
COPY middleware/ ./middleware/
COPY models/ ./models/
COPY routes/ ./routes/
COPY utils/ ./utils/

# Use the pre-existing non-root user "node" for security
USER node

# Expose backend port
EXPOSE 5000

# Set up health check using BusyBox wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/ || exit 1

# Start the application in production mode
CMD ["node", "server.js"]
