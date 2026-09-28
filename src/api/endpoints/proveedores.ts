import { apiDjango } from "../client";
import type { Compra, LineaCompra, Pagina, Proveedor } from "../../types";

export const proveedores = {
  listar: () =>
    apiDjango
      .get<Pagina<Proveedor>>("/api/proveedores/proveedores/", { params: { page_size: 200 } })
      .then((r) => r.data.results),

  crear: (datos: Partial<Proveedor>) =>
    apiDjango.post<Proveedor>("/api/proveedores/proveedores/", datos).then((r) => r.data),

  actualizar: (id: number, datos: Partial<Proveedor>) =>
    apiDjango.patch<Proveedor>(`/api/proveedores/proveedores/${id}/`, datos).then((r) => r.data),

  eliminar: (id: number) => apiDjango.delete(`/api/proveedores/proveedores/${id}/`),

  compras: () =>
    apiDjango
      .get<Pagina<Compra>>("/api/proveedores/compras/", { params: { page_size: 60 } })
      .then((r) => r.data.results),

  crearCompra: (datos: { proveedor: number; detalles: LineaCompra[] }) =>
    apiDjango.post<Compra>("/api/proveedores/compras/", datos).then((r) => r.data),

  recibirCompra: (id: number) =>
    apiDjango.post<Compra>(`/api/proveedores/compras/${id}/recibir/`).then((r) => r.data),

  cancelarCompra: (id: number) =>
    apiDjango.post<Compra>(`/api/proveedores/compras/${id}/cancelar/`).then((r) => r.data),
};
