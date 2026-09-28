import axios, { AxiosError, type AxiosInstance } from "axios";

const DJANGO = import.meta.env.VITE_API_DJANGO ?? "http://localhost:8010";
const FASTAPI = import.meta.env.VITE_API_FASTAPI ?? "http://localhost:8011";

export const CLAVE_ACCESO = "sazon.access";
export const CLAVE_REFRESCO = "sazon.refresh";

function crear(baseURL: string): AxiosInstance {
  const instancia = axios.create({ baseURL, timeout: 15000 });

  instancia.interceptors.request.use((config) => {
    const token = localStorage.getItem(CLAVE_ACCESO);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instancia.interceptors.response.use(
    (respuesta) => respuesta,
    async (error: AxiosError) => {
      const original = error.config as (typeof error.config & { _reintentado?: boolean }) | undefined;

      if (error.response?.status === 401 && original && !original._reintentado) {
        original._reintentado = true;
        const renovado = await renovarToken();
        if (renovado) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${renovado}`;
          return instancia.request(original);
        }
        cerrarSesionLocal();
      }

      return Promise.reject(error);
    },
  );

  return instancia;
}

export const apiDjango = crear(DJANGO);
export const apiFastapi = crear(FASTAPI);

let renovacionEnCurso: Promise<string | null> | null = null;

async function renovarToken(): Promise<string | null> {
  const refresh = localStorage.getItem(CLAVE_REFRESCO);
  if (!refresh) return null;

  if (!renovacionEnCurso) {
    renovacionEnCurso = axios
      .post<{ access: string }>(`${DJANGO}/api/auth/refresh/`, { refresh })
      .then(({ data }) => {
        localStorage.setItem(CLAVE_ACCESO, data.access);
        return data.access;
      })
      .catch(() => null)
      .finally(() => {
        renovacionEnCurso = null;
      });
  }

  return renovacionEnCurso;
}

export function cerrarSesionLocal() {
  localStorage.removeItem(CLAVE_ACCESO);
  localStorage.removeItem(CLAVE_REFRESCO);
  if (!window.location.pathname.startsWith("/ingresar")) {
    window.location.href = "/ingresar";
  }
}

export function mensajeDeError(error: unknown, respaldo = "Algo salio mal."): string {
  if (axios.isAxiosError(error)) {
    const datos = error.response?.data as
      | { detail?: string; errors?: Record<string, string[]> }
      | undefined;

    if (datos?.errors) {
      const primero = Object.entries(datos.errors)[0];
      if (primero) return `${primero[0]}: ${primero[1]}`;
    }
    if (datos?.detail) return datos.detail;
    if (!error.response) return "No hay conexion con el servidor.";
  }
  return respaldo;
}

export const urlWebsocket = (canal: string, token: string) =>
  `${FASTAPI.replace(/^http/, "ws")}/api/v1/ws/${canal}?token=${encodeURIComponent(token)}`;
