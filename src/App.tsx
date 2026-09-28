import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";

import AppRouter from "./routes/AppRouter";
import { useAuth } from "./store/auth";

export default function App() {
  const restaurar = useAuth((estado) => estado.restaurar);

  useEffect(() => {
    void restaurar();
  }, [restaurar]);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
