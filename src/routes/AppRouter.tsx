import { type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "../components/Layout";
import { Cargando } from "../components/ui";
import Login from "../features/auth/Login";
import Auditoria from "../features/auditoria/Auditoria";
import Insumos from "../features/inventario/Insumos";
import Movimientos from "../features/inventario/Movimientos";
import Mesas from "../features/pedidos/Mesas";
import Pedidos from "../features/pedidos/Pedidos";
import Productos from "../features/productos/Productos";
import Proveedores from "../features/proveedores/Proveedores";
import Panel from "../features/reportes/Panel";
import Usuarios from "../features/usuarios/Usuarios";
import { useAuth } from "../store/auth";

function Protegida({ children, soloAdmin = false }: { children: ReactNode; soloAdmin?: boolean }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return <Cargando texto="Comprobando la sesion" />;
  if (!usuario) return <Navigate to="/ingresar" replace />;
  if (soloAdmin && usuario.rol !== "admin") return <Navigate to="/" replace />;

  return <>{children}</>;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/ingresar" element={<Login />} />
      <Route
        element={
          <Protegida>
            <Layout />
          </Protegida>
        }
      >
        <Route path="/" element={<Panel />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/mesas" element={<Mesas />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/insumos" element={<Insumos />} />
        <Route path="/inventario" element={<Movimientos />} />
        <Route path="/proveedores" element={<Proveedores />} />
        <Route
          path="/usuarios"
          element={
            <Protegida soloAdmin>
              <Usuarios />
            </Protegida>
          }
        />
        <Route
          path="/auditoria"
          element={
            <Protegida soloAdmin>
              <Auditoria />
            </Protegida>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
