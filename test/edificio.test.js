import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iso, svgEdificio, piezas, PISOS } from '../site/js/edificio.js';

test('proyección isométrica: subir en z sube en pantalla, x e y van a lados opuestos', () => {
  const o = iso([0, 0, 0]);
  assert.ok(iso([0, 0, 1])[1] < o[1]);
  assert.ok(iso([1, 0, 0])[0] > o[0]);
  assert.ok(iso([0, 1, 0])[0] < o[0]);
});

test('piezas: plano, losas, columnas y fachadas por piso, planta, techo y terraza', () => {
  const ids = piezas().map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['plano', 'planta', 'techo', 'terraza']) assert.ok(ids.includes(id), id);
  for (let piso = 0; piso < PISOS; piso++) {
    for (const t of ['losa', 'columnas', 'fachada']) assert.ok(ids.includes(`${t}-${piso}`));
  }
});

test('el svg tiene un grupo por pieza, sin NaN, y un viewBox que contempla la separación', () => {
  const quieto = svgEdificio();
  const abierto = svgEdificio({ subir: 95, bajar: 26 });
  assert.doesNotMatch(abierto.svg, /NaN|undefined/);
  assert.equal((abierto.svg.match(/data-pieza=/g) || []).length, piezas().length);
  assert.ok(abierto.viewBox[3] > quieto.viewBox[3]);
  assert.ok(abierto.viewBox.every(Number.isFinite));
});
