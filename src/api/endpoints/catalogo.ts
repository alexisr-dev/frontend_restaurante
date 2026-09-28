import { apiDjango } from "../client";
import type { Categoria, Insumo, LineaReceta, Pagina, Producto } from "../../types";

const TODOS = { page_size: 200 };

export const catalogo = {
  categorias: () =>
    apiDjango.get<Pagina<Categoria>>("/api/catalogo/categorias/", { params: TODOS }).then((r) => r.data.results),

  crearCategoria: (datos: Partial<Categoria>) =>
    apiDjango.post<Categoria>("/api/catalogo/categorias/", datos).then((r) => r.data),

  actualizarCategoria: (id: number, datos: Partial<Categoria>) =>
    apiDjango.patch<Categoria>(`/api/catalogo/categorias/${id}/`, datos).then((r) => r.data),

  eliminarCategoria: (id: number) => apiDjango.delete(`/api/catalogo/categorias/${id}/`),

  productos: (busqueda = "") =>
    apiDjango
      .get<Pagina<Producto>>("/api/catalogo/productos/", { params: { ...TODOS, search: busqueda } })
      .then((r) => r.data.results),

  crearProducto: (datos: Partial<Producto>) =>
    apiDjango.post<Producto>("/api/catalogo/productos/", datos).then((r) => r.data),

  actualizarProducto: (id: number, datos: Partial<Producto>) =>
    apiDjango.patch<Producto>(`/api/catalogo/productos/${id}/`, datos).then((r) => r.data),

  eliminarProducto: (id: number) => apiDjango.delete(`/api/catalogo/productos/${id}/`),

  agregarLineaReceta: (productoId: number, datos: { insumo: number; cantidad_requerida: string }) =>
    apiDjango.post<LineaReceta>(`/api/catalogo/productos/${productoId}/receta/`, datos).then((r) => r.data),

  eliminarLineaReceta: (id: number) => apiDjango.delete(`/api/catalogo/recetas/${id}/`),

  insumos: (busqueda = "") =>
    apiDjango
      .get<Pagina<Insumo>>("/api/catalogo/insumos/", { params: { ...TODOS, search: busqueda } })
      .then((r) => r.data.results),

  crearInsumo: (datos: Partial<Insumo>) =>
    apiDjango.post<Insumo>("/api/catalogo/insumos/", datos).then((r) => r.data),

  actualizarInsumo: (id: number, datos: Partial<Insumo>) =>
    apiDjango.patch<Insumo>(`/api/catalogo/insumos/${id}/`, datos).then((r) => r.data),

  eliminarInsumo: (id: number) => apiDjango.delete(`/api/catalogo/insumos/${id}/`),
};
