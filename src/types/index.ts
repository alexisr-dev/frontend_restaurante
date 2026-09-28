export type Rol = "mesero" | "cocina" | "admin" | "inventario";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Pagina<T> {
  count: number;
  page: number;
  pages: number;
  page_size: number;
  results: T[];
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  total_productos?: number;
}

export interface LineaReceta {
  id: number;
  producto: number;
  insumo: number;
  insumo_nombre: string;
  unidad_medida: string;
  cantidad_requerida: string;
}

export interface Producto {
  id: number;
  categoria: number | null;
  categoria_nombre: string | null;
  nombre: string;
  descripcion: string | null;
  precio: string;
  activo: boolean;
  receta: LineaReceta[];
}

export interface Insumo {
  id: number;
  nombre: string;
  unidad_medida: string;
  stock_actual: string;
  stock_minimo: string;
  costo_unitario: string;
  activo: boolean;
  en_alerta: boolean;
}

export type TipoMovimiento = "entrada" | "salida" | "ajuste";
export type MotivoMovimiento = "venta" | "compra" | "ajuste_manual" | "merma";

export interface Movimiento {
  id: number;
  insumo: number;
  insumo_nombre: string;
  unidad_medida: string;
  tipo: TipoMovimiento;
  motivo: MotivoMovimiento;
  cantidad: string;
  referencia: string | null;
  usuario_nombre: string | null;
  created_at: string;
}

export interface Alerta {
  id: number;
  insumo: number;
  insumo_nombre: string;
  stock_actual: string;
  stock_minimo: string;
  mensaje: string;
  atendida: boolean;
  created_at: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  activo: boolean;
}

export interface LineaCompra {
  id?: number;
  insumo: number;
  insumo_nombre?: string;
  unidad_medida?: string;
  cantidad: string;
  precio_unitario: string;
  subtotal?: string;
}

export interface Compra {
  id: number;
  proveedor: number;
  proveedor_nombre: string;
  usuario_nombre: string;
  estado: "pendiente" | "recibida" | "cancelada";
  total: string;
  detalles: LineaCompra[];
  created_at: string;
}

export interface Resumen {
  ventas_hoy: string;
  pedidos_hoy: number;
  pedidos_activos: number;
  mesas_ocupadas: number;
  mesas_totales: number;
  insumos_en_alerta: number;
  alertas_pendientes: number;
  productos_activos: number;
}

export interface VentaDiaria {
  dia: string;
  num_pedidos: number;
  total_vendido: string;
}

export interface ProductoVendido {
  id: number;
  nombre: string;
  unidades_vendidas: number;
  ingresos: string;
}

export interface VentaCategoria {
  id: number;
  nombre: string;
  ingresos: string;
  unidades: number;
}

export interface ConsumoInsumo {
  id: number;
  nombre: string;
  total_consumido: string;
}

export interface PedidoHistorial {
  id: string;
  estado: string;
  total: string;
  created_at: string;
  mesa_numero: number;
  mesero_nombre: string;
  lineas: number;
}

export interface Mesa {
  id: number;
  numero: number;
  capacidad: number;
  estado: "libre" | "ocupada" | "reservada";
  pedidos_activos: number;
  total_en_curso: number;
}

export interface LogAuditoria {
  id: number;
  usuario_nombre: string | null;
  accion: string;
  entidad: string;
  entidad_id: string;
  detalle: Record<string, unknown> | null;
  created_at: string;
}
