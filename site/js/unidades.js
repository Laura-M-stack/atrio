import { TIPOS, PRECIO_M2_BASE, PRECIO_M2_POR_PISO, VENDIDAS, RESERVADAS, PROYECTO } from './datos.js';

/** El balcón se cotiza a la mitad del valor del m² cubierto, como es habitual. */
export function superficieComputable(cubiertos, balcon) {
  return cubiertos + balcon * 0.5;
}

export function precioUnidad(piso, tipo) {
  const t = TIPOS[tipo];
  if (!t || !Number.isInteger(piso) || piso < 1) return NaN;
  const m2 = PRECIO_M2_BASE + PRECIO_M2_POR_PISO * (piso - 1);
  return Math.round((superficieComputable(t.cubiertos, t.balcon) * m2) / 100) * 100;
}

export function estadoUnidad(id) {
  if (VENDIDAS.includes(id)) return 'vendida';
  if (RESERVADAS.includes(id)) return 'reservada';
  return 'disponible';
}

/** Todas las unidades del edificio, de abajo hacia arriba. */
export function listarUnidades(pisos = PROYECTO.pisos) {
  const out = [];
  for (let piso = 1; piso <= pisos; piso++) {
    for (const tipo of Object.keys(TIPOS)) {
      const id = `${piso}${tipo}`;
      out.push({ id, piso, tipo, ...TIPOS[tipo], precio: precioUnidad(piso, tipo), estado: estadoUnidad(id) });
    }
  }
  return out;
}

/**
 * Filtra y ordena. `ambientes` es 'todos' o 1, 2, 3; `orden` es 'piso' o 'precio'.
 * Las vendidas se muestran (sirven para ver cómo se vende) salvo que se pidan solo las disponibles.
 */
export function filtrarUnidades(unidades, { ambientes = 'todos', soloDisponibles = false, orden = 'piso' } = {}) {
  const amb = ambientes === 'todos' ? null : Number(ambientes);
  const lista = unidades.filter((u) => (amb == null || u.ambientes === amb) && (!soloDisponibles || u.estado === 'disponible'));
  const porPiso = (a, b) => a.piso - b.piso || a.tipo.localeCompare(b.tipo);
  return lista.sort(orden === 'precio' ? (a, b) => a.precio - b.precio || porPiso(a, b) : porPiso);
}

export function resumenStock(unidades) {
  const r = { disponible: 0, reservada: 0, vendida: 0 };
  for (const u of unidades) r[u.estado] = (r[u.estado] ?? 0) + 1;
  return r;
}

/**
 * Ambientes de cada tipo, para dibujar el plano visto desde arriba (metros; x hacia la derecha, y hacia abajo).
 * El balcón va siempre abajo, al frente.
 */
const PLANOS = {
  A: [
    { nombre: 'Living comedor', x: 0, y: 3.6, w: 6, h: 5.4 },
    { nombre: 'Cocina', x: 0, y: 0, w: 3.2, h: 3.6 },
    { nombre: 'Baño', x: 3.2, y: 0, w: 2.8, h: 2.2 },
    { nombre: 'Dormitorio', x: 6, y: 0, w: 4, h: 4.2 },
    { nombre: 'Dormitorio principal', x: 6, y: 4.2, w: 4, h: 4.8 },
    { nombre: 'Balcón', x: 0, y: 9, w: 10, h: 0.9 },
  ],
  B: [
    { nombre: 'Living comedor', x: 0, y: 3.4, w: 4.2, h: 4.8 },
    { nombre: 'Cocina', x: 0, y: 0, w: 2.6, h: 3.4 },
    { nombre: 'Baño', x: 2.6, y: 0, w: 1.6, h: 2.4 },
    { nombre: 'Dormitorio', x: 4.2, y: 0, w: 2.8, h: 8.2 },
    { nombre: 'Balcón', x: 0, y: 8.2, w: 7, h: 0.86 },
  ],
  C: [
    { nombre: 'Ambiente único', x: 0, y: 2.4, w: 5.2, h: 5.2 },
    { nombre: 'Kitchenette', x: 0, y: 0, w: 2.8, h: 2.4 },
    { nombre: 'Baño', x: 2.8, y: 0, w: 2.4, h: 2.4 },
    { nombre: 'Balcón', x: 0, y: 7.6, w: 5.2, h: 0.77 },
  ],
};

export function planoUnidad(tipo) {
  return PLANOS[tipo] ?? [];
}

const usd = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const ars = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
export const formatoUsd = (n) => (Number.isFinite(n) ? usd.format(n).replace('US$', 'USD ').replace(/\s+/g, ' ') : '—');
export const formatoArs = (n) => (Number.isFinite(n) ? ars.format(n).replace(/\s+/g, ' ') : '—');
