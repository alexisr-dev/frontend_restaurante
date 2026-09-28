import { create } from "zustand";

import { CLAVE_ACCESO, CLAVE_REFRESCO } from "../api/client";
import { usuarios, type Credenciales } from "../api/endpoints/usuarios";
import type { Usuario } from "../types";

const CLAVE_USUARIO = "sazon.usuario";

interface EstadoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  ingresar: (credenciales: Credenciales) => Promise<void>;
  salir: () => void;
  restaurar: () => Promise<void>;
}

function leerUsuarioGuardado(): Usuario | null {
  const bruto = localStorage.getItem(CLAVE_USUARIO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as Usuario;
  } catch {
    return null;
  }
}

export const useAuth = create<EstadoAuth>((set) => ({
  usuario: leerUsuarioGuardado(),
  cargando: true,

  ingresar: async (credenciales) => {
    const datos = await usuarios.login(credenciales);
    localStorage.setItem(CLAVE_ACCESO, datos.access);
    localStorage.setItem(CLAVE_REFRESCO, datos.refresh);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datos.usuario));
    set({ usuario: datos.usuario });
  },

  salir: () => {
    localStorage.removeItem(CLAVE_ACCESO);
    localStorage.removeItem(CLAVE_REFRESCO);
    localStorage.removeItem(CLAVE_USUARIO);
    set({ usuario: null });
  },

  restaurar: async () => {
    if (!localStorage.getItem(CLAVE_ACCESO)) {
      set({ usuario: null, cargando: false });
      return;
    }
    try {
      const perfil = await usuarios.perfil();
      localStorage.setItem(CLAVE_USUARIO, JSON.stringify(perfil));
      set({ usuario: perfil, cargando: false });
    } catch {
      localStorage.removeItem(CLAVE_ACCESO);
      localStorage.removeItem(CLAVE_REFRESCO);
      localStorage.removeItem(CLAVE_USUARIO);
      set({ usuario: null, cargando: false });
    }
  },
}));
