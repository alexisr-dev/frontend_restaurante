import { AnimatePresence, motion } from "framer-motion";
import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  useEffect,
} from "react";

import "./ui.css";

type Tono = "chicha" | "aji" | "limon" | "rocoto" | "neutro";

export function Boton({
  variante = "solido",
  tono = "chicha",
  cargando = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: "solido" | "contorno" | "fantasma";
  tono?: Tono;
  cargando?: boolean;
}) {
  return (
    <button
      {...props}
      data-variante={variante}
      data-tono={tono}
      className={`boton ${props.className ?? ""}`}
      disabled={props.disabled || cargando}
    >
      {cargando ? <span className="boton__giro" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function Etiqueta({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className="etiqueta" data-tono={tono}>
      {children}
    </span>
  );
}

export function Campo({
  etiqueta,
  ayuda,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { etiqueta: string; ayuda?: string }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      <input {...props} className="campo__control" />
      {ayuda ? <span className="campo__ayuda">{ayuda}</span> : null}
    </label>
  );
}

export function Seleccion({
  etiqueta,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { etiqueta: string }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      <select {...props} className="campo__control">
        {children}
      </select>
    </label>
  );
}

export function AreaTexto({
  etiqueta,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { etiqueta: string }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      <textarea {...props} className="campo__control" rows={props.rows ?? 3} />
    </label>
  );
}

export function Panel({
  titulo,
  descripcion,
  accion,
  children,
  ancho,
}: {
  titulo?: string;
  descripcion?: string;
  accion?: ReactNode;
  children: ReactNode;
  ancho?: "completo";
}) {
  return (
    <section className="panel" data-ancho={ancho}>
      {titulo ? (
        <header className="panel__cabecera">
          <div>
            <h2 className="panel__titulo">{titulo}</h2>
            {descripcion ? <p className="panel__descripcion">{descripcion}</p> : null}
          </div>
          {accion}
        </header>
      ) : null}
      {children}
    </section>
  );
}

export function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
}: {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto, onCerrar]);

  return (
    <AnimatePresence>
      {abierto ? (
        <motion.div
          className="modal__fondo"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onCerrar}
        >
          <motion.div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            onClick={(evento) => evento.stopPropagation()}
          >
            <header className="modal__cabecera">
              <h2 className="modal__titulo">{titulo}</h2>
              <button className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
                ×
              </button>
            </header>
            <div className="modal__cuerpo">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Vacio({ titulo, mensaje, accion }: { titulo: string; mensaje: string; accion?: ReactNode }) {
  return (
    <div className="vacio">
      <div className="vacio__marca azulejo" aria-hidden />
      <h3 className="vacio__titulo">{titulo}</h3>
      <p className="vacio__mensaje">{mensaje}</p>
      {accion}
    </div>
  );
}

export function Cargando({ texto = "Cargando" }: { texto?: string }) {
  return (
    <div className="cargando" role="status">
      <span className="cargando__barra" aria-hidden />
      <span>{texto}</span>
    </div>
  );
}

export function ErrorCaja({ mensaje }: { mensaje: string }) {
  return (
    <div className="error-caja" role="alert">
      {mensaje}
    </div>
  );
}

/* El "nivel" traduce stock_actual/stock_minimo a una barra legible de un vistazo:
   por debajo del minimo el relleno cambia de tono en lugar de solo encogerse. */
export function Nivel({ actual, minimo }: { actual: number; minimo: number }) {
  const tope = Math.max(minimo * 2.5, actual, 1);
  const porcentaje = Math.min(100, (actual / tope) * 100);
  const marca = Math.min(100, (minimo / tope) * 100);
  const critico = actual <= minimo;

  return (
    <div className="nivel" title={`${actual} en stock, minimo ${minimo}`}>
      <div className="nivel__relleno" data-critico={critico} style={{ width: `${porcentaje}%` }} />
      <div className="nivel__marca" style={{ left: `${marca}%` }} />
    </div>
  );
}

export const soles = (valor: string | number) =>
  `S/ ${Number(valor).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const numero = (valor: string | number, decimales = 3) =>
  Number(valor).toLocaleString("es-PE", { maximumFractionDigits: decimales });

export const fecha = (iso: string) =>
  new Date(iso).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
