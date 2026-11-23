import { CUOTAS_POSIBLES, ANTICIPO_MINIMO } from './datos.js';

/**
 * Plan de pagos típico de un departamento en pozo: un anticipo en dólares y el saldo en cuotas en pesos que se
 * ajustan todos los meses por el índice CAC (costo de la construcción). El CAC futuro no se conoce: la persona
 * carga una estimación mensual y el resultado es orientativo.
 */
export function planPagos({ precioUsd, anticipoPct, cuotas, tipoCambio, cacMensual }) {
  const errores = {};
  if (!(precioUsd > 0)) errores.precio = 'Elegí una unidad.';
  if (!Number.isFinite(anticipoPct) || anticipoPct < ANTICIPO_MINIMO || anticipoPct > 100) {
    errores.anticipo = `El anticipo va de ${ANTICIPO_MINIMO}% a 100%.`;
  }
  if (anticipoPct < 100 && !CUOTAS_POSIBLES.includes(cuotas)) errores.cuotas = `Las cuotas pueden ser ${CUOTAS_POSIBLES.join(', ')}.`;
  if (!(tipoCambio > 0)) errores.tipoCambio = 'Cargá la cotización del dólar.';
  if (!Number.isFinite(cacMensual) || cacMensual < 0 || cacMensual > 15) errores.cac = 'El ajuste mensual estimado va de 0% a 15%.';
  if (Object.keys(errores).length) return { ok: false, errores };

  const anticipoUsd = Math.round(precioUsd * (anticipoPct / 100));
  const saldoUsd = precioUsd - anticipoUsd;
  if (saldoUsd <= 0) {
    return { ok: true, errores, anticipoUsd, anticipoArs: anticipoUsd * tipoCambio, saldoUsd: 0, saldoArs: 0, cuotas: 0, cuotaInicial: 0, cuotaFinal: 0, totalCuotas: 0 };
  }
  const saldoArs = saldoUsd * tipoCambio;
  const base = saldoArs / cuotas;
  const c = cacMensual / 100;
  // la primera cuota es la base; cada mes siguiente se ajusta por el CAC estimado
  const totalCuotas = c === 0 ? base * cuotas : (base * ((1 + c) ** cuotas - 1)) / c;
  return {
    ok: true,
    errores,
    anticipoUsd,
    anticipoArs: anticipoUsd * tipoCambio,
    saldoUsd,
    saldoArs,
    cuotas,
    cuotaInicial: base,
    cuotaFinal: base * (1 + c) ** (cuotas - 1),
    totalCuotas,
  };
}

/** Texto para WhatsApp con la unidad elegida y la simulación, para que el vendedor sepa de qué se habla. */
export function mensajeConsulta({ nombre = '', unidad, plan, formatoUsd, formatoArs }) {
  const partes = [`Hola, soy ${nombre.trim() || 'un interesado'} y quiero consultar por el Edificio Ceibo.`];
  if (unidad) partes.push(`Unidad ${unidad.id} (${unidad.nombre}, piso ${unidad.piso}), ${formatoUsd(unidad.precio)}.`);
  if (unidad && plan?.ok) {
    partes.push(
      plan.cuotas
        ? `Simulé un anticipo de ${formatoUsd(plan.anticipoUsd)} y ${plan.cuotas} cuotas desde ${formatoArs(plan.cuotaInicial)}.`
        : `Simulé el pago total de contado: ${formatoUsd(plan.anticipoUsd)}.`,
    );
  }
  partes.push('¿Me pasan más información?');
  return partes.join(' ');
}
