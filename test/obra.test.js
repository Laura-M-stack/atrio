import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guion, keyframesDe, estadoEn, CAPITULOS, guionCapitulo, EXPLOTA } from '../site/js/obra.js';
import { piezas, PISO_CORTE, PISOS } from '../site/js/edificio.js';

test('cada pieza del dibujo tiene guion y viceversa', () => {
  const g = guion();
  const ids = piezas().map((p) => p.id);
  assert.deepEqual(Object.keys(g).sort(), [...ids].sort());
});

test('keyframes válidos: offsets entre 0 y 1, crecientes, tramo dentro de [0, 1]', () => {
  for (const [id, momentos] of Object.entries(guion())) {
    const k = keyframesDe(momentos);
    assert.ok(k.a >= 0 && k.b <= 1 && k.b > k.a, id);
    const off = k.keyframes.map((f) => f.offset);
    assert.equal(off[0], 0, id);
    assert.equal(off.at(-1), 1, id);
    for (let i = 1; i < off.length; i++) assert.ok(off[i] >= off[i - 1], id);
  }
});

test('keyframesDe con un solo momento o vacío', () => {
  const uno = keyframesDe([[0.5, { opacity: 1 }]]);
  assert.equal(uno.keyframes.length, 2);
  assert.ok(uno.b > uno.a);
  assert.equal(keyframesDe([]), null);
});

test('al principio no hay edificio y a mitad de camino está completo', () => {
  const g = guion();
  assert.equal(estadoEn(g['losa-7'], 0).opacity, 0);
  assert.equal(estadoEn(g.techo, 0).opacity, 0);
  for (let piso = 0; piso < PISOS; piso++) {
    assert.equal(estadoEn(g[`losa-${piso}`], 0.7).opacity, 1, `losa ${piso}`);
    assert.equal(estadoEn(g[`fachada-${piso}`], 0.7).opacity, 1, `fachada ${piso}`);
  }
  assert.equal(estadoEn(g.terraza, 0.7).opacity, 1);
});

test('al final se abre el piso de corte: arriba sube, abajo baja, la planta se ve', () => {
  const g = guion();
  const fin = EXPLOTA[1];
  assert.ok(estadoEn(g[`losa-${PISO_CORTE + 1}`], fin).y < 0);
  assert.ok(estadoEn(g[`losa-${PISO_CORTE - 1}`], fin).y > 0);
  assert.equal(estadoEn(g[`fachada-${PISO_CORTE}`], fin).opacity, 0);
  assert.equal(estadoEn(g.planta, fin).opacity, 1);
  assert.equal(estadoEn(g.planta, 0.5).opacity, 0);
});

test('los capítulos no se superponen y el primero y el último quedan visibles en los bordes', () => {
  for (let i = 1; i < CAPITULOS.length; i++) assert.ok(CAPITULOS[i][0] >= CAPITULOS[i - 1][1]);
  assert.equal(estadoEn(guionCapitulo(CAPITULOS[0]), 0).opacity, 1);
  assert.equal(estadoEn(guionCapitulo(CAPITULOS.at(-1)), 1).opacity, 1);
  assert.equal(estadoEn(guionCapitulo(CAPITULOS[1]), 0.05).opacity, 0);
  // en cada momento hay como mucho un capítulo totalmente visible
  for (let p = 0; p <= 1; p += 0.01) {
    const visibles = CAPITULOS.filter((c) => estadoEn(guionCapitulo(c), p).opacity > 0.99).length;
    assert.ok(visibles <= 1, `p=${p.toFixed(2)}`);
  }
});
