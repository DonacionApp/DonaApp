
FROM node:20-alpine AS builder

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/package-lock.json ./

RUN npm ci

COPY backend/ .

RUN npm run build

RUN npm prune --production

FROM node:20-alpine

RUN apk add --no-cache postgresql-client

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/package*.json ./

ENV NODE_ENV=production \
    APP_PORT=5000

RUN chown -R appuser:appgroup /app || true
    
USER appuser

EXPOSE 5000

# Arranca la app inmediatamente. Cloud Run provee PORT; en local se usará APP_PORT.
CMD ["sh", "-c", "export PORT=${PORT:-${APP_PORT:-5000}}; node dist/main"]