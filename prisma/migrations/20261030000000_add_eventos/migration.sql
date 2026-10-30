-- CreateEnum
CREATE TYPE "EstadoEvento" AS ENUM ('BORRADOR', 'ACTIVO', 'CERRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoEventoInvitado" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'REVOCADO');

-- CreateEnum
CREATE TYPE "OrigenEventoInvitado" AS ENUM ('ENLACE', 'ANFITRION', 'GARITA');

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "anfitrionId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "aforo" INTEGER NOT NULL,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT true,
    "estado" "EstadoEvento" NOT NULL DEFAULT 'ACTIVO',
    "codigoActivo" BOOLEAN NOT NULL DEFAULT true,
    "nonceCodigo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventoInvitado" (
    "id" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "invitadoId" TEXT NOT NULL,
    "estado" "EstadoEventoInvitado" NOT NULL DEFAULT 'PENDIENTE',
    "origen" "OrigenEventoInvitado" NOT NULL DEFAULT 'ENLACE',
    "visitaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventoInvitado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evento_anfitrionId_idx" ON "Evento"("anfitrionId");

-- CreateIndex
CREATE INDEX "Evento_estado_idx" ON "Evento"("estado");

-- CreateIndex
CREATE INDEX "Evento_inicio_fin_idx" ON "Evento"("inicio", "fin");

-- CreateIndex
CREATE INDEX "EventoInvitado_eventoId_idx" ON "EventoInvitado"("eventoId");

-- CreateIndex
CREATE INDEX "EventoInvitado_estado_idx" ON "EventoInvitado"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "EventoInvitado_eventoId_invitadoId_key" ON "EventoInvitado"("eventoId", "invitadoId");

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_anfitrionId_fkey" FOREIGN KEY ("anfitrionId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoInvitado" ADD CONSTRAINT "EventoInvitado_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoInvitado" ADD CONSTRAINT "EventoInvitado_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "Invitado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventoInvitado" ADD CONSTRAINT "EventoInvitado_visitaId_fkey" FOREIGN KEY ("visitaId") REFERENCES "Visita"("id") ON DELETE SET NULL ON UPDATE CASCADE;
