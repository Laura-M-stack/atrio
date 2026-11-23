/**
 * El edificio dibujado en perspectiva isométrica, como piezas separadas que la animación arma con el scroll:
 * plano en el terreno, losa y columnas de cada piso, fachada, terraza y la planta de un piso por dentro.
 * Todo son polígonos planos con colores fijos (sin degradados ni filtros), así el navegador los mueve sin esfuerzo.
 */

export const ANCHO = 24; // m, frente (eje x)
export const FONDO = 14; // m, profundidad (eje y)
export const ALTURA_PISO = 3; // m
export const LOSA = 0.35; // m
export const PISOS = 8; // planta baja + 7 pisos
export const PISO_CORTE = 5; // el piso que se muestra por dentro
const K = 10; // unidades del SVG por metro
const COS = Math.cos(Math.PI / 6);

const f1 = (n) => (Math.round(n * 10) / 10 + 0).toString();

/** Proyección isométrica: x hacia la derecha y abajo, y hacia la izquierda y abajo, z hacia arriba. */
export function iso([x, y, z]) {
  return [(x - y) * COS * K, ((x + y) * 0.5 - z) * K];
}

const lim = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
function anotar([sx, sy]) {
  lim.x0 = Math.min(lim.x0, sx);
  lim.x1 = Math.max(lim.x1, sx);
  lim.y0 = Math.min(lim.y0, sy);
  lim.y1 = Math.max(lim.y1, sy);
}

export function poligono(puntos3d, clase) {
  const pts = puntos3d.map((p) => {
    const q = iso(p);
    anotar(q);
    return `${f1(q[0])},${f1(q[1])}`;
  });
  return `<polygon class="${clase}" points="${pts.join(' ')}"/>`;
}

/** Las tres caras visibles de una caja: frente izquierdo (y máximo), frente derecho (x máximo) y techo. */
export function prisma(x0, y0, z0, x1, y1, z1, mat) {
  return (
    poligono([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], `${mat} i`) +
    poligono([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], `${mat} d`) +
    poligono([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], `${mat} t`)
  );
}

/** Un rectángulo sobre la cara del frente (y fijo) o sobre la cara lateral (x fijo). */
const panelY = (y, a, b, c, d, clase) => poligono([[a, y, c], [b, y, c], [b, y, d], [a, y, d]], `${clase} fy`);
const panelX = (x, a, b, c, d, clase) => poligono([[x, a, c], [x, b, c], [x, b, d], [x, a, d]], `${clase} fx`);

const zBase = (piso) => piso * ALTURA_PISO;

function losa(piso) {
  const z = zBase(piso);
  return prisma(0, 0, z, ANCHO, FONDO, z + LOSA, 'h');
}

function columnas(piso) {
  const z0 = zBase(piso) + LOSA;
  const z1 = zBase(piso + 1);
  const pos = [];
  for (const x of [0.2, 8, 16, ANCHO - 0.6]) for (const y of [0.2, 6.8, FONDO - 0.6]) pos.push([x, y]);
  pos.sort((a, b) => a[0] + a[1] - (b[0] + b[1])); // las de atrás primero
  return pos.map(([x, y]) => prisma(x, y, z0, x + 0.4, y + 0.4, z1, 'col')).join('');
}

/** Vidrios con su carpintería entre dos alturas, a lo largo de una cara. */
function ventanales(cara, fijo, desde, hasta, z0, z1, paso) {
  let s = cara === 'y' ? panelY(fijo, desde, hasta, z0, z1, 'marco') : panelX(fijo, desde, hasta, z0, z1, 'marco');
  const n = Math.max(1, Math.round((hasta - desde) / paso));
  const w = (hasta - desde) / n;
  for (let k = 0; k < n; k++) {
    const a = desde + k * w + 0.08;
    const b = desde + (k + 1) * w - 0.08;
    const clase = k % 3 === 1 ? 'vidrio brillo' : 'vidrio';
    s += cara === 'y' ? panelY(fijo, a, b, z0 + 0.08, z1 - 0.08, clase) : panelX(fijo, a, b, z0 + 0.08, z1 - 0.08, clase);
  }
  return s;
}

