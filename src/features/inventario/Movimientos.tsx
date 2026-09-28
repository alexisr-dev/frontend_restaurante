import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { mensajeDeError } from "../../api/client";
import { catalogo } from "../../api/endpoints/catalogo";
import { inventario } from "../../api/endpoints/inventario";
import {
  Boton,
  Campo,
  Cargando,
  ErrorCaja,
  Etiqueta,
  Modal,
  Nivel,
  Panel,
  Seleccion,
  Vacio,
  fecha,
  numero,
} from "../../components/ui";
import type { TipoMovimiento } from "../../types";

const TONO_TIPO: Record<TipoMovimiento, "limon" | "rocoto" | "aji"> = {
  entrada: "limon",
  salida: "rocoto",
  ajuste: "aji",
};

export default function Movimientos() {
  const cola = useQueryClient();
  const [tipo, setTipo] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState("");

  const movimientos = useQuery({
    queryKey: ["movimientos", tipo],
    queryFn: () => inventario.movimientos(tipo ? { tipo } : {}),
  });
  const alertas = useQuery({ queryKey: ["alertas", "pendientes"], queryFn: () => inventario.alertas(false) });
  const insumos = useQuery({ queryKey: ["insumos"], queryFn: () => catalogo.insumos() });

  const refrescar = () => {
    void cola.invalidateQueries({ queryKey: ["movimientos"] });
    void cola.invalidateQueries({ queryKey: ["alertas"] });
    void cola.invalidateQueries({ queryKey: ["insumos"] });
    void cola.invalidateQueries({ queryKey: ["resumen"] });
  };

  const registrar = useMutation({
    mutationFn: inventario.registrar,
    onSuccess: () => {
      refrescar();
      setAbierto(false);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const atender = useMutation({ mutationFn: inventario.atender, onSuccess: refrescar });

  return (
    <>
      <Panel
        titulo="Alertas de stock sin atender"
        descripcion="Se generan solas cuando un insumo cae bajo su minimo."
      >
        {alertas.isLoading ? (
          <Cargando />
        ) : (alertas.data ?? []).length === 0 ? (
          <Vacio titulo="Nada urgente" mensaje="Ningun insumo esta por debajo de su minimo ahora mismo." />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th style={{ width: 150 }}>Nivel</th>
                  <th className="num">Stock</th>
                  <th className="num">Minimo</th>
                  <th>Detectada</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(alertas.data ?? []).map((alerta) => (
                  <tr key={alerta.id}>
                    <td>
                      <strong>{alerta.insumo_nombre}</strong>
                    </td>
                    <td>
                      <Nivel actual={Number(alerta.stock_actual)} minimo={Number(alerta.stock_minimo)} />
                    </td>
                    <td className="num">{numero(alerta.stock_actual)}</td>
                    <td className="num">{numero(alerta.stock_minimo)}</td>
                    <td>{fecha(alerta.created_at)}</td>
                    <td>
                      <div className="acciones">
                        <Boton variante="fantasma" onClick={() => atender.mutate(alerta.id)}>
                          Marcar atendida
                        </Boton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel
        titulo="Movimientos de inventario"
        descripcion="Cada venta, compra o ajuste deja su rastro aqui."
        accion={
          <Boton
            onClick={() => {
              setError("");
              setAbierto(true);
            }}
          >
            Registrar movimiento
          </Boton>
        }
      >
        <div className="barra-herramientas">
          <Seleccion etiqueta="" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
            <option value="ajuste">Ajustes</option>
          </Seleccion>
        </div>

        {movimientos.isLoading ? (
          <Cargando />
        ) : (movimientos.data?.results ?? []).length === 0 ? (
          <Vacio titulo="Sin movimientos" mensaje="Los movimientos se crean al vender, comprar o ajustar stock." />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Insumo</th>
                  <th>Tipo</th>
                  <th>Motivo</th>
                  <th className="num">Cantidad</th>
                  <th>Referencia</th>
                  <th>Responsable</th>
                </tr>
              </thead>
              <tbody>
                {(movimientos.data?.results ?? []).map((movimiento) => (
                  <tr key={movimiento.id}>
                    <td>{fecha(movimiento.created_at)}</td>
                    <td>{movimiento.insumo_nombre}</td>
                    <td>
                      <Etiqueta tono={TONO_TIPO[movimiento.tipo]}>{movimiento.tipo}</Etiqueta>
                    </td>
                    <td>{movimiento.motivo.replace("_", " ")}</td>
                    <td className="num">
                      {movimiento.tipo === "salida" ? "−" : "+"}
                      {numero(movimiento.cantidad)} {movimiento.unidad_medida}
                    </td>
                    <td style={{ fontFamily: "var(--dato)", fontSize: 12 }}>{movimiento.referencia ?? "—"}</td>
                    <td>{movimiento.usuario_nombre ?? "sistema"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal abierto={abierto} titulo="Registrar movimiento" onCerrar={() => setAbierto(false)}>
        <FormularioMovimiento
          insumos={insumos.data ?? []}
          error={error}
          guardando={registrar.isPending}
          onGuardar={(datos) => registrar.mutate(datos)}
          onCancelar={() => setAbierto(false)}
        />
      </Modal>
    </>
  );
}

function FormularioMovimiento({
  insumos,
  error,
  guardando,
  onGuardar,
  onCancelar,
}: {
  insumos: { id: number; nombre: string; unidad_medida: string }[];
  error: string;
  guardando: boolean;
  onGuardar: (datos: {
    insumo: number;
    tipo: TipoMovimiento;
    motivo: "compra" | "merma" | "ajuste_manual";
    cantidad?: string;
    stock_objetivo?: string;
    referencia?: string;
  }) => void;
  onCancelar: () => void;
}) {
  const [insumo, setInsumo] = useState("");
  const [tipo, setTipo] = useState<TipoMovimiento>("entrada");
  const [cantidad, setCantidad] = useState("");
  const [referencia, setReferencia] = useState("");

  const motivoPorTipo = { entrada: "compra", salida: "merma", ajuste: "ajuste_manual" } as const;

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    onGuardar({
      insumo: Number(insumo),
      tipo,
      motivo: motivoPorTipo[tipo],
      ...(tipo === "ajuste" ? { stock_objetivo: cantidad } : { cantidad }),
      referencia: referencia || undefined,
    });
  };

  return (
    <form className="formulario" onSubmit={enviar}>
      {error ? <ErrorCaja mensaje={error} /> : null}
      <Seleccion etiqueta="Insumo" value={insumo} onChange={(e) => setInsumo(e.target.value)} required>
        <option value="">Elegir insumo</option>
        {insumos.map((i) => (
          <option key={i.id} value={i.id}>
            {i.nombre} ({i.unidad_medida})
          </option>
        ))}
      </Seleccion>
      <div className="formulario__par">
        <Seleccion etiqueta="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoMovimiento)}>
          <option value="entrada">Entrada (compra directa)</option>
          <option value="salida">Salida (merma)</option>
          <option value="ajuste">Ajuste por conteo</option>
        </Seleccion>
        <Campo
          etiqueta={tipo === "ajuste" ? "Stock contado" : "Cantidad"}
          type="number"
          step="0.001"
          min={tipo === "ajuste" ? "0" : "0.001"}
          required
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
      </div>
      <Campo
        etiqueta="Referencia"
        value={referencia}
        onChange={(e) => setReferencia(e.target.value)}
        placeholder="Guia de remision, nota de merma..."
      />
      <div className="formulario__pie">
        <Boton type="button" variante="contorno" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardando}>
          Registrar
        </Boton>
      </div>
    </form>
  );
}
