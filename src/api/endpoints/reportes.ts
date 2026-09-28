import { apiDjango, apiFastapi } from "../client";
import type {
  ConsumoInsumo,
  LogAuditoria,
  Mesa,
  Pagina,
  PedidoHistorial,
  ProductoVendido,
  Resumen,
  VentaCategoria,
  VentaDiaria,
} from "../../types";

export const reportes = {
  resumen: () => apiDjango.get<Resumen>("/api/reportes/resumen/").then((r) => r.data),

  ventasDiarias: (dias = 14) =>
    apiDjango.get<VentaDiaria[]>("/api/reportes/ventas-diarias/", { params: { dias } }).then((r) => r.data),

  masVendidos: (limite = 8) =>
    apiDjango
      .get<ProductoVendido[]>("/api/reportes/productos-mas-vendidos/", { params: { limite } })
      .then((r) => r.data),

  porCategoria: (dias = 30) =>
    apiDjango
      .get<VentaCategoria[]>("/api/reportes/ventas-por-categoria/", { params: { dias } })
      .then((r) => r.data),

  consumoInsumos: (limite = 8) =>
    apiDjango.get<ConsumoInsumo[]>("/api/reportes/consumo-insumos/", { params: { limite } }).then((r) => r.data),

  historialPedidos: (params: Record<string, unknown> = {}) =>
    apiDjango
      .get<PedidoHistorial[]>("/api/reportes/pedidos/", { params: { limite: 50, ...params } })
      .then((r) => r.data),

  mesas: () => apiFastapi.get<Mesa[]>("/api/v1/mesas").then((r) => r.data),

  auditoria: () =>
    apiDjango
      .get<Pagina<LogAuditoria>>("/api/auditoria/logs/", { params: { page_size: 40 } })
      .then((r) => r.data.results),
};
