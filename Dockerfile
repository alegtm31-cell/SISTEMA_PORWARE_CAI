# ==============================================================================
# ETAPA 1: Builder (Compilación de TypeScript, NestJS, Seed JS y Cliente Prisma)
# ==============================================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instalación limpia y determinista de dependencias
RUN npm ci

# Generación de cliente Prisma tipado
RUN npx prisma generate

# Copia del código fuente y compilación a producción (dist/main.js + dist/prisma/seed.js)
COPY . .
RUN npm run build

# ==============================================================================
# ETAPA 2: Runner (Imagen ligera y endurecida para Producción en Node 22 LTS)
# ==============================================================================
FROM node:22-alpine AS runner

# curl para healthchecks de Docker y openssl requerido por el motor de Prisma
RUN apk add --no-cache openssl curl

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma/

# Instalar solo dependencias de producción + CLI de Prisma fijada en 5.22.0 para migrate deploy
RUN npm ci --omit=dev && \
    npm install --no-save prisma@5.22.0 && \
    npx prisma generate && \
    npm cache clean --force && \
    chown -R nestjs:nodejs /app/node_modules

# Copiar artefactos compilados (incluye dist/main.js y dist/prisma/seed.js)
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Cambiar a usuario sin privilegios de root
USER nestjs

EXPOSE 3000

# Healthcheck nativo del contenedor apuntando al endpoint real de salud
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health/live || exit 1

# Aplica migraciones versionadas, ejecuta seed compilado (crea primer admin si BD vacía) e inicia NestJS
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/prisma/seed.js && node dist/main"]
