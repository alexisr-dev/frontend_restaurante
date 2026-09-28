import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { inventario } from "../../api/endpoints/inventario";
import { reportes } from "../../api/endpoints/reportes";
import { Cargando, Etiqueta, Nivel, Panel as Caja, Vacio, numero, soles } from "../../components/ui";
import "./Panel.css";

const PALETA = ["#5B2A86", "#E8A00D", "#6FA80A", "#C42348", "#7C4BAB", "#B07D00"];

function Tarjeta({
  indice,
  rotulo,
  valor,
  pie,
  tono = "neutro",
}: {
  indice: number;
  rotulo: string;
  valor: string;
  pie: string;
  tono?: "neutro" | "chicha" | "aji" | "limon" | "rocoto";
}) {
  return (
    <motion.article
      className="tarjeta"
      data-tono={tono}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: indice * 0.05, ease: [0.32, 0.72, 0, 1] }}
    >
      <p className="tarjeta__rotulo">{rotulo}</p>
      <p className="tarjeta__valor dato">{valor}</p>
      <p className="tarjeta__pie">{pie}</p>
    </motion.article>
  );
}

const diaCorto = (iso: string) =>
  new Date(iso).toLocaleDateString("es-PE", { day: "2-digit", month: "short" });

export default function PanelResumen() {
  const resumen = useQuery({ queryKey: ["resumen"], queryFn: reportes.resumen, refetchInterval: 30000 });
  const ventas = useQuery({ queryKey: ["ventas-diarias"], queryFn: () => reportes.ventasDiarias(14) });
  const top = useQuery({ queryKey: ["mas-vendidos"], queryFn: () => reportes.masVendidos(6) });
  const categorias = useQuery({ queryKey: ["por-categoria"], queryFn: () => reportes.porCategoria(30) });
  const stockBajo = useQuery({ queryKey: ["alertas", "resumen"], queryFn: () => reportes.consumoInsumos(6) });
  const insumosBajos = useQuery({
    queryKey: ["alertas", "pendientes"],
    queryFn: () => inventario.alertas(false),
    refetchInterval: 30000,
  });

  if (resumen.isLoading) return <Cargando texto="Reuniendo los numeros del dia" />;

  const d = resumen.data;
  const serieVentas = (ventas.data ?? []).map((fila) => ({
    dia: diaCorto(fila.dia),
    total: Number(fila.total_vendido),
    pedidos: fila.num_pedidos,
  }));

  return (
    <>
      <div className="tarjetas">
        <Tarjeta indice={0} rotulo="Ventas de hoy" valor={soles(d?.ventas_hoy ?? 0)} pie={`${d?.pedidos_hoy ?? 0} pedidos registrados`} tono="chicha" />
        <Tarjeta indice={1} rotulo="Pedidos en curso" valor={String(d?.pedidos_activos ?? 0)} pie="pendientes o en preparacion" tono="aji" />
        <Tarjeta indice={2} rotulo="Mesas ocupadas" valor={`${d?.mesas_ocupadas ?? 0}/${d?.mesas_totales ?? 0}`} pie="del salon" tono="limon" />
        <Tarjeta
          indice={3}
          rotulo="Insumos bajo minimo"
          valor={String(d?.insumos_en_alerta ?? 0)}
          pie={`${d?.alertas_pendientes ?? 0} alertas sin atender`}
          tono={d && d.insumos_en_alerta > 0 ? "rocoto" : "neutro"}
        />
      </div>

      <div className="rejilla">
        <Caja titulo="Ventas de los ultimos 14 dias" descripcion="Solo pedidos entregados" ancho="completo">
          {serieVentas.length === 0 ? (
            <Vacio titulo="Aun no hay ventas cerradas" mensaje="Los pedidos aparecen aqui cuando se marcan como entregados." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={serieVentas} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,27,46,0.09)" vertical={false} />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: "rgba(26,27,46,0.55)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "rgba(26,27,46,0.55)" }} tickLine={false} axisLine={false} width={64} />
                <Tooltip
                  formatter={(valor) => soles(Number(valor ?? 0))}
                  contentStyle={{ borderRadius: 10, border: "1px solid rgba(26,27,46,0.12)", fontSize: 13 }}
                />
                <Line type="monotone" dataKey="total" stroke="#5B2A86" strokeWidth={2.5} dot={{ r: 3, fill: "#5B2A86" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Caja>

        <Caja titulo="Los mas pedidos" descripcion="Unidades vendidas historicas">
          {(top.data ?? []).length === 0 ? (
            <Vacio titulo="Sin datos todavia" mensaje="Cuando se entreguen pedidos, el ranking se arma solo." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={top.data} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" width={120} tick={{ fontSize: 12, fill: "rgba(26,27,46,0.7)" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid rgba(26,27,46,0.12)", fontSize: 13 }} />
                <Bar dataKey="unidades_vendidas" name="Unidades" radius={[0, 6, 6, 0]}>
                  {(top.data ?? []).map((_, i) => (
                    <Cell key={i} fill={PALETA[i % PALETA.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Caja>

        <Caja titulo="Ingresos por categoria" descripcion="Ultimos 30 dias">
          {(categorias.data ?? []).length === 0 ? (
            <Vacio titulo="Sin ingresos en el periodo" mensaje="Registra ventas para comparar categorias." />
          ) : (
            <ul className="listado">
              {(categorias.data ?? []).map((fila, i) => {
                const mayor = Math.max(...(categorias.data ?? []).map((f) => Number(f.ingresos)));
                return (
                  <li key={fila.id} className="listado__fila">
                    <span className="listado__nombre">{fila.nombre}</span>
                    <span className="listado__barra">
                      <motion.span
                        className="listado__pulso"
                        style={{ background: PALETA[i % PALETA.length] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(Number(fila.ingresos) / mayor) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.06, ease: [0.32, 0.72, 0, 1] }}
                      />
                    </span>
                    <span className="listado__valor dato">{soles(fila.ingresos)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Caja>

        <Caja titulo="Alertas de stock" descripcion="Insumos por debajo del minimo">
          {(insumosBajos.data ?? []).length === 0 ? (
            <Vacio titulo="Todo el almacen esta sobre el minimo" mensaje="No hay nada urgente que reponer." />
          ) : (
            <ul className="alertas">
              {(insumosBajos.data ?? []).map((alerta) => (
                <li key={alerta.id} className="alertas__fila">
                  <div className="crecer">
                    <p className="alertas__nombre">{alerta.insumo_nombre}</p>
                    <Nivel actual={Number(alerta.stock_actual)} minimo={Number(alerta.stock_minimo)} />
                  </div>
                  <Etiqueta tono="rocoto">
                    {numero(alerta.stock_actual)} / {numero(alerta.stock_minimo)}
                  </Etiqueta>
                </li>
              ))}
            </ul>
          )}
        </Caja>

        <Caja titulo="Insumos mas consumidos" descripcion="Salidas acumuladas">
          {(stockBajo.data ?? []).length === 0 ? (
            <Vacio titulo="Sin consumo registrado" mensaje="El consumo se calcula desde los movimientos de salida." />
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Insumo</th>
                    <th className="num">Consumido</th>
                  </tr>
                </thead>
                <tbody>
                  {(stockBajo.data ?? []).map((fila) => (
                    <tr key={fila.id}>
                      <td>{fila.nombre}</td>
                      <td className="num">{numero(fila.total_consumido)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Caja>
      </div>
    </>
  );
}
