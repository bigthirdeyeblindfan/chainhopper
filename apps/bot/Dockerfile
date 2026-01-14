# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace package files
COPY packages/types/package.json ./packages/types/
COPY apps/bot/package.json ./apps/bot/

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY packages/types/ ./packages/types/
COPY apps/bot/ ./apps/bot/

# Build packages
RUN npm run build --workspace=@chainhopper/types
RUN npm run build --workspace=@chainhopper/bot

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 grammy

# Copy built artifacts
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/bot/package.json ./apps/bot/
COPY --from=builder /app/apps/bot/dist ./apps/bot/dist

# Install production dependencies only
RUN npm ci --ignore-scripts --omit=dev --workspace=@chainhopper/bot

USER grammy

CMD ["node", "apps/bot/dist/index.js"]
