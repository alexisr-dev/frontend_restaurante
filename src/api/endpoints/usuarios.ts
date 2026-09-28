import { apiDjango } from "../client";
import type { Pagina, Rol, Usuario } from "../../types";

export interface Credenciales {
  email: string;
  password: string;
}

export interface RespuestaLogin {
  access: string;
  refresh: string;
  usuario: Usuario;
}

export interface NuevoUsuario {
  nombre: string;
  email: string;
  rol: Rol;
  password?: string;
  activo?: boolean;
}

export const usuarios = {
  login: (credenciales: Credenciales) =>
    apiDjango.post<RespuestaLogin>("/api/auth/login/", credenciales).then((r) => r.data),

  perfil: () => apiDjango.get<Usuario>("/api/auth/perfil/").then((r) => r.data),

  listar: () =>
    apiDjango.get<Pagina<Usuario>>("/api/usuarios/", { params: { page_size: 200 } }).then((r) => r.data.results),

  crear: (datos: NuevoUsuario) => apiDjango.post<Usuario>("/api/usuarios/", datos).then((r) => r.data),

  actualizar: (id: string, datos: Partial<NuevoUsuario>) =>
    apiDjango.patch<Usuario>(`/api/usuarios/${id}/`, datos).then((r) => r.data),

  desactivar: (id: string) => apiDjango.delete(`/api/usuarios/${id}/`),

  activar: (id: string) => apiDjango.post<Usuario>(`/api/usuarios/${id}/activar/`).then((r) => r.data),
};
