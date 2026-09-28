import { motion } from "framer-motion";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { inventario } from "../api/endpoints/inventario";
import { useAuth } from "../store/auth";
import "./Layout.css";

const SECCIONES = [
  {
    grupo: "Servicio",
    enlaces: [
      { a: "/", texto: "Resumen del dia", icono: "M3 12h4l3 8 4-16 3 8h4" },
      { a: "/pedidos", texto: "Pedidos", icono: "M4 5h16M4 12h16M4 19h10" },
      { a: "/mesas", texto: "Mesas", icono: "M4 9h16M6 9v11M18 9v11M3 5h18v4H3z" },
    ],
  },
  {
    grupo: "Carta",
    enlaces: [
      { a: "/productos", texto: "Productos y recetas", icono: "M12 3v18M5 7h14M7 12h10M8 17h8" },
      { a: "/insumos", texto: "Insumos", icono: "M6 3h12l-1 8a5 5 0 0 1-10 0zM12 16v5" },
    ],
  },
  {
    grupo: "Abastecimiento",
    enlaces: [
      { a: "/inventario", texto: "Movimientos", icono: "M7 17V7l5-4 5 4v10M3 21h18" },
      { a: "/proveedores", texto: "Proveedores y compras", icono: "M3 7h13v10H3zM16 10h5l0 7h-5M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4" },
    ],
  },
  {
    grupo: "Administracion",
    enlaces: [
      { a: "/usuarios", texto: "Usuarios", icono: "M16 20v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
      { a: "/auditoria", texto: "Auditoria", icono: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 13l2 2 4-4" },
    ],
  },
];

const TITULOS: Record<string, string> = {
  "/": "Resumen del dia",
  "/pedidos": "Pedidos",
  "/mesas": "Mesas",
  "/productos": "Productos y recetas",
  "/insumos": "Insumos",
  "/inventario": "Movimientos de inventario",
  "/proveedores": "Proveedores y compras",
  "/usuarios": "Usuarios",
  "/auditoria": "Auditoria",
};

function Icono({ trazo }: { trazo: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <path d={trazo} />
    </svg>
  );
}

export default function Layout() {
  const { usuario, salir } = useAuth();
  const ubicacion = useLocation();

  const { data: alertas } = useQuery({
    queryKey: ["alertas", "pendientes"],
    queryFn: () => inventario.alertas(false),
    refetchInterval: 30000,
  });

  const pendientes = alertas?.length ?? 0;
  const soloAdmin = usuario?.rol === "admin";

  return (
    <div className="marco">
      <aside className="rail">
        <div className="rail__marca">
          <div className="rail__logo azulejo" aria-hidden />
          <div>
            <p className="rail__nombre">Sazon</p>
            <p className="rail__sub">Gestion de restaurante</p>
          </div>
        </div>

        <nav className="rail__nav">
          {SECCIONES.map((seccion) => (
            <div key={seccion.grupo} className="rail__grupo">
              <p className="rail__grupo-titulo">{seccion.grupo}</p>
              {seccion.enlaces
                .filter((enlace) => soloAdmin || !["/usuarios", "/auditoria"].includes(enlace.a))
                .map((enlace) => (
                  <NavLink
                    key={enlace.a}
                    to={enlace.a}
                    end={enlace.a === "/"}
                    className={({ isActive }) => `rail__enlace ${isActive ? "es-activo" : ""}`}
                  >
                    <Icono trazo={enlace.icono} />
                    <span>{enlace.texto}</span>
                    {enlace.a === "/inventario" && pendientes > 0 ? (
                      <span className="rail__contador">{pendientes}</span>
                    ) : null}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>

        <div className="rail__pie azulejo" aria-hidden />
      </aside>

      <div className="columna">
        <header className="cinta">
          <div>
            <p className="cinta__ruta">Panel</p>
            <h1 className="cinta__titulo">{TITULOS[ubicacion.pathname] ?? "Panel"}</h1>
          </div>

          <div className="cinta__usuario">
            <div className="cinta__identidad">
              <p className="cinta__nombre">{usuario?.nombre}</p>
              <p className="cinta__rol">{usuario?.rol}</p>
            </div>
            <div className="cinta__avatar" aria-hidden>
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <button className="cinta__salir" onClick={salir}>
              Salir
            </button>
          </div>
        </header>

        <motion.main
          key={ubicacion.pathname}
          className="lienzo"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}
