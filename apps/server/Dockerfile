# ─── Stage 1: Build ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY ../../packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=server --workspace=@acr/shared

# Copy source
COPY . .
COPY ../../packages/shared ./packages/shared

# Generate Prisma client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build server
RUN npm run build --workspace=server

# Prune dev dependencies
RUN npm prune --workspace=server --workspace=@acr/shared

# ─── Stage 2: Runner ──────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/package.json ./

# Copy shared package
COPY --from=builder /app/packages/shared/dist ./node_modules/@acr/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@acr/shared/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prisma && node dist/main"]
