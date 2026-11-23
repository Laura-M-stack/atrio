import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TIPOS, VENDIDAS, RESERVADAS, PROYECTO } from '../site/js/datos.js';
import { superficieComputable, precioUnidad, estadoUnidad, listarUnidades, filtrarUnidades, resumenStock, planoUnidad, formatoUsd, formatoArs } from '../site/js/unidades.js';

test('el balcón computa la mitad', () => {
  assert.equal(superficieComputable(86, 9), 90.5);
});

test('el precio sube con el piso y se redondea a 100', () => {
  const p1 = precioUnidad(1, 'A');
  const p7 = precioUnidad(7, 'A');
  assert.ok(p7 > p1);
  assert.equal(p1 % 100, 0);
  assert.equal(p7 % 100, 0);
});

test('precio inválido para tipo o piso inexistente', () => {
  assert.ok(Number.isNaN(precioUnidad(1, 'Z')));
  assert.ok(Number.isNaN(precioUnidad(0, 'A')));
  assert.ok(Number.isNaN(precioUnidad(2.5, 'A')));
});

test('hay 3 unidades por piso y los ids no se repiten', () => {
  const u = listarUnidades();
  assert.equal(u.length, PROYECTO.pisos * Object.keys(TIPOS).length);
  assert.equal(new Set(u.map((x) => x.id)).size, u.length);
});

test('las listas de vendidas y reservadas existen y no se pisan', () => {
  const ids = new Set(listarUnidades().map((x) => x.id));
  for (const id of [...VENDIDAS, ...RESERVADAS]) assert.ok(ids.has(id), `${id} no existe`);
  assert.equal(VENDIDAS.filter((id) => RESERVADAS.includes(id)).length, 0);
  assert.equal(estadoUnidad('1A'), 'vendida');
  assert.equal(estadoUnidad('2A'), 'reservada');
  assert.equal(estadoUnidad('4A'), 'disponible');
});

test('filtros por ambientes y disponibilidad', () => {
  const u = listarUnidades();
  const tres = filtrarUnidades(u, { ambientes: '3', soloDisponibles: true });
  assert.deepEqual(tres.map((x) => x.id), ['4A', '5A', '6A']);
  assert.equal(filtrarUnidades(u, { ambientes: 'todos' }).length, u.length);
});

test('ordenar por precio no modifica la lista original', () => {
  const u = listarUnidades();
  const antes = u.map((x) => x.id).join();
  const porPrecio = filtrarUnidades(u, { orden: 'precio' });
  for (let i = 1; i < porPrecio.length; i++) assert.ok(porPrecio[i - 1].precio <= porPrecio[i].precio);
  assert.equal(u.map((x) => x.id).join(), antes);
});

test('resumen de stock suma el total', () => {
  const r = resumenStock(listarUnidades());
  assert.equal(r.disponible + r.reservada + r.vendida, 21);
  assert.equal(r.vendida, VENDIDAS.length);
  assert.equal(r.reservada, RESERVADAS.length);
});

test('el plano de cada tipo suma aproximadamente sus m² cubiertos', () => {
  for (const [tipo, t] of Object.entries(TIPOS)) {
    const amb = planoUnidad(tipo).filter((a) => a.nombre !== 'Balcón');
    const total = amb.reduce((s, a) => s + a.w * a.h, 0);
    assert.ok(Math.abs(total - t.cubiertos) / t.cubiertos < 0.06, `${tipo}: ${total.toFixed(1)} vs ${t.cubiertos}`);
  }
  assert.deepEqual(planoUnidad('Z'), []);
});

test('formatos de moneda', () => {
  assert.match(formatoUsd(154300), /^USD 154\.300$/);
  assert.match(formatoArs(3857500), /3\.857\.500/);
  assert.equal(formatoUsd(NaN), '—');
  assert.equal(formatoArs(undefined), '—');
});