function fachada(piso) {
  const z0 = zBase(piso) + LOSA;
  const z1 = zBase(piso + 1);
  if (piso === 0) {
    // planta baja: hall vidriado con puerta y un alero de madera
    return (
      ventanales('y', FONDO, 0.3, ANCHO - 0.3, z0, z1 - 0.5, 2.4) +
      panelY(FONDO, 10.2, 12.2, z0, z1 - 0.8, 'puerta') +
      panelX(ANCHO, 0.3, FONDO - 0.3, z0, z1, 'muro') +
      ventanales('x', ANCHO, 4, 10, z0 + 0.6, z1 - 0.6, 2) +
      prisma(0, FONDO, z1 - 0.5, ANCHO, FONDO + 1.2, z1 - 0.2, 'madera')
    );
  }
  const frente =
    panelY(FONDO, 0, ANCHO, z0, z1, 'muro') +
    ventanales('y', FONDO, 0.4, 9.6, z0, z1, 1.9) +
    ventanales('y', FONDO, 10.4, 16.6, z0, z1, 2) +
    ventanales('y', FONDO, 17.6, 23.4, z0 + 0.9, z1 - 0.2, 2);
  const lateral = panelX(ANCHO, 0, FONDO, z0, z1, 'muro') + ventanales('x', ANCHO, 3.4, 12.8, z0 + 0.9, z1 - 0.2, 2.3);
  // balcón corrido de las unidades A y B, con baranda de madera
  const zb = zBase(piso);
  const balcon =
    prisma(0.4, FONDO, zb, 16.6, FONDO + 1.4, zb + LOSA, 'h') +
    panelY(FONDO + 1.4, 0.4, 16.6, zb + LOSA, zb + LOSA + 1.05, 'baranda') +
    panelX(16.6, FONDO, FONDO + 1.4, zb + LOSA, zb + LOSA + 1.05, 'baranda lado');
  return frente + lateral + balcon;
}

function techo() {
  const z = zBase(PISOS);
  return prisma(0, 0, z, ANCHO, FONDO, z + LOSA, 'h');
}

function terraza() {
  const z = zBase(PISOS) + LOSA;
  let s = '';
  // parapetos de atrás primero
  s += prisma(0, 0, z, ANCHO, 0.3, z + 1, 'h') + prisma(0, 0, z, 0.3, FONDO, z + 1, 'h');
  s += prisma(1, 1.2, z, 12, 12.4, z + 0.12, 'madera'); // deck
  s += prisma(17, 1.2, z, 21.5, 5, z + 2.6, 'h'); // sala de máquinas
  s += prisma(13, 6.2, z, 23, 11.6, z + 0.5, 'h'); // pileta
  s += poligono([[13.4, 6.6, z + 0.5], [22.6, 6.6, z + 0.5], [22.6, 11.2, z + 0.5], [13.4, 11.2, z + 0.5]], 'agua');
  // pérgola
  for (const [x, y] of [[2, 2.2], [10, 2.2], [2, 9], [10, 9]]) s += prisma(x, y, z, x + 0.25, y + 0.25, z + 2.6, 'madera');
  for (let k = 0; k < 6; k++) s += prisma(1.8, 2 + k * 1.45, z + 2.6, 10.6, 2.25 + k * 1.45, z + 2.8, 'madera');
  // canteros y árboles al frente, parapetos de adelante
  s += prisma(0.3, 12.6, z, ANCHO - 0.3, 13.7, z + 0.8, 'cantero');
  for (const x of [2.5, 7.5, 12.5, 17.5, 21.5]) {
    const [cx, cy] = iso([x, 13.15, z + 2.4]);
    anotar([cx, cy - 16]);
    s += `<ellipse class="copa" cx="${f1(cx)}" cy="${f1(cy)}" rx="15" ry="13"/><ellipse class="copa luz" cx="${f1(cx - 4)}" cy="${f1(cy - 5)}" rx="8" ry="6"/>`;
  }
  s += prisma(ANCHO - 0.3, 0, z, ANCHO, FONDO, z + 1, 'h') + prisma(0, FONDO - 0.3, z, ANCHO, FONDO, z + 1, 'h');
  return s;
}

/** Las unidades del piso de corte, vistas por dentro: pisos de madera, paredes bajas y el nombre de cada una. */
export const DISTRIBUCION = [
  { id: 'A', x0: 0, x1: 10, rotulo: 'A · 3 amb' },
  { id: 'B', x0: 10, x1: 17, rotulo: 'B · 2 amb' },
  { id: 'C', x0: 17, x1: ANCHO, rotulo: 'C · mono' },
];

