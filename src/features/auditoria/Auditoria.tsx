import { useQuery } from "@tanstack/react-query";

import { reportes } from "../../api/endpoints/reportes";
import { Cargando, Etiqueta, Panel, Vacio, fecha } from "../../components/ui";

const TONO: Record<string, "limon" | "chicha" | "rocoto" | "neutro"> = {
  CREATE: "limon",
  UPDATE: "chicha",
  DELETE: "rocoto",
};

export default function Auditoria() {
  const logs = useQuery({ queryKey: ["auditoria"], queryFn: reportes.auditoria });

  return (
    <Panel
      titulo="Registro de auditoria"
      descripcion="Cada operacion de escritura queda registrada con su autor y su codigo de peticion."
    >
      {logs.isLoading ? (
        <Cargando />
      ) : (logs.data ?? []).length === 0 ? (
        <Vacio titulo="Sin actividad registrada" mensaje="Las creaciones, ediciones y bajas apareceran aqui." />
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Responsable</th>
                <th>Accion</th>
                <th>Entidad</th>
                <th>Referencia</th>
                <th>Peticion</th>
              </tr>
            </thead>
            <tbody>
              {(logs.data ?? []).map((log) => (
                <tr key={log.id}>
                  <td>{fecha(log.created_at)}</td>
                  <td>{log.usuario_nombre ?? "sistema"}</td>
                  <td>
                    <Etiqueta tono={TONO[log.accion] ?? "neutro"}>{log.accion}</Etiqueta>
                  </td>
                  <td>{log.entidad}</td>
                  <td className="dato" style={{ fontSize: 12 }}>
                    {log.entidad_id}
                  </td>
                  <td className="dato" style={{ fontSize: 11, color: "var(--tinta-45)" }}>
                    {String((log.detalle as { request_id?: string })?.request_id ?? "—").slice(0, 8)}
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
