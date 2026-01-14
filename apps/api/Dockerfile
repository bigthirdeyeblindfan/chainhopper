# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY packages/types/package.json ./packages/types/
COPY packages/core/package.json ./packages/core/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY packages/types/ ./packages/types/
COPY packages/core/ ./packages/core/
COPY apps/api/ ./apps/api/

# Build packages
RUN npm run build --workspace=@chainhopper/types
RUN npm run build --workspace=@chainhopper/core
RUN npm run build --workspace=@chainhopper/api

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 hono

# Copy built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/core/package.json ./packages/core/
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Install production dependencies only
RUN npm ci --ignore-scripts --omit=dev --workspace=@chainhopper/api

USER hono

EXPOSE 3001

ENV PORT=3001

CMD ["node", "apps/api/dist/index.js"]
