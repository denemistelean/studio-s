import type { UsuariosAdminEstado } from '../../generated/prisma/enums';

export type UsuarioAdminPublic = {
  id_usuario: number;
  id_rol: number;
  nombres: string;
  apellidos: string;
  email: string;
  estado: UsuariosAdminEstado;
  ultimo_acceso_en: string | null;
  creado_en: string;
  actualizado_en: string;
};
