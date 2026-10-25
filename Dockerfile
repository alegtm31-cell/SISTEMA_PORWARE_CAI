# --- Etapa 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

RUN apk add --no-cache openssl

# Copiar archivos de dependencias y esquema Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias para compilación
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# --- Etapa 2: Entorno de Ejecución Endurecido (Runner) ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Instalar librerías de sistema y wget para healthcheck
RUN apk add --no-cache openssl wget

ENV NODE_ENV=production
ENV PORT=3000

# Copiar definiciones y esquema
COPY package*.json ./
COPY prisma ./prisma/

# Instalar únicamente dependencias de producción y prisma para db push
RUN npm install --omit=dev && npm install prisma

# Copiar cliente generado de Prisma y código compilado
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/dist ./dist

# Seguridad: Asignar permisos al usuario no-root 'node'
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3000

# Healthcheck nativo verificando el estado del backend y conexión a PostgreSQL
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Ejecutar migraciones ligeras y levantar el servidor con node compilado (sin ts-node en prod)
CMD ["sh", "-c", "npx prisma db push && node dist/main"]
