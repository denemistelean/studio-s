export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: unknown[];
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type AuthUser = {
  id_usuario: number;
  email: string;
  nombres: string;
  apellidos: string;
  id_rol: number;
};

export type Clienta = {
  id_clienta: number;
  public_id: string;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  fecha_nacimiento: string | null;
  puntos_saldo: number;
  estado: 'ACTIVA' | 'INACTIVA' | 'BLOQUEADA';
  creado_en: string;
  actualizado_en: string;
};

export type Servicio = {
  id_servicio: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  puntos_otorgados: number;
  estado: 'ACTIVO' | 'INACTIVO';
  creado_en: string;
  actualizado_en: string;
};

export type ServicioRealizado = {
  id_servicio_realizado: number;
  id_clienta: number;
  id_servicio: number;
  id_usuario_admin: number;
  cantidad: number;
  precio_unitario: string;
  puntos_otorgados: number;
  idempotency_key: string;
  observaciones: string | null;
  estado: 'REGISTRADO' | 'ANULADO';
  realizado_en: string;
  creado_en: string;
};

export type MovimientoPuntos = {
  id_movimiento: number;
  id_clienta: number;
  id_servicio_realizado: number | null;
  id_canje: number | null;
  id_usuario_admin: number | null;
  tipo: 'ACUMULACION' | 'CANJE' | 'AJUSTE_POSITIVO' | 'AJUSTE_NEGATIVO' | 'REVERSO';
  puntos: number;
  saldo_anterior: number;
  saldo_posterior: number;
  descripcion: string | null;
  creado_en: string;
};

export type Recompensa = {
  id_recompensa: number;
  nombre: string;
  descripcion: string | null;
  puntos_requeridos: number;
  stock: number | null;
  limite_por_clienta: number | null;
  estado: 'ACTIVA' | 'INACTIVA';
  creado_en: string;
  actualizado_en: string;
};

export type Canje = {
  id_canje: number;
  id_clienta: number;
  id_recompensa: number;
  id_usuario_admin: number;
  puntos_utilizados: number;
  codigo_canje: string;
  estado: 'SOLICITADO' | 'ENTREGADO' | 'ANULADO';
  solicitado_en: string;
  entregado_en: string | null;
  observaciones: string | null;
};

export type DashboardResumen = {
  usuarios_admin: { total: number; activos: number };
  clientas: { total: number; activas: number };
  servicios_activos: number;
  recompensas_activas: number;
  canjes_solicitados: number;
  hoy: { movimientos_puntos: number; servicios_realizados: number };
};

export type Rol = {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  creado_en: string;
  actualizado_en: string;
  permisos?: { codigo: string; nombre: string; descripcion?: string | null }[];
};

export type UsuarioAdmin = {
  id_usuario: number;
  id_rol: number;
  nombres: string;
  apellidos: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  ultimo_acceso_en?: string | null;
  creado_en?: string;
  actualizado_en?: string;
};

export type AuditoriaItem = {
  id_auditoria: number;
  id_usuario_admin: number | null;
  accion: string;
  tabla_afectada: string | null;
  registro_id: number | null;
  datos_anteriores: unknown;
  datos_nuevos: unknown;
  ip_address: string | null;
  user_agent: string | null;
  creado_en: string;
};
