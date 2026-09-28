import { apiDjango } from "../client";
import type { Alerta, Movimiento, Pagina } from "../../types";

export interface NuevoMovimiento {
  insumo: number;
  tipo: "entrada" | "salida" | "ajuste";
  motivo: "venta" | "compra" | "ajuste_manual" | "merma";
  cantidad?: string;
  stock_objetivo?: string;
  referencia?: string;
}

export const inventario = {
  movimientos: (params: Record<string, unknown> = {}) =>
    apiDjango
      .get<Pagina<Movimiento>>("/api/inventario/movimientos/", { params: { page_size: 60, ...params } })
      .then((r) => r.data),

  registrar: (datos: NuevoMovimiento) =>
    apiDjango.post<Movimiento>("/api/inventario/movimientos/", datos).then((r) => r.data),

  alertas: (atendida?: boolean) =>
    apiDjango
      .get<Pagina<Alerta>>("/api/inventario/alertas/", {
        params: { page_size: 100, ...(atendida === undefined ? {} : { atendida }) },
      })
      .then((r) => r.data.results),

  atender: (id: number) =>
    apiDjango.post<Alerta>(`/api/inventario/alertas/${id}/atender/`).then((r) => r.data),
};
