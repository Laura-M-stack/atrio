import { test } from 'node:test';
import assert from 'node:assert/strict';
import { progresoPista, avanceTramo, tieneTimelineNativo, atarAlScroll } from '../site/js/scrub.js';

test('progreso de la pista', () => {
  assert.equal(progresoPista({ top: 64, height: 3000 }, 800, 64), 0);
  assert.equal(progresoPista({ top: 64 - 1100, height: 3000 }, 800, 64), 0.5);
  assert.equal(progresoPista({ top: -5000, height: 3000 }, 800, 64), 1);
  assert.equal(progresoPista({ top: 500, height: 3000 }, 800, 64), 0);
});

test('progreso con datos raros no rompe', () => {
  assert.equal(progresoPista({ top: 0, height: 500 }, 800), 0);
  assert.equal(progresoPista({ top: NaN, height: 3000 }, 800), 0);
});

test('avance de un tramo', () => {
  assert.equal(avanceTramo(0.1, 0.2, 0.4), 0);
  assert.ok(Math.abs(avanceTramo(0.3, 0.2, 0.4) - 0.5) < 1e-9);
  assert.equal(avanceTramo(0.9, 0.2, 0.4), 1);
  assert.equal(avanceTramo(0.5, 0.5, 0.5), 1);
});

test('en Node no hay línea de tiempo nativa', () => {
  assert.equal(tieneTimelineNativo(), false);
});

test('respaldo: mueve las animaciones según el scroll y se desarma', () => {
  const oyentes = {};
  globalThis.window = {
    addEventListener: (t, f) => { oyentes[t] = f; },
    removeEventListener: (t) => { delete oyentes[t]; },
  };
  globalThis.requestAnimationFrame = (f) => { f(); return 1; };
  globalThis.cancelAnimationFrame = () => {};
  let top = 64;
  const pista = { getBoundingClientRect: () => ({ top, height: 3000 }) };
  const escena = { clientHeight: 800 };
  const anim = { currentTime: 0, pause() {}, cancel() { this.cancelada = true; } };
  const el = { animate: () => anim };
  const r = atarAlScroll(pista, escena, [{ el, momentos: [[0, { opacity: 0 }], [1, { opacity: 1 }]] }], { inset: 64 });
  assert.equal(r.modo, 'respaldo');
  top = 64 - 1100;
  oyentes.scroll?.();
  assert.equal(Math.round(anim.currentTime), 500);
  r.desarmar();
  assert.equal(anim.cancelada, true);
  assert.equal(oyentes.scroll, undefined);
  delete globalThis.window;
});
