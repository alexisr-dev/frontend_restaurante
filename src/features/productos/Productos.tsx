import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { mensajeDeError } from "../../api/client";
import { catalogo } from "../../api/endpoints/catalogo";
import {
  AreaTexto,
  Boton,
  Campo,
  Cargando,
  ErrorCaja,
  Etiqueta,
  Modal,
  Panel,
  Seleccion,
  Vacio,
  numero,
  soles,
} from "../../components/ui";
import type { Producto } from "../../types";

const VACIO = { nombre: "", descripcion: "", precio: "", categoria: "" };

export default function Productos() {
  const cola = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<Producto | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [formulario, setFormulario] = useState(VACIO);
  const [recetaDe, setRecetaDe] = useState<Producto | null>(null);
  const [error, setError] = useState("");

  const productos = useQuery({ queryKey: ["productos", busqueda], queryFn: () => catalogo.productos(busqueda) });
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: catalogo.categorias });
  const insumos = useQuery({ queryKey: ["insumos"], queryFn: () => catalogo.insumos() });

  const refrescar = () => {
    void cola.invalidateQueries({ queryKey: ["productos"] });
    void cola.invalidateQueries({ queryKey: ["categorias"] });
  };

  const guardar = useMutation({
    mutationFn: (datos: Record<string, unknown>) =>
      editando ? catalogo.actualizarProducto(editando.id, datos) : catalogo.crearProducto(datos),
    onSuccess: () => {
      refrescar();
      cerrar();
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const eliminar = useMutation({
    mutationFn: catalogo.eliminarProducto,
    onSuccess: refrescar,
  });

  const agregarLinea = useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: { insumo: number; cantidad_requerida: string } }) =>
      catalogo.agregarLineaReceta(id, datos),
    onSuccess: async () => {
      await cola.invalidateQueries({ queryKey: ["productos"] });
      const frescos = await catalogo.productos(busqueda);
      setRecetaDe(frescos.find((p) => p.id === recetaDe?.id) ?? null);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const quitarLinea = useMutation({
    mutationFn: catalogo.eliminarLineaReceta,
    onSuccess: async () => {
      await cola.invalidateQueries({ queryKey: ["productos"] });
      const frescos = await catalogo.productos(busqueda);
      setRecetaDe(frescos.find((p) => p.id === recetaDe?.id) ?? null);
    },
  });

  const abrir = (producto?: Producto) => {
    setError("");
    setEditando(producto ?? null);
    setFormulario(
      producto
        ? {
            nombre: producto.nombre,
            descripcion: producto.descripcion ?? "",
            precio: producto.precio,
            categoria: producto.categoria ? String(producto.categoria) : "",
          }
        : VACIO,
    );
    setAbierto(true);
  };

  const cerrar = () => {
    setAbierto(false);
    setEditando(null);
    setError("");
  };

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    setError("");
    guardar.mutate({
      nombre: formulario.nombre,
      descripcion: formulario.descripcion || null,
      precio: formulario.precio,
      categoria: formulario.categoria ? Number(formulario.categoria) : null,
    });
  };

  return (
    <>
      <Panel
        titulo="Carta del restaurante"
        descripcion="Cada producto descuenta insumos segun su receta al venderse."
        accion={<Boton onClick={() => abrir()}>Nuevo producto</Boton>}
      >
        <div className="barra-herramientas">
          <input
            className="buscador"
            placeholder="Buscar por nombre o descripcion"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
          />
        </div>

        {productos.isLoading ? (
          <Cargando texto="Cargando la carta" />
        ) : (productos.data ?? []).length === 0 ? (
          <Vacio
            titulo="La carta esta vacia"
            mensaje="Crea el primer producto y luego asignale su receta de insumos."
            accion={<Boton onClick={() => abrir()}>Nuevo producto</Boton>}
          />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Categoria</th>
                  <th className="num">Precio</th>
                  <th className="num">Receta</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(productos.data ?? []).map((producto) => (
                  <tr key={producto.id}>
                    <td>
                      <strong>{producto.nombre}</strong>
                      {producto.descripcion ? (
                        <div style={{ fontSize: 12.5, color: "var(--tinta-45)" }}>{producto.descripcion}</div>
                      ) : null}
                    </td>
                    <td>{producto.categoria_nombre ?? "—"}</td>
                    <td className="num">{soles(producto.precio)}</td>
                    <td className="num">
                      {producto.receta.length === 0 ? (
                        <Etiqueta tono="aji">sin receta</Etiqueta>
                      ) : (
                        `${producto.receta.length} insumos`
                      )}
                    </td>
                    <td>
                      <Etiqueta tono={producto.activo ? "limon" : "neutro"}>
                        {producto.activo ? "activo" : "retirado"}
                      </Etiqueta>
                    </td>
                    <td>
                      <div className="acciones">
                        <Boton variante="fantasma" onClick={() => setRecetaDe(producto)}>
                          Receta
                        </Boton>
                        <Boton variante="fantasma" onClick={() => abrir(producto)}>
                          Editar
                        </Boton>
                        {producto.activo ? (
                          <Boton variante="fantasma" tono="rocoto" onClick={() => eliminar.mutate(producto.id)}>
                            Retirar
                          </Boton>
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

      <Modal abierto={abierto} titulo={editando ? "Editar producto" : "Nuevo producto"} onCerrar={cerrar}>
        <form className="formulario" onSubmit={enviar}>
          {error ? <ErrorCaja mensaje={error} /> : null}
          <Campo
            etiqueta="Nombre"
            required
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
          />
          <div className="formulario__par">
            <Campo
              etiqueta="Precio (S/)"
              type="number"
              step="0.01"
              min="0"
              required
              value={formulario.precio}
              onChange={(e) => setFormulario({ ...formulario, precio: e.target.value })}
            />
            <Seleccion
              etiqueta="Categoria"
              value={formulario.categoria}
              onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
            >
              <option value="">Sin categoria</option>
              {(categorias.data ?? []).map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </Seleccion>
          </div>
          <AreaTexto
            etiqueta="Descripcion"
            value={formulario.descripcion}
            onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
          />
          <div className="formulario__pie">
            <Boton type="button" variante="contorno" onClick={cerrar}>
              Cancelar
            </Boton>
            <Boton type="submit" cargando={guardar.isPending}>
              Guardar
            </Boton>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={recetaDe !== null}
        titulo={`Receta de ${recetaDe?.nombre ?? ""}`}
        onCerrar={() => setRecetaDe(null)}
      >
        {recetaDe ? (
          <FormularioReceta
            producto={recetaDe}
            insumos={insumos.data ?? []}
            error={error}
            agregando={agregarLinea.isPending}
            onAgregar={(datos) => agregarLinea.mutate({ id: recetaDe.id, datos })}
            onQuitar={(id) => quitarLinea.mutate(id)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function FormularioReceta({
  producto,
  insumos,
  error,
  agregando,
  onAgregar,
  onQuitar,
}: {
  producto: Producto;
  insumos: { id: number; nombre: string; unidad_medida: string }[];
  error: string;
  agregando: boolean;
  onAgregar: (datos: { insumo: number; cantidad_requerida: string }) => void;
  onQuitar: (id: number) => void;
}) {
  const [insumo, setInsumo] = useState("");
  const [cantidad, setCantidad] = useState("");

  const enviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (!insumo || !cantidad) return;
    onAgregar({ insumo: Number(insumo), cantidad_requerida: cantidad });
    setInsumo("");
    setCantidad("");
  };

  const disponibles = insumos.filter((i) => !producto.receta.some((linea) => linea.insumo === i.id));

  return (
    <div className="formulario">
      {error ? <ErrorCaja mensaje={error} /> : null}

      {producto.receta.length === 0 ? (
        <p style={{ margin: 0, color: "var(--tinta-45)", fontSize: 14 }}>
          Este producto todavia no descuenta inventario. Agrega los insumos que consume una unidad.
        </p>
      ) : (
        <div className="tabla-envoltura" style={{ margin: 0, padding: 0 }}>
          <table className="tabla">
            <thead>
              <tr>
                <th>Insumo</th>
                <th className="num">Por unidad</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {producto.receta.map((linea) => (
                <tr key={linea.id}>
                  <td>{linea.insumo_nombre}</td>
                  <td className="num">
                    {numero(linea.cantidad_requerida)} {linea.unidad_medida}
                  </td>
                  <td>
                    <div className="acciones">
                      <Boton variante="fantasma" tono="rocoto" onClick={() => onQuitar(linea.id)}>
                        Quitar
                      </Boton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="formulario" onSubmit={enviar}>
        <div className="formulario__par">
          <Seleccion etiqueta="Insumo" value={insumo} onChange={(e) => setInsumo(e.target.value)} required>
            <option value="">Elegir insumo</option>
            {disponibles.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre} ({i.unidad_medida})
              </option>
            ))}
          </Seleccion>
          <Campo
            etiqueta="Cantidad por unidad"
            type="number"
            step="0.001"
            min="0.001"
            required
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
        </div>
        <div className="formulario__pie">
          <Boton type="submit" cargando={agregando} disabled={disponibles.length === 0}>
            Agregar a la receta
          </Boton>
        </div>
      </form>
    </div>
  );
}
