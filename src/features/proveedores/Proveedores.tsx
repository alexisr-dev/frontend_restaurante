import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { mensajeDeError } from "../../api/client";
import { catalogo } from "../../api/endpoints/catalogo";
import { proveedores } from "../../api/endpoints/proveedores";
import {
  Boton,
  Campo,
  Cargando,
  ErrorCaja,
  Etiqueta,
  Modal,
  Panel,
  Seleccion,
  Vacio,
  fecha,
  numero,
  soles,
} from "../../components/ui";
import type { LineaCompra, Proveedor } from "../../types";

const VACIO = { nombre: "", contacto: "", telefono: "", email: "", direccion: "" };

const TONO_ESTADO = { pendiente: "aji", recibida: "limon", cancelada: "neutro" } as const;

export default function PaginaProveedores() {
  const cola = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Proveedor | null>(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [compraAbierta, setCompraAbierta] = useState(false);
  const [error, setError] = useState("");

  const lista = useQuery({ queryKey: ["proveedores"], queryFn: proveedores.listar });
  const compras = useQuery({ queryKey: ["compras"], queryFn: proveedores.compras });
  const insumos = useQuery({ queryKey: ["insumos"], queryFn: () => catalogo.insumos() });

  const refrescar = () => {
    void cola.invalidateQueries({ queryKey: ["proveedores"] });
    void cola.invalidateQueries({ queryKey: ["compras"] });
    void cola.invalidateQueries({ queryKey: ["insumos"] });
    void cola.invalidateQueries({ queryKey: ["alertas"] });
  };

  const guardar = useMutation({
    mutationFn: (datos: Partial<Proveedor>) =>
      editando ? proveedores.actualizar(editando.id, datos) : proveedores.crear(datos),
    onSuccess: () => {
      refrescar();
      setAbierto(false);
      setEditando(null);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const crearCompra = useMutation({
    mutationFn: proveedores.crearCompra,
    onSuccess: () => {
      refrescar();
      setCompraAbierta(false);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const recibir = useMutation({
    mutationFn: proveedores.recibirCompra,
    onSuccess: refrescar,
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const cancelar = useMutation({ mutationFn: proveedores.cancelarCompra, onSuccess: refrescar });

  const abrir = (proveedor?: Proveedor) => {
    setError("");
    setEditando(proveedor ?? null);
    setFormulario(
      proveedor
        ? {
            nombre: proveedor.nombre,
            contacto: proveedor.contacto ?? "",
            telefono: proveedor.telefono ?? "",
            email: proveedor.email ?? "",
            direccion: proveedor.direccion ?? "",
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
      {error ? <ErrorCaja mensaje={error} /> : null}

      <Panel
        titulo="Ordenes de compra"
        descripcion="Al recibir una compra, el stock de cada insumo sube y se actualiza su costo."
        accion={
          <Boton
            onClick={() => {
              setError("");
              setCompraAbierta(true);
            }}
          >
            Nueva compra
          </Boton>
        }
      >
        {compras.isLoading ? (
          <Cargando />
        ) : (compras.data ?? []).length === 0 ? (
          <Vacio titulo="Sin ordenes de compra" mensaje="Crea una orden para reponer insumos con un proveedor." />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Proveedor</th>
                  <th>Fecha</th>
                  <th className="num">Lineas</th>
                  <th className="num">Total</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(compras.data ?? []).map((compra) => (
                  <tr key={compra.id}>
                    <td className="dato">{compra.id}</td>
                    <td>
                      <strong>{compra.proveedor_nombre}</strong>
                      <div style={{ fontSize: 12.5, color: "var(--tinta-45)" }}>
                        registro: {compra.usuario_nombre}
                      </div>
                    </td>
                    <td>{fecha(compra.created_at)}</td>
                    <td className="num">{compra.detalles.length}</td>
                    <td className="num">{soles(compra.total)}</td>
                    <td>
                      <Etiqueta tono={TONO_ESTADO[compra.estado]}>{compra.estado}</Etiqueta>
                    </td>
                    <td>
                      <div className="acciones">
                        {compra.estado === "pendiente" ? (
                          <>
                            <Boton
                              variante="fantasma"
                              tono="limon"
                              onClick={() => recibir.mutate(compra.id)}
                              cargando={recibir.isPending && recibir.variables === compra.id}
                            >
                              Recibir
                            </Boton>
                            <Boton variante="fantasma" tono="rocoto" onClick={() => cancelar.mutate(compra.id)}>
                              Cancelar
                            </Boton>
                          </>
                        ) : null}
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
        titulo="Proveedores"
        descripcion="Contactos de abastecimiento."
        accion={
          <Boton variante="contorno" onClick={() => abrir()}>
            Nuevo proveedor
          </Boton>
        }
      >
        {lista.isLoading ? (
          <Cargando />
        ) : (lista.data ?? []).length === 0 ? (
          <Vacio titulo="Sin proveedores" mensaje="Registra a quien te abastece para poder crear compras." />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>Contacto</th>
                  <th>Telefono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(lista.data ?? []).map((proveedor) => (
                  <tr key={proveedor.id}>
                    <td>
                      <strong>{proveedor.nombre}</strong>
                    </td>
                    <td>{proveedor.contacto ?? "—"}</td>
                    <td className="dato">{proveedor.telefono ?? "—"}</td>
                    <td>{proveedor.email ?? "—"}</td>
                    <td>
                      <Etiqueta tono={proveedor.activo ? "limon" : "neutro"}>
                        {proveedor.activo ? "activo" : "inactivo"}
                      </Etiqueta>
                    </td>
                    <td>
                      <div className="acciones">
                        <Boton variante="fantasma" onClick={() => abrir(proveedor)}>
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

      <Modal abierto={abierto} titulo={editando ? "Editar proveedor" : "Nuevo proveedor"} onCerrar={() => setAbierto(false)}>
        <form className="formulario" onSubmit={enviar}>
          <Campo
            etiqueta="Razon social"
            required
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
          />
          <div className="formulario__par">
            <Campo
              etiqueta="Contacto"
              value={formulario.contacto}
              onChange={(e) => setFormulario({ ...formulario, contacto: e.target.value })}
            />
            <Campo
              etiqueta="Telefono"
              value={formulario.telefono}
              onChange={(e) => setFormulario({ ...formulario, telefono: e.target.value })}
            />
          </div>
          <Campo
            etiqueta="Correo"
            type="email"
            value={formulario.email}
            onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
          />
          <Campo
            etiqueta="Direccion"
            value={formulario.direccion}
            onChange={(e) => setFormulario({ ...formulario, direccion: e.target.value })}
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

      <Modal abierto={compraAbierta} titulo="Nueva orden de compra" onCerrar={() => setCompraAbierta(false)}>
        <FormularioCompra
          proveedores={lista.data ?? []}
          insumos={insumos.data ?? []}
          error={error}
          guardando={crearCompra.isPending}
          onGuardar={(datos) => crearCompra.mutate(datos)}
          onCancelar={() => setCompraAbierta(false)}
        />
      </Modal>
    </>
  );
}

function FormularioCompra({
  proveedores: listaProveedores,
  insumos,
  error,
  guardando,
  onGuardar,
  onCancelar,
}: {
  proveedores: Proveedor[];
  insumos: { id: number; nombre: string; unidad_medida: string; costo_unitario: string }[];
  error: string;
  guardando: boolean;
  onGuardar: (datos: { proveedor: number; detalles: LineaCompra[] }) => void;
  onCancelar: () => void;
}) {
  const [proveedor, setProveedor] = useState("");
  const [lineas, setLineas] = useState<LineaCompra[]>([]);
  const [insumo, setInsumo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precio, setPrecio] = useState("");

  const agregar = () => {
    if (!insumo || !cantidad || !precio) return;
    const elegido = insumos.find((i) => i.id === Number(insumo));
    setLineas([
      ...lineas,
      {
        insumo: Number(insumo),
        insumo_nombre: elegido?.nombre,
        unidad_medida: elegido?.unidad_medida,
        cantidad,
        precio_unitario: precio,
      },
    ]);
    setInsumo("");
    setCantidad("");
    setPrecio("");
  };

  const total = lineas.reduce((suma, linea) => suma + Number(linea.cantidad) * Number(linea.precio_unitario), 0);

  return (
    <div className="formulario">
      {error ? <ErrorCaja mensaje={error} /> : null}

      <Seleccion etiqueta="Proveedor" value={proveedor} onChange={(e) => setProveedor(e.target.value)} required>
        <option value="">Elegir proveedor</option>
        {listaProveedores.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nombre}
          </option>
        ))}
      </Seleccion>

      <div className="formulario__par">
        <Seleccion
          etiqueta="Insumo"
          value={insumo}
          onChange={(e) => {
            setInsumo(e.target.value);
            const elegido = insumos.find((i) => i.id === Number(e.target.value));
            if (elegido) setPrecio(elegido.costo_unitario);
          }}
        >
          <option value="">Elegir insumo</option>
          {insumos.map((i) => (
            <option key={i.id} value={i.id}>
              {i.nombre} ({i.unidad_medida})
            </option>
          ))}
        </Seleccion>
        <Campo
          etiqueta="Cantidad"
          type="number"
          step="0.001"
          min="0.001"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
      </div>

      <div className="formulario__par">
        <Campo
          etiqueta="Precio unitario (S/)"
          type="number"
          step="0.01"
          min="0"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
        />
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Boton type="button" variante="contorno" onClick={agregar}>
            Agregar linea
          </Boton>
        </div>
      </div>

      {lineas.length > 0 ? (
        <div className="tabla-envoltura" style={{ margin: 0, padding: 0 }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Insumo</th>
                <th className="num">Cantidad</th>
                <th className="num">Precio</th>
                <th className="num">Subtotal</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lineas.map((linea, i) => (
                <tr key={i}>
                  <td>{linea.insumo_nombre}</td>
                  <td className="num">
                    {numero(linea.cantidad)} {linea.unidad_medida}
                  </td>
                  <td className="num">{soles(linea.precio_unitario)}</td>
                  <td className="num">{soles(Number(linea.cantidad) * Number(linea.precio_unitario))}</td>
                  <td>
                    <div className="acciones">
                      <Boton
                        variante="fantasma"
                        tono="rocoto"
                        onClick={() => setLineas(lineas.filter((_, j) => j !== i))}
                      >
                        Quitar
                      </Boton>
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} style={{ fontWeight: 600 }}>
                  Total
                </td>
                <td className="num" style={{ fontWeight: 700 }}>
                  {soles(total)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 14, color: "var(--tinta-45)" }}>
          Agrega al menos una linea con el insumo, la cantidad y el precio acordado.
        </p>
      )}

      <div className="formulario__pie">
        <Boton type="button" variante="contorno" onClick={onCancelar}>
          Cancelar
        </Boton>
        <Boton
          type="button"
          cargando={guardando}
          disabled={!proveedor || lineas.length === 0}
          onClick={() =>
            onGuardar({
              proveedor: Number(proveedor),
              detalles: lineas.map(({ insumo: id, cantidad: c, precio_unitario: p }) => ({
                insumo: id,
                cantidad: c,
                precio_unitario: p,
              })),
            })
          }
        >
          Crear orden
        </Boton>
      </div>
    </div>
  );
}
