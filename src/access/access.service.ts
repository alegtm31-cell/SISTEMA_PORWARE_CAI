import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { verifyQrPassToken } from '../common/utils/qr-pass.util';

@Injectable()
export class AccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async registerAccess(
    targetId: string,
    isGuest: boolean,
    tipo: 'ENTRADA' | 'SALIDA',
    observacion?: string,
    registradoPorId?: string,
    qrToken?: string,
  ) {
    const rawTarget = (targetId || '').trim();
    if (rawTarget.startsWith('CAI-EVT:') || qrToken?.trim().startsWith('CAI-EVT:')) {
      await this.auditoriaService.registrar({
        usuarioId: registradoPorId,
        accion: 'ACCESO_DENEGADO_TOKEN_EVENTO_EN_GARITA',
        entidad: 'Evento',
        detalles: { motivo: 'Intento de usar enlace compartido CAI-EVT como pase de garita' },
      });
      throw new ForbiddenException(
        '⛔ El código compartido de evento (CAI-EVT) solo sirve para solicitar unirse al evento y NO autoriza el ingreso en garita.',
      );
    }

    const tokenCandidate = qrToken?.trim().startsWith('CAI2:')
      ? qrToken.trim()
      : rawTarget.startsWith('CAI2:')
      ? rawTarget
      : undefined;

    let verifiedVisitaId: string | undefined;
    let cleanId = rawTarget;

    // Validación criptográfica HMAC-SHA256 en el servidor si se presenta pase QR
    if (tokenCandidate) {
      const qrResult = verifyQrPassToken(tokenCandidate);
      if (!qrResult.isValidSignature) {
        await this.auditoriaService.registrar({
          usuarioId: registradoPorId,
          accion: 'ACCESO_DENEGADO_QR_ADULTERADO',
          entidad: 'Visita',
          detalles: { error: qrResult.error },
        });
        throw new ForbiddenException(`⛔ SEGURIDAD: ${qrResult.error}`);
      }

      if (qrResult.isExpired && tipo === 'ENTRADA') {
        await this.auditoriaService.registrar({
          usuarioId: registradoPorId,
          accion: 'ACCESO_DENEGADO_QR_EXPIRADO',
          entidad: 'Visita',
          entidadId: qrResult.payload?.visitaId,
          detalles: { cedula: qrResult.payload?.c, vigencia: qrResult.payload?.v },
        });
        throw new ForbiddenException(`⛔ PASE EXPIRADO: ${qrResult.error}`);
      }

      verifiedVisitaId = qrResult.payload?.visitaId;
      cleanId = qrResult.payload?.invitadoId || qrResult.payload?.c || rawTarget;
      isGuest = true;
    }

    // Atomicidad: Nivel Serializable para prevenir condiciones de carrera en Anti-Passback bajo alta concurrencia
    return this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        if (isGuest) {
          // Buscar invitado por ID o por Cédula
          const guest = await tx.invitado.findFirst({
            where: {
              OR: [
                { id: cleanId },
                { cedula: { equals: cleanId, mode: 'insensitive' } },
              ],
            },
          });

          if (!guest || guest.eliminado) {
            throw new NotFoundException(`Invitado con identificación '${cleanId}' no encontrado o dado de baja`);
          }

          // Regla 1: Control de Bloqueo persistido en base de datos
          if (guest.bloqueado && tipo === 'ENTRADA') {
            await this.auditoriaService.registrar({
              usuarioId: registradoPorId,
              accion: 'ACCESO_DENEGADO_BLOQUEO',
              entidad: 'Invitado',
              entidadId: guest.id,
              detalles: { cedula: guest.cedula, motivo: guest.motivoBloqueo },
            });
            throw new ForbiddenException(
              `⛔ Acceso BLOQUEADO para el visitante ${guest.nombre} ${guest.apellido}. Motivo: ${guest.motivoBloqueo || 'Restricción de ingreso vigente.'}`,
            );
          }

          // Regla 1.b: Validar la visita vigente en la tabla Visita (por QR o por cédula)
          let linkedVisitaId: string | null = null;
          if (verifiedVisitaId) {
            const visita = await tx.visita.findUnique({
              where: { id: verifiedVisitaId },
            });

            if (!visita || visita.invitadoId !== guest.id) {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_SIN_VISITA',
                entidad: 'Invitado',
                entidadId: guest.id,
                detalles: { cedula: guest.cedula, visitaId: verifiedVisitaId, motivo: 'Visita inexistente o no asociada' },
              });
              throw new ForbiddenException(
                '⛔ Sin visita autorizada vigente: el pase QR no corresponde a una visita registrada en el servidor.',
              );
            }

            if (tipo === 'ENTRADA') {
              if (visita.estado !== 'AUTORIZADA') {
                await this.auditoriaService.registrar({
                  usuarioId: registradoPorId,
                  accion: 'ACCESO_DENEGADO_VISITA_NO_AUTORIZADA',
                  entidad: 'Visita',
                  entidadId: visita.id,
                  detalles: { invitadoId: guest.id, cedula: guest.cedula, estadoVisita: visita.estado },
                });
                throw new ForbiddenException(
                  `⛔ Sin visita autorizada vigente: la visita asociada a este pase fue ${visita.estado.toLowerCase()} por el anfitrión.`,
                );
              }
              if (visita.fechaExpiracion && new Date(visita.fechaExpiracion).getTime() < Date.now()) {
                await this.auditoriaService.registrar({
                  usuarioId: registradoPorId,
                  accion: 'ACCESO_DENEGADO_VISITA_EXPIRADA',
                  entidad: 'Visita',
                  entidadId: visita.id,
                  detalles: { invitadoId: guest.id, cedula: guest.cedula, fechaExpiracion: visita.fechaExpiracion },
                });
                throw new ForbiddenException(
                  '⛔ Sin visita autorizada vigente: la vigencia de la visita en el servidor ha expirado.',
                );
              }
            }
            linkedVisitaId = visita.id;
          } else if (tipo === 'ENTRADA') {
            const latestVisita = await tx.visita.findFirst({
              where: { invitadoId: guest.id },
              orderBy: { createdAt: 'desc' },
            });

            if (!latestVisita) {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_SIN_VISITA',
                entidad: 'Invitado',
                entidadId: guest.id,
                detalles: { cedula: guest.cedula, motivo: 'Invitado sin ninguna Visita registrada' },
              });
              throw new ForbiddenException('⛔ Sin visita autorizada vigente para el visitante.');
            }

            if (latestVisita.estado !== 'AUTORIZADA') {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_VISITA_NO_AUTORIZADA',
                entidad: 'Visita',
                entidadId: latestVisita.id,
                detalles: { invitadoId: guest.id, cedula: guest.cedula, estadoVisita: latestVisita.estado },
              });
              throw new ForbiddenException(
                `⛔ Sin visita autorizada vigente: la visita del invitado se encuentra ${latestVisita.estado.toLowerCase()}.`,
              );
            }

            if (latestVisita.fechaExpiracion && new Date(latestVisita.fechaExpiracion).getTime() < Date.now()) {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_VISITA_EXPIRADA',
                entidad: 'Visita',
                entidadId: latestVisita.id,
                detalles: { invitadoId: guest.id, cedula: guest.cedula, fechaExpiracion: latestVisita.fechaExpiracion },
              });
              throw new ForbiddenException(
                '⛔ Sin visita autorizada vigente: el pase de visita del invitado ha vencido. Solicite renovación al anfitrión.',
              );
            }

            linkedVisitaId = latestVisita.id;
          }

          // Regla 2: Anti-Passback atómico para Visitantes
          const lastMove = await tx.historial.findFirst({
            where: { invitadoId: guest.id },
            orderBy: { timestamp: 'desc' },
          });

          if (lastMove) {
            if (lastMove.tipo === 'ENTRADA' && tipo === 'ENTRADA') {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_ANTIPASSBACK',
                entidad: 'Invitado',
                entidadId: guest.id,
                detalles: { cedula: guest.cedula, tipoIntento: 'DOBLE_ENTRADA' },
              });
              throw new BadRequestException(
                `Anti-Passback: El visitante ${guest.nombre} ${guest.apellido} ya tiene una ENTRADA registrada sin salida previa.`,
              );
            }
            if (lastMove.tipo === 'SALIDA' && tipo === 'SALIDA') {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_ANTIPASSBACK',
                entidad: 'Invitado',
                entidadId: guest.id,
                detalles: { cedula: guest.cedula, tipoIntento: 'DOBLE_SALIDA' },
              });
              throw new BadRequestException(
                `Anti-Passback: El visitante ${guest.nombre} ${guest.apellido} ya se encuentra fuera de las instalaciones.`,
              );
            }
          } else if (tipo === 'SALIDA') {
            throw new BadRequestException(
              `No se puede registrar SALIDA para el visitante ${guest.nombre} ${guest.apellido} sin una ENTRADA previa registrada.`,
            );
          }

          if (tipo === 'SALIDA' && linkedVisitaId) {
            await tx.visita.update({
              where: { id: linkedVisitaId },
              data: { estado: 'FINALIZADA' },
            });
          }

          return tx.historial.create({
            data: {
              invitadoId: guest.id,
              visitaId: linkedVisitaId,
              tipo,
              observacion: observacion || null,
              registradoPorId: registradoPorId || null,
            },
            include: {
              registradoPor: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  rol: true,
                },
              },
              invitado: {
                include: {
                  empleado: {
                    select: {
                      nombre: true,
                      apellido: true,
                      email: true,
                    },
                  },
                },
              },
            },
          });
        } else {
          // Buscar usuario/empleado por ID o por Cédula
          const user = await tx.usuario.findFirst({
            where: {
              OR: [
                { id: cleanId },
                { cedula: { equals: cleanId, mode: 'insensitive' } },
              ],
            },
          });

          if (!user) {
            throw new NotFoundException(`Usuario/Empleado con identificación '${cleanId}' no encontrado`);
          }

          // Regla 1: Control de Bloqueo persistido en base de datos
          if (user.bloqueado && tipo === 'ENTRADA') {
            await this.auditoriaService.registrar({
              usuarioId: registradoPorId,
              accion: 'ACCESO_DENEGADO_BLOQUEO',
              entidad: 'Usuario',
              entidadId: user.id,
              detalles: { cedula: user.cedula, motivo: user.motivoBloqueo },
            });
            throw new ForbiddenException(
              `⛔ Acceso BLOQUEADO para ${user.nombre} ${user.apellido}. Motivo: ${user.motivoBloqueo || 'Desincorporado o restringido por Recursos Humanos.'}`,
            );
          }

          // Regla 2: Anti-Passback atómico para Personal Interno
          const lastMove = await tx.historial.findFirst({
            where: { usuarioId: user.id },
            orderBy: { timestamp: 'desc' },
          });

          if (lastMove) {
            if (lastMove.tipo === 'ENTRADA' && tipo === 'ENTRADA') {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_ANTIPASSBACK',
                entidad: 'Usuario',
                entidadId: user.id,
                detalles: { cedula: user.cedula, tipoIntento: 'DOBLE_ENTRADA' },
              });
              throw new BadRequestException(
                `Anti-Passback: ${user.nombre} ${user.apellido} ya tiene una ENTRADA registrada sin salida previa.`,
              );
            }
            if (lastMove.tipo === 'SALIDA' && tipo === 'SALIDA') {
              await this.auditoriaService.registrar({
                usuarioId: registradoPorId,
                accion: 'ACCESO_DENEGADO_ANTIPASSBACK',
                entidad: 'Usuario',
                entidadId: user.id,
                detalles: { cedula: user.cedula, tipoIntento: 'DOBLE_SALIDA' },
              });
              throw new BadRequestException(
                `Anti-Passback: ${user.nombre} ${user.apellido} ya se encuentra fuera de las instalaciones.`,
              );
            }
          } else if (tipo === 'SALIDA') {
            throw new BadRequestException(
              `No se puede registrar SALIDA para ${user.nombre} ${user.apellido} sin una ENTRADA previa registrada.`,
            );
          }

          return tx.historial.create({
            data: {
              usuarioId: user.id,
              tipo,
              observacion: observacion || null,
              registradoPorId: registradoPorId || null,
            },
            include: {
              registradoPor: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  rol: true,
                },
              },
              usuario: {
                select: {
                  id: true,
                  cedula: true,
                  nombre: true,
                  apellido: true,
                  rol: true,
                },
              },
            },
          });
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async lookupPersona(identificacion: string, operadorId?: string) {
    const raw = (identificacion || '').trim();
    if (!raw) {
      throw new NotFoundException('Identificación vacía');
    }

    if (raw.startsWith('CAI-EVT:')) {
      await this.auditoriaService.registrar({
        usuarioId: operadorId,
        accion: 'LOOKUP_TOKEN_EVENTO_EN_GARITA',
        entidad: 'Evento',
        detalles: { motivo: 'Intento de escanear enlace compartido CAI-EVT en garita' },
      });
      throw new ForbiddenException(
        '⛔ El código compartido de evento (CAI-EVT) solo sirve para solicitar unirse al evento y NO autoriza el ingreso en garita.',
      );
    }

    let cleanId = raw;
    let qrMeta: {
      isSignedPass: boolean;
      visitaId?: string;
      vigencia?: string;
      placa?: string;
    } = { isSignedPass: false };

    if (raw.startsWith('CAI2:')) {
      const qrCheck = verifyQrPassToken(raw);
      if (!qrCheck.isValidSignature) {
        await this.auditoriaService.registrar({
          usuarioId: operadorId,
          accion: 'LOOKUP_QR_ADULTERADO',
          entidad: 'Visita',
          detalles: { error: qrCheck.error },
        });
        throw new ForbiddenException(`⛔ SEGURIDAD: ${qrCheck.error}`);
      }

      if (qrCheck.isExpired) {
        await this.auditoriaService.registrar({
          usuarioId: operadorId,
          accion: 'LOOKUP_QR_EXPIRADO',
          entidad: 'Visita',
          entidadId: qrCheck.payload?.visitaId,
          detalles: { cedula: qrCheck.payload?.c, vigencia: qrCheck.payload?.v },
        });
        throw new ForbiddenException(`⛔ PASE DIGITAL EXPIRADO: ${qrCheck.error}`);
      }

      if (qrCheck.payload?.visitaId) {
        const visita = await this.prisma.visita.findUnique({
          where: { id: qrCheck.payload.visitaId },
        });
        if (!visita) {
          throw new ForbiddenException('⛔ El pase QR no corresponde a ninguna visita válida en el servidor.');
        }
        if (visita.estado === 'CANCELADA' || visita.estado === 'DENEGADA') {
          throw new ForbiddenException(`⛔ La visita asociada a este pase fue ${visita.estado.toLowerCase()}.`);
        }
        if (visita.fechaExpiracion && new Date(visita.fechaExpiracion).getTime() < Date.now()) {
          throw new ForbiddenException('⛔ La visita asociada a este pase QR ha expirado en el servidor.');
        }
      }

      cleanId = qrCheck.payload?.invitadoId || qrCheck.payload?.c || raw;
      qrMeta = {
        isSignedPass: true,
        visitaId: qrCheck.payload?.visitaId,
        vigencia: qrCheck.payload?.v?.slice(0, 10),
        placa: qrCheck.payload?.p,
      };
    }

    // Normalización de cédula con o sin prefijo V-, E-, etc.
    const rawNumber = cleanId.replace(/^[VEJGPvejgp]-?/, '');
    const variants = [
      cleanId,
      rawNumber,
      `V-${rawNumber}`,
      `E-${rawNumber}`,
      `J-${rawNumber}`,
    ];

    // 1. Buscar en Usuario (Personal interno) si no es un pase QR de visitante
    if (!qrMeta.isSignedPass) {
      const user = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { id: cleanId },
            { cedula: { in: variants, mode: 'insensitive' } },
          ],
        },
      });

      if (user) {
        const lastMove = await this.prisma.historial.findFirst({
          where: { usuarioId: user.id },
          orderBy: { timestamp: 'desc' },
        });
        const estaDentro = lastMove?.tipo === 'ENTRADA';

        return {
          id: user.id,
          cedula: user.cedula,
          nombre: user.nombre,
          apellido: user.apellido,
          rol: user.rol,
          isGuest: false,
          empresa: 'Personal Interno',
          fotoUrl: user.fotoUrl,
          bloqueado: user.bloqueado,
          motivoBloqueo: user.motivoBloqueo,
          estadoSeguridad: user.bloqueado ? 'BLOQUEADO' : 'AUTORIZADO',
          estaDentro,
          ultimoRegistro: lastMove,
        };
      }
    }

    // 2. Buscar en Invitado (Visitantes)
    const guest = await this.prisma.invitado.findFirst({
      where: {
        eliminado: false,
        OR: [
          { id: cleanId },
          { cedula: { in: variants, mode: 'insensitive' } },
        ],
      },
      include: {
        empleado: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        visitas: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (guest) {
      const lastMove = await this.prisma.historial.findFirst({
        where: { invitadoId: guest.id },
        orderBy: { timestamp: 'desc' },
      });
      const estaDentro = lastMove?.tipo === 'ENTRADA';
      const latestVisita = Array.isArray(guest.visitas) ? guest.visitas[0] : undefined;

      return {
        id: guest.id,
        cedula: guest.cedula,
        nombre: guest.nombre,
        apellido: guest.apellido,
        rol: 'VISITANTE',
        isGuest: true,
        empresa: guest.empresa || 'Particular',
        placa: qrMeta.placa || guest.placa || undefined,
        fotoUrl: guest.fotoUrl,
        empleadoAnfitrion: guest.empleado ? `${guest.empleado.nombre} ${guest.empleado.apellido}` : undefined,
        bloqueado: guest.bloqueado,
        motivoBloqueo: guest.motivoBloqueo,
        estadoSeguridad: guest.bloqueado ? 'BLOQUEADO' : 'AUTORIZADO',
        estaDentro,
        ultimoRegistro: lastMove,
        paseFirmado: qrMeta.isSignedPass,
        visitaId: qrMeta.visitaId || latestVisita?.id,
        vigenciaHasta: qrMeta.vigencia || (latestVisita?.fechaExpiracion ? new Date(latestVisita.fechaExpiracion).toISOString().slice(0, 10) : undefined),
      };
    }

    throw new NotFoundException(`No se encontró ningún empleado ni visitante activo con la identificación '${cleanId}'`);
  }
}
