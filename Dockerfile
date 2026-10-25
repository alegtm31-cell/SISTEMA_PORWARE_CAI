# --- Etapa 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copiar archivos de definición de dependencias y schema de Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias completas
RUN npm install

# Generar cliente de Prisma
RUN npx prisma generate

# Copiar código fuente y compilar
COPY . .
RUN npm run build

# --- Etapa 2: Entorno de Ejecución (Runner) ---
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production

# Copiar dependencias y schema
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias de producción, prisma CLI y ts-node para migraciones y seed
RUN npm install --omit=dev && npm install ts-node typescript @types/node prisma


# Copiar cliente de Prisma generado y la compilación dist
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3000

# Inicializa la base de datos con prisma db push, ejecuta el seed de usuarios y levanta el servidor
CMD ["sh", "-c", "npx prisma db push && npm run seed && node dist/main"]
