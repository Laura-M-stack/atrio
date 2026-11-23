/**
 * El guion de la animación: qué pieza aparece, se mueve o se desvanece en qué tramo del scroll (p de 0 a 1).
 * Son datos y funciones puras: el mismo guion lo ejecuta el navegador con su línea de tiempo nativa de scroll,
 * o un respaldo en JavaScript si el navegador es viejo.
 */
import { PISOS, PISO_CORTE } from './edificio.js';

const SUAVE = 'cubic-bezier(.22,1,.36,1)';
export const SUBIR = 95; // cuánto se separan los pisos de arriba al final (unidades del dibujo)
export const BAJAR = 26; // y cuánto bajan los de abajo

const APARECE_ESTRUCTURA = (piso) => 0.1 + piso * 0.03;
const APARECE_FACHADA = (piso) => 0.4 + piso * 0.022;
export const EXPLOTA = [0.74, 0.88];

const estado = (op, y) => ({ opacity: op, transform: `translate(0px, ${y}px)` });

/**
 * Convierte una lista de momentos [p, estado] en una animación: el tramo [a, b] que ocupa y sus keyframes con offset.
 * Momentos repetidos o fuera de orden se ordenan; si hay uno solo, la pieza queda fija en ese estado.
 */
export function keyframesDe(momentos) {
  const ms = momentos.filter(([p]) => Number.isFinite(p)).sort((x, y) => x[0] - y[0]);
  if (!ms.length) return null;
  const a = ms[0][0];
  const b = ms[ms.length - 1][0];
  const largo = b - a || 1;
  const keyframes = ms.map(([p, e]) => ({ ...e, offset: b === a ? 0 : (p - a) / largo, easing: SUAVE }));
  if (b === a) keyframes.push({ ...ms[0][1], offset: 1 });
  return { a, b: b === a ? a + 0.001 : b, keyframes };
}

/** Cómo termina cada piso al final: los de arriba suben y se vuelven traslúcidos, los de abajo bajan un poco. */
function finalDe(piso) {
  if (piso > PISO_CORTE) return estado(0.16, -SUBIR);
  if (piso < PISO_CORTE) return estado(1, BAJAR);
  return estado(1, 0);
}

export function guion() {
  const [e0, e1] = EXPLOTA;
  const g = {};
  g.plano = [[0, estado(0.55, 10)], [0.08, estado(1, 0)], [0.2, estado(1, 0)], [0.34, estado(0.45, 0)], [e0, estado(0.45, 0)], [e1, estado(0.3, BAJAR)]];
  for (let piso = 0; piso < PISOS; piso++) {
    const a = APARECE_ESTRUCTURA(piso);
    const fin = finalDe(piso);
    g[`losa-${piso}`] = [[a, estado(0, 42)], [a + 0.07, estado(1, 0)], [e0, estado(1, 0)], [e1, fin]];
    const finCol = piso === PISO_CORTE ? estado(0, 0) : fin;
    g[`columnas-${piso}`] = [[a + 0.015, estado(0, 42)], [a + 0.08, estado(1, 0)], [e0, estado(1, 0)], [e0 + 0.06, piso === PISO_CORTE ? finCol : estado(1, 0)], [e1, finCol]];
    const f = APARECE_FACHADA(piso);
    const finFach = piso === PISO_CORTE ? estado(0, 0) : fin;
    g[`fachada-${piso}`] = [[f, estado(0, 10)], [f + 0.05, estado(1, 0)], [e0, estado(1, 0)], [e0 + 0.06, piso === PISO_CORTE ? finFach : estado(1, 0)], [e1, finFach]];
  }
  g.planta = [[e0 + 0.04, estado(0, 0)], [e1, estado(1, 0)]];
  g.techo = [[0.33, estado(0, 42)], [0.4, estado(1, 0)], [e0, estado(1, 0)], [e1, finalDe(PISOS)]];
  g.terraza = [[0.58, estado(0, -26)], [0.66, estado(1, 0)], [e0, estado(1, 0)], [e1, finalDe(PISOS)]];
  return g;
}

/** Capítulos del texto: cada uno ocupa un tramo y entra desde abajo, sale hacia arriba. */
export const CAPITULOS = [
  [0, 0.12],
  [0.14, 0.37],
  [0.4, 0.6],
  [0.62, 0.73],
  [0.77, 1],
];

export function guionCapitulo([a, b], fundido = 0.035) {
  const entra = a <= 0 ? [[0, { opacity: 1, transform: 'translate(0px, 0px)' }]] : [[a, { opacity: 0, transform: 'translate(0px, 26px)' }], [a + fundido, { opacity: 1, transform: 'translate(0px, 0px)' }]];
  const sale = b >= 1 ? [[1, { opacity: 1, transform: 'translate(0px, 0px)' }]] : [[b - fundido, { opacity: 1, transform: 'translate(0px, 0px)' }], [b, { opacity: 0, transform: 'translate(0px, -26px)' }]];
  return [...entra, ...sale];
}

/** El estado de un momento p, interpolado como lo haría la animación (sin easing): lo usa el respaldo y los tests. */
export function estadoEn(momentos, p) {
  const ms = [...momentos].sort((x, y) => x[0] - y[0]);
  const y = (e) => Number(/translate\(0px, (-?[\d.]+)px\)/.exec(e.transform ?? '')?.[1] ?? 0);
  const plano = (e) => ({ opacity: e.opacity ?? 1, y: y(e) });
  if (p <= ms[0][0]) return plano(ms[0][1]);
  if (p >= ms[ms.length - 1][0]) return plano(ms[ms.length - 1][1]);
  const i = ms.findIndex(([q]) => q > p);
  const a = plano(ms[i - 1][1]);
  const b = plano(ms[i][1]);
  const t = (p - ms[i - 1][0]) / (ms[i][0] - ms[i - 1][0]);
  return { opacity: a.opacity + (b.opacity - a.opacity) * t, y: a.y + (b.y - a.y) * t };
}
