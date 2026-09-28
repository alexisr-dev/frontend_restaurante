import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { reportes } from "../../api/endpoints/reportes";
import { Cargando, Etiqueta, Panel, Seleccion, Vacio, fecha, soles } from "../../components/ui";

const TONO: Record<string, "aji" | "chicha" | "limon" | "neutro" | "rocoto"> = {
  pendiente: "aji",
  preparando: "chicha",
  listo: "limon",
  entregado: "neutro",
  cancelado: "rocoto",
};

export default function Pedidos() {
  const [estado, setEstado] = useState("");

  const pedidos = useQuery({
    queryKey: ["historial-pedidos", estado],
    queryFn: () => reportes.historialPedidos(estado ? { estado } : {}),
    refetchInterval: 20000,
  });

  return (
    <Panel
      titulo="Historial de pedidos"
      descripcion="Los pedidos se toman en la app movil; aqui se consultan y auditan."
    >
      <div className="barra-herramientas">
        <Seleccion etiqueta="" value={estado} onChange={(evento) => setEstado(evento.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="preparando">En preparacion</option>
          <option value="listo">Listos</option>
          <option value="entregado">Entregados</option>
          <option value="cancelado">Cancelados</option>
        </Seleccion>
      </div>

      {pedidos.isLoading ? (
        <Cargando texto="Cargando pedidos" />
      ) : (pedidos.data ?? []).length === 0 ? (
        <Vacio
          titulo="No hay pedidos en este filtro"
          mensaje="Cuando un mesero tome un pedido desde la app, aparecera aqui al instante."
        />
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Mesa</th>
                <th>Mesero</th>
                <th className="num">Lineas</th>
                <th className="num">Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(pedidos.data ?? []).map((pedido) => (
                <tr key={pedido.id}>
                  <td>{fecha(pedido.created_at)}</td>
                  <td className="num">{pedido.mesa_numero}</td>
                  <td>{pedido.mesero_nombre}</td>
                  <td className="num">{pedido.lineas}</td>
                  <td className="num">{soles(pedido.total)}</td>
                  <td>
                    <Etiqueta tono={TONO[pedido.estado] ?? "neutro"}>{pedido.estado}</Etiqueta>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
