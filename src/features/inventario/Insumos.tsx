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
  numero,
  soles,
} from "../../components/ui";
import type { Insumo } from "../../types";

const VACIO = { nombre: "", unidad_medida: "kg", stock_minimo: "", costo_unitario: "" };

export default function Insumos() {
  const cola = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Insumo | null>(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [ajustando, setAjustando] = useState<Insumo | null>(null);
  const [error, setError] = useState("");

  const insumos = useQuery({ queryKey: ["insumos", busqueda], queryFn: () => catalogo.insumos(busqueda) });

  const refrescar = () => {
    void cola.invalidateQueries({ queryKey: ["insumos"] });
    void cola.invalidateQueries({ queryKey: ["alertas"] });
    void cola.invalidateQueries({ queryKey: ["resumen"] });
  };

  const guardar = useMutation({
    mutationFn: (datos: Record<string, unknown>) =>
      editando ? catalogo.actualizarInsumo(editando.id, datos) : catalogo.crearInsumo(datos),
    onSuccess: () => {
      refrescar();
      setAbierto(false);
      setEditando(null);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const ajustar = useMutation({
    mutationFn: (datos: { insumo: number; stock_objetivo: string }) =>
      inventario.registrar({
        insumo: datos.insumo,
        tipo: "ajuste",
        motivo: "ajuste_manual",
        stock_objetivo: datos.stock_objetivo,
        referencia: "ajuste desde el panel",
      }),
    onSuccess: () => {
      refrescar();
      void cola.invalidateQueries({ queryKey: ["movimientos"] });
      setAjustando(null);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const abrir = (insumo?: Insumo) => {
    setError("");
    setEditando(insumo ?? null);
    setFormulario(
      insumo
        ? {
            nombre: insumo.nombre,
            unidad_medida: insumo.unidad_medida,
            stock_minimo: insumo.stock_minimo,
            costo_unitario: insumo.costo_unitario,
          }
        : VACIO,
    );
    setAbierto(true);
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    setError("");
    guardar.mutate(formulario);
  };

  return (
    <>
      <Panel
        titulo="Insumos del almacen"
        descripcion="El stock solo cambia por movimientos: ventas, compras o ajustes."
        accion={<Boton onClick={() => abrir()}>Nuevo insumo</Boton>}
      >
        <div className="barra-herramientas">
          <input
            className="buscador"
            placeholder="Buscar insumo"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>

        {insumos.isLoading ? (
          <Cargando texto="Cargando el almacen" />
        ) : (insumos.data ?? []).length === 0 ? (
          <Vacio
            titulo="No hay insumos registrados"
            mensaje="Registra la materia prima para que las recetas puedan descontarla."
            accion={<Boton onClick={() => abrir()}>Nuevo insumo</Boton>}
          />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Insumo</th>
                  <th style={{ width: 150 }}>Nivel</th>
                  <th className="num">Stock</th>
                  <th className="num">Minimo</th>
                  <th className="num">Costo</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(insumos.data ?? []).map((insumo) => (
                  <tr key={insumo.id}>
                    <td>
                      <strong>{insumo.nombre}</strong>
                      {insumo.en_alerta ? (
                        <span style={{ marginLeft: 8 }}>
                          <Etiqueta tono="rocoto">bajo minimo</Etiqueta>
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <Nivel actual={Number(insumo.stock_actual)} minimo={Number(insumo.stock_minimo)} />
                    </td>
                    <td className="num">
                      {numero(insumo.stock_actual)} {insumo.unidad_medida}
                    </td>
                    <td className="num">{numero(insumo.stock_minimo)}</td>
                    <td className="num">{soles(insumo.costo_unitario)}</td>
                    <td>
                      <div className="acciones">
                        <Boton variante="fantasma" onClick={() => { setError(""); setAjustando(insumo); }}>
                          Ajustar
                        </Boton>
                        <Boton variante="fantasma" onClick={() => abrir(insumo)}>
                          Editar
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

      <Modal abierto={abierto} titulo={editando ? "Editar insumo" : "Nuevo insumo"} onCerrar={() => setAbierto(false)}>
        <form className="formulario" onSubmit={enviar}>
          {error ? <ErrorCaja mensaje={error} /> : null}
          <Campo
            etiqueta="Nombre"
            required
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
          />
          <div className="formulario__par">
            <Seleccion
              etiqueta="Unidad de medida"
              value={formulario.unidad_medida}
              onChange={(e) => setFormulario({ ...formulario, unidad_medida: e.target.value })}
            >
              <option value="kg">Kilogramo (kg)</option>
              <option value="g">Gramo (g)</option>
              <option value="l">Litro (l)</option>
              <option value="ml">Mililitro (ml)</option>
              <option value="unidad">Unidad</option>
            </Seleccion>
            <Campo
              etiqueta="Stock minimo"
              type="number"
              step="0.001"
              min="0"
              required
              value={formulario.stock_minimo}
              onChange={(e) => setFormulario({ ...formulario, stock_minimo: e.target.value })}
              ayuda="Debajo de este valor se genera una alerta."
            />
          </div>
          <Campo
            etiqueta="Costo unitario (S/)"
            type="number"
            step="0.01"
            min="0"
            required
            value={formulario.costo_unitario}
            onChange={(e) => setFormulario({ ...formulario, costo_unitario: e.target.value })}
          />
          <div className="formulario__pie">
            <Boton type="button" variante="contorno" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={guardar.isPending}>
              Guardar
            </Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={ajustando !== null}
        titulo={`Ajustar stock de ${ajustando?.nombre ?? ""}`}
        onCerrar={() => setAjustando(null)}
      >
        {ajustando ? (
          <FormularioAjuste
            insumo={ajustando}
            error={error}
            guardando={ajustar.isPending}
            onGuardar={(objetivo) => ajustar.mutate({ insumo: ajustando.id, stock_objetivo: objetivo })}
            onCancelar={() => setAjustando(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function FormularioAjuste({
  insumo,
  error,
  guardando,
  onGuardar,
  onCancelar,
}: {
  insumo: Insumo;
  error: string;
  guardando: boolean;
  onGuardar: (objetivo: string) => void;
  onCancelar: () => void;
}) {
  const [objetivo, setObjetivo] = useState(insumo.stock_actual);

  return (
    <form
      className="formulario"
      onSubmit={(evento) => {
        evento.preventDefault();
        onGuardar(objetivo);
      }}
    >
      {error ? <ErrorCaja mensaje={error} /> : null}
      <p style={{ margin: 0, fontSize: 14, color: "var(--tinta-45)" }}>
        El conteo fisico manda. Escribe cuanto hay realmente y el sistema registra la diferencia como
        movimiento de ajuste.
      </p>
      <Campo
        etiqueta={`Stock contado (${insumo.unidad_medida})`}
        type="number"
        step="0.001"
        min="0"
        required
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
        ayuda={`Segun el sistema hay ${numero(insumo.stock_actual)} ${insumo.unidad_medida}.`}
      />
      <div className="formulario__pie">
        <Boton type="button" variante="contorno" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton type="submit" cargando={guardando}>
          Registrar ajuste
        </Boton>
      </div>
    </form>
  );
}
