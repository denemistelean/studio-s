import type { FastifyInstance } from 'fastify';

export class DashboardService {
  constructor(private readonly app: FastifyInstance) {}

  async resumen() {
    const [
      usuariosTotal,
      usuariosActivos,
      clientasTotal,
      clientasActivas,
      serviciosActivos,
      recompensasActivas,
      canjesSolicitados,
      puntosMovimientosHoy,
      serviciosRealizadosHoy,
    ] = await this.app.prisma.$transaction([
      this.app.prisma.usuariosAdmin.count(),
      this.app.prisma.usuariosAdmin.count({ where: { estado: 'ACTIVO' } }),
      this.app.prisma.clientas.count(),
      this.app.prisma.clientas.count({ where: { estado: 'ACTIVA' } }),
      this.app.prisma.servicios.count({ where: { estado: 'ACTIVO' } }),
      this.app.prisma.recompensas.count({ where: { estado: 'ACTIVA' } }),
      this.app.prisma.canjes_recompensas.count({ where: { estado: 'SOLICITADO' } }),
      this.app.prisma.movimientos_puntos.count({
        where: { creado_en: { gte: startOfUtcDay() } },
      }),
      this.app.prisma.servicios_realizados.count({
        where: {
          estado: 'REGISTRADO',
          realizado_en: { gte: startOfUtcDay() },
        },
      }),
    ]);

    return {
      usuarios_admin: {
        total: usuariosTotal,
        activos: usuariosActivos,
      },
      clientas: {
        total: clientasTotal,
        activas: clientasActivas,
      },
      servicios_activos: serviciosActivos,
      recompensas_activas: recompensasActivas,
      canjes_solicitados: canjesSolicitados,
      hoy: {
        movimientos_puntos: puntosMovimientosHoy,
        servicios_realizados: serviciosRealizadosHoy,
      },
    };
  }
}

function startOfUtcDay(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
