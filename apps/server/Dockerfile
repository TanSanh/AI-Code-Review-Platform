FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

# Install production deps only (skip devDeps like turbo, prettier, typescript)
COPY package*.json ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci --omit=dev --ignore-scripts --workspace=server --workspace=@acr/shared
RUN npm install prisma@6 husky --no-save

# Copy source and build
COPY . .
RUN cd apps/server && npx prisma generate
RUN npm run build --workspace=server

# Cleanup dev tools
RUN rm -rf node_modules/husky node_modules/.bin/husky \
    node_modules/.package-lock.json

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/v1/health || exit 1

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/server/prisma/schema.prisma && node apps/server/dist/main.js"]
