/**
 * Ata animaciones al scroll. Si el navegador tiene líneas de tiempo de scroll nativas (ViewTimeline), las usa:
 * el propio navegador avanza las animaciones mientras scrolleás, sin JavaScript en cada cuadro.
 * Si no, un respaldo calcula el progreso en cada cuadro y mueve las mismas animaciones a mano.
 */
import { keyframesDe } from './obra.js';

const clamp01 = (x) => Math.max(0, Math.min(1, x));

/** Progreso (0 a 1) de una pista alta con un escenario fijo adentro. */
export function progresoPista({ top, height }, altoEscena, offset = 0) {
  const recorrido = height - altoEscena;
  if (![top, height, altoEscena, offset].every(Number.isFinite) || recorrido <= 0) return 0;
  return clamp01((offset - top) / recorrido);
}

/** Qué tan avanzada debe estar una animación que ocupa [a, b] cuando el progreso es p. */
export function avanceTramo(p, a, b) {
  if (!(b > a)) return p >= a ? 1 : 0;
  return clamp01((p - a) / (b - a));
}

export const tieneTimelineNativo = () => typeof window !== 'undefined' && typeof window.ViewTimeline === 'function';

/**
 * items: [{ el, momentos }]. Devuelve una función para desarmar todo (por ejemplo, si se activa reducir movimiento).
 * `escena` es el elemento fijo dentro de la pista; `inset` el alto del encabezado.
 */
export function atarAlScroll(pista, escena, items, { inset = 0, forzarRespaldo = false } = {}) {
  const planes = items.map(({ el, momentos }) => ({ el, k: keyframesDe(momentos) })).filter((x) => x.el && x.k);

  if (tieneTimelineNativo() && !forzarRespaldo) {
    const timeline = new window.ViewTimeline({ subject: pista, axis: 'block', inset: `${inset}px 0px` });
    const anims = planes.map(({ el, k }) =>
      el.animate(k.keyframes, {
        timeline,
        rangeStart: `contain ${(k.a * 100).toFixed(2)}%`,
        rangeEnd: `contain ${(k.b * 100).toFixed(2)}%`,
        fill: 'both',
        easing: 'linear',
      }),
    );
    return { modo: 'nativo', desarmar: () => anims.forEach((a) => a.cancel()) };
  }

  const DUR = 1000;
  const anims = planes.map(({ el, k }) => {
    const a = el.animate(k.keyframes, { duration: DUR, fill: 'both', easing: 'linear' });
    a.pause();
    return { a, k };
  });
  let pendiente = false;
  const pintar = () => {
    pendiente = false;
    const p = progresoPista(pista.getBoundingClientRect(), escena.clientHeight, inset);
    for (const { a, k } of anims) a.currentTime = avanceTramo(p, k.a, k.b) * DUR;
  };
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  };
  window.addEventListener('scroll', pedir, { passive: true });
  window.addEventListener('resize', pedir);
  pintar();
  return {
    modo: 'respaldo',
    desarmar: () => {
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      anims.forEach(({ a }) => a.cancel());
    },
  };
}