function planta(piso) {
  const z = zBase(piso) + LOSA;
  let s = poligono([[0, 0, z], [ANCHO, 0, z], [ANCHO, 3, z], [0, 3, z]], 'pasillo');
  DISTRIBUCION.forEach((u, k) => {
    s += poligono([[u.x0, 3, z], [u.x1, 3, z], [u.x1, FONDO, z], [u.x0, FONDO, z]], k % 2 ? 'parquet alt' : 'parquet');
  });
  const alto = 1.1;
  const muros = [
    [0, 2.9, 4, 3.1], [5.2, 2.9, 13, 3.1], [14.2, 2.9, 19, 3.1], [20.2, 2.9, ANCHO, 3.1], // pasillo con puertas
    [9.9, 3, 10.1, FONDO], [16.9, 3, 17.1, FONDO], // entre unidades
    [5.9, 3, 6.1, 9.5], [0, 6.5, 3.6, 6.7], [14.1, 3, 14.3, 8.5], [17, 5.3, 21.5, 5.5], // tabiques
  ];
  muros.sort((a, b) => a[2] + a[3] - (b[2] + b[3]));
  for (const [x0, y0, x1, y1] of muros) s += prisma(x0, y0, z, x1, y1, z + alto, 'tabique');
  for (const u of DISTRIBUCION) {
    const [cx, cy] = iso([(u.x0 + u.x1) / 2, (3 + FONDO) / 2 + 1.5, z]);
    s += `<text class="rotulo" x="${f1(cx)}" y="${f1(cy)}" text-anchor="middle">${u.rotulo}</text>`;
  }
  return s;
}

function plano() {
  // el terreno con su grilla, el contorno de la obra y las cotas
  let s = poligono([[-3, -3, 0], [ANCHO + 3, -3, 0], [ANCHO + 3, FONDO + 3.4, 0], [-3, FONDO + 3.4, 0]], 'terreno');
  for (let x = 0; x <= ANCHO; x += 4) s += poligono([[x, -2.5, 0], [x + 0.04, -2.5, 0], [x + 0.04, FONDO + 3, 0], [x, FONDO + 3, 0]], 'grilla');
  for (let y = 0; y <= FONDO; y += 3.5) s += poligono([[-2.5, y, 0], [ANCHO + 2.5, y, 0], [ANCHO + 2.5, y + 0.04, 0], [-2.5, y + 0.04, 0]], 'grilla');
  const borde = (pts) => poligono(pts, 'contorno');
  s += borde([[0, 0, 0], [ANCHO, 0, 0], [ANCHO, 0.12, 0], [0, 0.12, 0]]);
  s += borde([[0, FONDO - 0.12, 0], [ANCHO, FONDO - 0.12, 0], [ANCHO, FONDO, 0], [0, FONDO, 0]]);
  s += borde([[0, 0, 0], [0.12, 0, 0], [0.12, FONDO, 0], [0, FONDO, 0]]);
  s += borde([[ANCHO - 0.12, 0, 0], [ANCHO, 0, 0], [ANCHO, FONDO, 0], [ANCHO - 0.12, FONDO, 0]]);
  const [ax, ay] = iso([ANCHO / 2, FONDO + 2.4, 0]);
  const [bx, by] = iso([ANCHO + 2.2, FONDO / 2, 0]);
  s += `<text class="cota" x="${f1(ax)}" y="${f1(ay)}" text-anchor="middle">24,00 m</text>`;
  s += `<text class="cota" x="${f1(bx)}" y="${f1(by)}" text-anchor="middle">14,00 m</text>`;
  return s;
}

/**
 * Todas las piezas, en el orden en que se dibujan (de atrás y abajo hacia adelante y arriba).
 * Cada pieza tiene un id que usa la animación.
 */
export function piezas() {
  const out = [{ id: 'plano', svg: plano() }];
  for (let p = 0; p < PISOS; p++) {
    out.push({ id: `losa-${p}`, svg: losa(p) });
    out.push({ id: `columnas-${p}`, svg: columnas(p) });
    out.push({ id: `fachada-${p}`, svg: fachada(p) });
    if (p === PISO_CORTE) out.push({ id: 'planta', svg: planta(p) });
  }
  out.push({ id: 'techo', svg: techo() });
  out.push({ id: 'terraza', svg: terraza() });
  return out;
}

/** El SVG completo. `margen` deja lugar para que las piezas se separen al final sin salirse del cuadro. */
export function svgEdificio({ subir = 0, bajar = 0, margen = 14 } = {}) {
  lim.x0 = lim.y0 = Infinity;
  lim.x1 = lim.y1 = -Infinity;
  const ps = piezas();
  const x = Math.floor(lim.x0 - margen);
  const y = Math.floor(lim.y0 - margen - subir);
  const w = Math.ceil(lim.x1 - lim.x0 + margen * 2);
  const h = Math.ceil(lim.y1 - lim.y0 + margen * 2 + subir + bajar);
  const cuerpo = ps.map((p) => `<g class="pieza" data-pieza="${p.id}">${p.svg}</g>`).join('');
  return { viewBox: [x, y, w, h], svg: `<svg class="edificio" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="Edificio de ocho plantas que se construye mientras bajás: plano, estructura, fachada, terraza y la planta del quinto piso por dentro." focusable="false">${cuerpo}</svg>` };
}
