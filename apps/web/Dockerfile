# ─── Stage 1: Install dependencies ────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --workspace=web --workspace=@acr/shared

# ─── Stage 2: Build ────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source
COPY . .

# Generate shared package
RUN cd packages/shared && npm run build

# Build Next.js
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── Stage 3: Runner ──────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy standalone output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

EXPOSE 3000

CMD ["node", "server.js"]
