
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install 

COPY . .

RUN npm run build



FROM node:22-slim


RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev # Instala solo dependencias de producción

COPY --from=builder /app/dist ./dist 

ENV NODE_ENV=production \
    APP_PORT=5000 \
    PORT=8080 

RUN chown -R appuser:appgroup /app || true
    
USER appuser

EXPOSE 8080

CMD ["node", "dist/main"]