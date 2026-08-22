# ─── Stage 1: Builder (full deps incl. devDeps for nest build) ───
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --ignore-scripts --workspace=server --workspace=@acr/shared
RUN npm install prisma@6 --no-save --ignore-scripts

COPY . .
RUN cd apps/server && npx prisma generate
RUN npm run build --workspace=server

# ─── Stage 2: Runner (production deps only) ───
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --omit=dev --ignore-scripts --workspace=server --workspace=@acr/shared
RUN npm install prisma@6 --no-save --ignore-scripts

# Copy built artifacts + Prisma schema from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY apps/server/prisma ./apps/server/prisma
RUN cd apps/server && npx prisma generate

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3001}/api/v1/health || exit 1

EXPOSE 3001


CMD ["sh", "-c", "echo '🚀 Running Prisma migrations...' && DATABASE_URL=\"${DIRECT_DATABASE_URL:-$DATABASE_URL}\" timeout 120 npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma && echo '✅ Migrations done, starting server...' && exec node apps/server/dist/main.js"]
