import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planPagos, mensajeConsulta } from '../site/js/finanzas.js';
import { formatoUsd, formatoArs } from '../site/js/unidades.js';

const base = { precioUsd: 100000, anticipoPct: 40, cuotas: 24, tipoCambio: 1000, cacMensual: 0 };

test('sin ajuste, las cuotas son iguales y suman el saldo', () => {
  const p = planPagos(base);
  assert.equal(p.ok, true);
  assert.equal(p.anticipoUsd, 40000);
  assert.equal(p.saldoArs, 60000000);
  assert.equal(p.cuotaInicial, 2500000);
  assert.equal(p.cuotaFinal, 2500000);
  assert.equal(Math.round(p.totalCuotas), 60000000);
});

test('con CAC, la última cuota es la primera ajustada n-1 veces y el total es la serie geométrica', () => {
  const p = planPagos({ ...base, cacMensual: 2 });
  assert.ok(Math.abs(p.cuotaFinal - p.cuotaInicial * 1.02 ** 23) < 1e-6);
  let suma = 0;
  for (let i = 0; i < 24; i++) suma += p.cuotaInicial * 1.02 ** i;
  assert.ok(Math.abs(p.totalCuotas - suma) < 1e-3);
  assert.ok(p.totalCuotas > p.saldoArs);
});

test('100% de anticipo: sin cuotas, aunque las cuotas no sean válidas', () => {
  const p = planPagos({ ...base, anticipoPct: 100, cuotas: 7 });
  assert.equal(p.ok, true);
  assert.equal(p.cuotas, 0);
  assert.equal(p.saldoUsd, 0);
});

test('validaciones', () => {
  const p = planPagos({ precioUsd: 0, anticipoPct: 10, cuotas: 7, tipoCambio: NaN, cacMensual: -1 });
  assert.equal(p.ok, false);
  assert.deepEqual(Object.keys(p.errores).sort(), ['anticipo', 'cac', 'cuotas', 'precio', 'tipoCambio']);
  assert.equal(planPagos({ ...base, cacMensual: 16 }).ok, false);
  assert.equal(planPagos({ ...base, anticipoPct: 101 }).ok, false);
});

test('mensaje de consulta con y sin simulación', () => {
  const unidad = { id: '3B', nombre: '2 ambientes', piso: 3, precio: 154300 };
  const conCuotas = mensajeConsulta({ nombre: '  Marta ', unidad, plan: planPagos({ ...base, precioUsd: 154300 }), formatoUsd, formatoArs });
  assert.match(conCuotas, /^Hola, soy Marta /);
  assert.match(conCuotas, /24 cuotas desde/);
  const sinNombre = mensajeConsulta({ unidad: null, plan: null, formatoUsd, formatoArs });
  assert.match(sinNombre, /soy un interesado/);
  assert.doesNotMatch(sinNombre, /Unidad/);
  const conError = mensajeConsulta({ unidad, plan: planPagos({ ...base, tipoCambio: 0 }), formatoUsd, formatoArs });
  assert.doesNotMatch(conError, /Simulé/);
});
