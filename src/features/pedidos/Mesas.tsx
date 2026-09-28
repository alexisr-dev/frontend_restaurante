import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

import { reportes } from "../../api/endpoints/reportes";
import { Cargando, Etiqueta, Panel, Vacio, soles } from "../../components/ui";
import "./Mesas.css";

const TONO = { libre: "limon", ocupada: "chicha", reservada: "aji" } as const;

export default function Mesas() {
  const mesas = useQuery({ queryKey: ["mesas"], queryFn: reportes.mesas, refetchInterval: 15000 });

  if (mesas.isLoading) return <Cargando texto="Mirando el salon" />;

  const lista = mesas.data ?? [];
  const libres = lista.filter((mesa) => mesa.estado === "libre").length;
  const ocupadas = lista.filter((mesa) => mesa.estado === "ocupada").length;
  const reservadas = lista.filter((mesa) => mesa.estado === "reservada").length;

  return (
    <Panel
      titulo="Salon en vivo"
      descripcion={`${ocupadas} de ${lista.length} mesas ocupadas. Se actualiza cada 15 segundos.`}
    >
      {lista.length === 0 ? (
        <Vacio titulo="No hay mesas registradas" mensaje="Las mesas se crean desde la API operativa o el comando seed_demo." />
      ) : (
        <>
          <div className="salon-resumen">
            <div data-tono="libre">
              <b>{libres}</b>
              <span>Libres</span>
            </div>
            <i />
            <div data-tono="ocupada">
              <b>{ocupadas}</b>
              <span>Ocupadas</span>
            </div>
            <i />
            <div data-tono="reservada">
              <b>{reservadas}</b>
              <span>Reservadas</span>
            </div>
          </div>

          <div className="salon">
            {lista.map((mesa, indice) => (
              <motion.article
                key={mesa.id}
                className="mesa"
                data-estado={mesa.estado}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.26, delay: indice * 0.025, ease: [0.32, 0.72, 0, 1] }}
              >
                <div className="mesa__lienzo">
                  <PlanoMesa capacidad={mesa.capacidad} />
                  <span className="mesa__numero dato">{mesa.numero}</span>
                  <span className="mesa__sitios">
                    <IconoSilla />
                    {mesa.capacidad}
                  </span>
                </div>
                <div className="mesa__pie">
                  <Etiqueta tono={TONO[mesa.estado]}>{mesa.estado}</Etiqueta>
                  {mesa.total_en_curso > 0 ? (
                    <span className="mesa__cuenta dato">{soles(mesa.total_en_curso)}</span>
                  ) : null}
                </div>
              </motion.article>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
}

/* Dibuja la mesa vista en planta: un tablero central (redondo si es para 4 o
   menos comensales, rectangular si es mas) rodeado de sus sillas. El color y
   el relleno de las sillas los pone el CSS segun el data-estado de la tarjeta:
   llenas cuando la mesa esta ocupada, solo contorno cuando esta libre. */
function PlanoMesa({ capacidad }: { capacidad: number }) {
  const asientos = Math.max(1, Math.min(capacidad, 10));
  const redonda = capacidad <= 4;

  const centro = 50;
  const sillaR = 4.6;
  const hueco = 6;
  const tableroR = 25;
  const anchoRect = 52;
  const altoRect = 34;

  const radioX = (redonda ? tableroR : anchoRect / 2) + hueco + sillaR;
  const radioY = (redonda ? tableroR : (altoRect / 2) * 1.05) + hueco + sillaR;

  const sillas = Array.from({ length: asientos }, (_, indice) => {
    const angulo = -Math.PI / 2 + (2 * Math.PI * indice) / asientos;
    return {
      x: centro + Math.cos(angulo) * radioX,
      y: centro + Math.sin(angulo) * radioY,
    };
  });

  return (
    <svg className="mesa__plano" viewBox="0 0 100 100" aria-hidden>
      {sillas.map((silla, indice) => (
        <rect
          key={indice}
          className="mesa__silla"
          x={silla.x - sillaR * 1.15}
          y={silla.y - sillaR}
          width={sillaR * 2.3}
          height={sillaR * 2}
          rx={2}
        />
      ))}
      {redonda ? (
        <circle className="mesa__tablero" cx={centro} cy={centro} r={tableroR} />
      ) : (
        <rect
          className="mesa__tablero"
          x={centro - anchoRect / 2}
          y={centro - altoRect / 2}
          width={anchoRect}
          height={altoRect}
          rx={11}
        />
      )}
    </svg>
  );
}

function IconoSilla() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden>
      <path d="M4 18v3h3v-3h10v3h3v-6H4v3zm15-8h3v3h-3v-3zM2 10h3v3H2v-3zm15 3H7V5c0-1.1.9-2 2-2h6c1.1 0 2 .9 2 2v8z" />
    </svg>
  );
}
