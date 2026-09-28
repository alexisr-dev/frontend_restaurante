import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";

import { mensajeDeError } from "../../api/client";
import { usuarios as api } from "../../api/endpoints/usuarios";
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
} from "../../components/ui";
import type { Rol, Usuario } from "../../types";

const VACIO = { nombre: "", email: "", rol: "mesero" as Rol, password: "" };

const TONO_ROL: Record<Rol, "chicha" | "aji" | "limon" | "neutro"> = {
  admin: "chicha",
  cocina: "aji",
  mesero: "limon",
  inventario: "neutro",
};

export default function Usuarios() {
  const cola = useQueryClient();
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [error, setError] = useState("");

  const lista = useQuery({ queryKey: ["usuarios"], queryFn: api.listar });

  const refrescar = () => void cola.invalidateQueries({ queryKey: ["usuarios"] });

  const guardar = useMutation({
    mutationFn: (datos: typeof VACIO) => {
      const cuerpo = { nombre: datos.nombre, email: datos.email, rol: datos.rol };
      return editando
        ? api.actualizar(editando.id, datos.password ? { ...cuerpo, password: datos.password } : cuerpo)
        : api.crear({ ...cuerpo, password: datos.password });
    },
    onSuccess: () => {
      refrescar();
      setAbierto(false);
      setEditando(null);
    },
    onError: (fallo) => setError(mensajeDeError(fallo)),
  });

  const desactivar = useMutation({ mutationFn: api.desactivar, onSuccess: refrescar });
  const activar = useMutation({ mutationFn: api.activar, onSuccess: refrescar });

  const abrir = (usuario?: Usuario) => {
    setError("");
    setEditando(usuario ?? null);
    setFormulario(
      usuario
        ? { nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, password: "" }
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
        titulo="Equipo del restaurante"
        descripcion="El rol define que puede hacer cada persona en el panel y en la app movil."
        accion={<Boton onClick={() => abrir()}>Nuevo usuario</Boton>}
      >
        {lista.isLoading ? (
          <Cargando />
        ) : (lista.data ?? []).length === 0 ? (
          <Vacio titulo="Sin usuarios" mensaje="Crea las cuentas del equipo para que puedan iniciar sesion." />
        ) : (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Alta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {(lista.data ?? []).map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <strong>{usuario.nombre}</strong>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <Etiqueta tono={TONO_ROL[usuario.rol]}>{usuario.rol}</Etiqueta>
                    </td>
                    <td>
                      <Etiqueta tono={usuario.activo ? "limon" : "rocoto"}>
                        {usuario.activo ? "activo" : "inactivo"}
                      </Etiqueta>
                    </td>
                    <td>{usuario.created_at ? fecha(usuario.created_at) : "—"}</td>
                    <td>
                      <div className="acciones">
                        <Boton variante="fantasma" onClick={() => abrir(usuario)}>
                          Editar
                        </Boton>
                        {usuario.activo ? (
                          <Boton variante="fantasma" tono="rocoto" onClick={() => desactivar.mutate(usuario.id)}>
                            Desactivar
                          </Boton>
                        ) : (
                          <Boton variante="fantasma" tono="limon" onClick={() => activar.mutate(usuario.id)}>
                            Reactivar
                          </Boton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal abierto={abierto} titulo={editando ? "Editar usuario" : "Nuevo usuario"} onCerrar={() => setAbierto(false)}>
        <form className="formulario" onSubmit={enviar}>
          {error ? <ErrorCaja mensaje={error} /> : null}
          <Campo
            etiqueta="Nombre completo"
            required
            value={formulario.nombre}
            onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
          />
          <div className="formulario__par">
            <Campo
              etiqueta="Correo"
              type="email"
              required
              value={formulario.email}
              onChange={(e) => setFormulario({ ...formulario, email: e.target.value })}
            />
            <Seleccion
              etiqueta="Rol"
              value={formulario.rol}
              onChange={(e) => setFormulario({ ...formulario, rol: e.target.value as Rol })}
            >
              <option value="mesero">Mesero</option>
              <option value="cocina">Cocina</option>
              <option value="inventario">Inventario</option>
              <option value="admin">Administrador</option>
            </Seleccion>
          </div>
          <Campo
            etiqueta="Contrasena"
            type="password"
            required={!editando}
            minLength={8}
            value={formulario.password}
            onChange={(e) => setFormulario({ ...formulario, password: e.target.value })}
            ayuda={editando ? "Dejala vacia para conservar la actual." : "Minimo 8 caracteres."}
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
    </>
  );
}
