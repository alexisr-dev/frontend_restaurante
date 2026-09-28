import { motion } from "framer-motion";
import { type FormEvent, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { mensajeDeError } from "../../api/client";
import { Boton, Campo, ErrorCaja } from "../../components/ui";
import { useAuth } from "../../store/auth";
import "./Login.css";

export default function Login() {
  const { usuario, ingresar } = useAuth();
  const navegar = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await ingresar({ email, password });
      navegar("/", { replace: true });
    } catch (fallo) {
      setError(mensajeDeError(fallo, "Revisa el correo y la contrasena."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="ingreso">
      <aside className="ingreso__portada">
        <div className="ingreso__tapiz azulejo" aria-hidden />
        <div className="ingreso__discurso">
          <p className="ingreso__eyebrow">Sistema de gestion</p>
          <h1 className="ingreso__titulo">
            La carta, la cocina y el almacen
            <em> en una sola mesa</em>
          </h1>
          <p className="ingreso__texto">
            Cada plato que sale descuenta sus insumos segun la receta. Aqui se ve el resultado:
            ventas del dia, stock real y compras por recibir.
          </p>
        </div>
      </aside>

      <main className="ingreso__panel">
        <motion.form
          className="ingreso__forma"
          onSubmit={enviar}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        >
          <h2 className="ingreso__saludo">Entra al panel</h2>
          <p className="ingreso__ayuda">Usa la cuenta que te dio el administrador.</p>

          {error ? <ErrorCaja mensaje={error} /> : null}

          <Campo
            etiqueta="Correo"
            type="email"
            value={email}
            autoComplete="username"
            required
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="admin@restaurante.com"
          />
          <Campo
            etiqueta="Contrasena"
            type="password"
            value={password}
            autoComplete="current-password"
            required
            onChange={(evento) => setPassword(evento.target.value)}
          />

          <Boton type="submit" cargando={enviando}>
            {enviando ? "Entrando" : "Entrar"}
          </Boton>

          <div className="ingreso__pista">
            <p className="ingreso__pista-titulo">Cuentas de demostracion</p>
            <ul>
              <li>
                <code>admin@restaurante.com</code> · Admin2026!
              </li>
              <li>
                <code>inventario@restaurante.com</code> · Inventario2026!
              </li>
            </ul>
          </div>
        </motion.form>
      </main>
    </div>
  );
}
