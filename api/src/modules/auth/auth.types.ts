export type AdminJwtPayload = {
  /** id_usuario como string */
  sub: string;
  id: number;
  email: string;
  /** id_rol */
  rol: number;
};

export type AuthUserPublic = {
  id_usuario: number;
  email: string;
  nombres: string;
  apellidos: string;
  id_rol: number;
};

export type LoginResult = {
  accessToken: string;
  expiresIn: string;
  user: AuthUserPublic;
};

export type LoginBody = {
  email: string;
  password: string;
};
