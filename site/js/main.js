import { PROYECTO, AVANCE, CUOTAS_POSIBLES, ANTICIPO_MINIMO } from './datos.js';
import { listarUnidades, filtrarUnidades, resumenStock, planoUnidad, formatoUsd, formatoArs } from './unidades.js';
import { planPagos, mensajeConsulta } from './finanzas.js';
import { svgEdificio } from './edificio.js';
import { guion, guionCapitulo, CAPITULOS, estadoEn, SUBIR, BAJAR } from './obra.js';
import { atarAlScroll } from './scrub.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/* ---------------- Escena del edificio ---------------- */

function iniciarEscena() {
  const raiz = document.documentElement;
  const pista = $('[data-pista]');
  const escena = $('[data-escena]');
  const lienzo = $('[data-edificio]');
  if (!pista || !escena || !lienzo) return;

  lienzo.innerHTML = svgEdificio({ subir: SUBIR, bajar: BAJAR }).svg;
  const piezas = Object.fromEntries($$('[data-pieza]', lienzo).map((g) => [g.dataset.pieza, g]));
  const g = guion();
  const capitulos = $$('[data-capitulo]');
  const riel = $('[data-riel]');
  const bajar = $('.hero__bajar');
  const reducir = matchMedia('(prefers-reduced-motion: reduce)');
  const forzarRespaldo = new URLSearchParams(location.search).has('respaldo');
  let atado = null;

  const items = () => [
    ...Object.entries(g).map(([id, momentos]) => ({ el: piezas[id], momentos })),
    ...capitulos.map((el, i) => ({ el, momentos: guionCapitulo(CAPITULOS[i] ?? [0, 1]) })),
    ...(riel ? [{ el: riel, momentos: [[0, { transform: 'scaleY(0)' }], [1, { transform: 'scaleY(1)' }]] }] : []),
    ...(bajar ? [{ el: bajar, momentos: [[0, { opacity: 1 }], [0.06, { opacity: 0 }], [1, { opacity: 0 }]] }] : []),
  ];

  function estatico() {
    // sin movimiento: el edificio terminado, sin piezas separadas, y los textos uno debajo del otro
    for (const [id, momentos] of Object.entries(g)) {
      const el = piezas[id];
      if (!el) continue;
      const e = estadoEn(momentos, 0.7);
      el.style.opacity = String(e.opacity);
      el.style.transform = `translate(0px, ${e.y}px)`;
    }
  }

  function activar() {
    atado?.desarmar();
    atado = null;
    const alto = parseFloat(getComputedStyle(raiz).getPropertyValue('--alto-header')) || 64;
    if (reducir.matches) {
      raiz.classList.remove('scrub-on');
      estatico();
      return;
    }
    raiz.classList.add('scrub-on');
    for (const el of Object.values(piezas)) el.style.removeProperty('opacity'), el.style.removeProperty('transform');
    atado = atarAlScroll(pista, escena, items(), { inset: alto, forzarRespaldo });
    raiz.dataset.scrub = atado.modo;
  }

  reducir.addEventListener('change', activar);
  activar();
}

/* ---------------- Unidades ---------------- */

const UNIDADES = listarUnidades();
const ESTADO_TXT = { disponible: 'Disponible', reservada: 'Reservada', vendida: 'Vendida' };
let unidadElegida = null;

function planoSvg(tipo) {
  const ambientes = planoUnidad(tipo);
  if (!ambientes.length) return '';
  const E = 30; // px por metro
  const w = Math.max(...ambientes.map((a) => a.x + a.w));
  const h = Math.max(...ambientes.map((a) => a.y + a.h));
  const rects = ambientes
    .map((a) => {
      const balcon = a.nombre === 'Balcón';
      return `<g><rect class="amb${balcon ? ' amb--balcon' : ''}" x="${a.x * E}" y="${a.y * E}" width="${a.w * E}" height="${a.h * E}"/>${
        a.h * E > 26 ? `<text x="${(a.x + a.w / 2) * E}" y="${(a.y + a.h / 2) * E}" text-anchor="middle" dominant-baseline="middle">${esc(a.nombre)}</text>` : ''
      }</g>`;
    })
    .join('');
  return `<svg class="plano-unidad" viewBox="-4 -4 ${w * E + 8} ${h * E + 8}" role="img" aria-label="Plano de la unidad tipo ${tipo}: ${ambientes.map((a) => a.nombre).join(', ')}">${rects}</svg>`;
}

function pintarUnidades() {
  const form = $('[data-filtros]');
  if (!form) return;
  const fd = new FormData(form);
  const lista = filtrarUnidades(UNIDADES, {
    ambientes: fd.get('ambientes') ?? 'todos',
    soloDisponibles: fd.get('disponibles') === 'on',
    orden: fd.get('orden') ?? 'piso',
  });
  const grilla = $('[data-grilla]');
  grilla.innerHTML = lista.length
    ? lista
        .map(
          (u) => `<li><button type="button" class="unidad unidad--${u.estado}" data-unidad="${u.id}" aria-pressed="${unidadElegida?.id === u.id}" ${u.estado === 'vendida' ? 'aria-disabled="true"' : ''}>
            <span class="unidad__id">${u.id}</span>
            <span class="unidad__tipo">${u.nombre} · ${u.cubiertos + u.balcon} m²</span>
            <span class="unidad__precio">${u.estado === 'vendida' ? 'Vendida' : formatoUsd(u.precio)}</span>
            <span class="estado estado--${u.estado}">${ESTADO_TXT[u.estado]}</span>
          </button></li>`,
        )
        .join('')
    : '<li class="vacio">No hay unidades con esos filtros. Probá con otra cantidad de ambientes.</li>';
  const r = resumenStock(UNIDADES);
  $('[data-resumen]').textContent = `${lista.length} de ${UNIDADES.length} unidades · ${r.disponible} disponibles, ${r.reservada} reservadas, ${r.vendida} vendidas`;
}

function mostrarUnidad(id) {
  const u = UNIDADES.find((x) => x.id === id);
  const panel = $('[data-detalle]');
  if (!u || !panel) return;
  if (u.estado === 'vendida') return;
  unidadElegida = u;
  $$('[data-unidad]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unidad === id)));
  panel.innerHTML = `
    <h3>Unidad ${u.id}</h3>
    <p class="detalle__tipo">${u.nombre} · piso ${u.piso} · ${u.orientacion}</p>
    ${planoSvg(u.tipo)}
    <dl class="datos">
      <div><dt>Cubiertos</dt><dd>${u.cubiertos} m²</dd></div>
      <div><dt>Balcón</dt><dd>${u.balcon} m²</dd></div>
      <div><dt>Precio</dt><dd>${formatoUsd(u.precio)}</dd></div>
      <div><dt>Estado</dt><dd>${ESTADO_TXT[u.estado]}</dd></div>
    </dl>
    <div class="detalle__acciones">
      <a class="boton" href="#financiacion" data-simular="${u.id}">Simular cuotas</a>
      <a class="boton boton--borde" href="#contacto" data-consultar="${u.id}">Consultar</a>
    </div>`;
  panel.hidden = false;
  sincronizarSelects(u.id);
  calcular();
}

function sincronizarSelects(id) {
  for (const sel of $$('[data-select-unidad]')) sel.value = id;
}

function opcionesUnidades() {
  const disponibles = UNIDADES.filter((u) => u.estado !== 'vendida');
  const html = `<option value="">Elegí una unidad</option>${disponibles
    .map((u) => `<option value="${u.id}">${u.id} · ${u.nombre} · ${formatoUsd(u.precio)}${u.estado === 'reservada' ? ' (reservada)' : ''}</option>`)
    .join('')}`;
  for (const sel of $$('[data-select-unidad]')) sel.innerHTML = html;
}

/* ---------------- Financiación ---------------- */

function leerNumero(el) {
  const v = Number(String(el?.value ?? '').replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(v) ? v : NaN;
}

function calcular() {
  const form = $('[data-simulador]');
  if (!form) return null;
  const id = form.elements.unidad.value;
  const u = UNIDADES.find((x) => x.id === id) ?? null;
  const plan = planPagos({
    precioUsd: u?.precio ?? 0,
    anticipoPct: leerNumero(form.elements.anticipo),
    cuotas: Number(form.elements.cuotas.value),
    tipoCambio: leerNumero(form.elements.tc),
    cacMensual: leerNumero(form.elements.cac),
  });
  $('[data-anticipo-valor]').textContent = `${form.elements.anticipo.value}%`;
  form.elements.cuotas.disabled = Number(form.elements.anticipo.value) >= 100;
  for (const el of $$('[data-error]', form)) {
    const msg = plan.errores?.[el.dataset.error] ?? '';
    el.textContent = msg;
    const campo = form.elements[el.dataset.campo];
    if (campo) campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }
  const out = $('[data-resultado]');
  if (!plan.ok) {
    out.innerHTML = '<p class="resultado__vacio">Completá los datos para ver el plan de pagos.</p>';
    return { u, plan };
  }
  out.innerHTML = `
    <dl class="resultado">
      <div><dt>Anticipo</dt><dd>${formatoUsd(plan.anticipoUsd)}<small>≈ ${formatoArs(plan.anticipoArs)}</small></dd></div>
      ${
        plan.cuotas
          ? `<div><dt>Saldo en cuotas</dt><dd>${formatoUsd(plan.saldoUsd)}<small>≈ ${formatoArs(plan.saldoArs)} al tipo de cambio de hoy</small></dd></div>
      <div><dt>Primera cuota</dt><dd>${formatoArs(plan.cuotaInicial)}</dd></div>
      <div><dt>Cuota ${plan.cuotas}, estimada</dt><dd>${formatoArs(plan.cuotaFinal)}</dd></div>
      <div><dt>Total en cuotas, estimado</dt><dd>${formatoArs(plan.totalCuotas)}</dd></div>`
          : '<div><dt>Saldo</dt><dd>Pagás todo de contado</dd></div>'
      }
    </dl>`;
  return { u, plan };
}

/* ---------------- Contacto ---------------- */

function actualizarMensaje() {
  const form = $('[data-contacto]');
  if (!form) return;
  const id = form.elements.unidad.value;
  const u = UNIDADES.find((x) => x.id === id) ?? null;
  const sim = calcular();
  const plan = sim && sim.u && u && sim.u.id === u.id ? sim.plan : null;
  const texto = mensajeConsulta({ nombre: form.elements.nombre.value, unidad: u, plan, formatoUsd, formatoArs });
  $('[data-vista-mensaje]').textContent = texto;
  $('[data-whatsapp]').href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

/* ---------------- Avance de obra ---------------- */

function pintarAvance() {
  const lista = $('[data-avance]');
  if (!lista) return;
  lista.innerHTML = AVANCE.map(
    (a) => `<li class="avance__fila"><span class="avance__etapa">${esc(a.etapa)}</span><span class="avance__barra" role="progressbar" aria-label="${esc(a.etapa)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${a.avance}"><span class="avance__lleno" style="--avance:${a.avance / 100}"></span></span><span class="avance__pct">${a.avance}%</span></li>`,
  ).join('');
}

/* ---------------- Inicio ---------------- */

function iniciar() {
  iniciarEscena();
  opcionesUnidades();
  pintarUnidades();
  pintarAvance();

  $('[data-filtros]')?.addEventListener('change', pintarUnidades);
  $('[data-grilla]')?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-unidad]');
    if (b) mostrarUnidad(b.dataset.unidad);
  });
  $('[data-detalle]')?.addEventListener('click', (e) => {
    const s = e.target.closest('[data-simular], [data-consultar]');
    if (s) sincronizarSelects(s.dataset.simular ?? s.dataset.consultar), calcular(), actualizarMensaje();
  });

  const sim = $('[data-simulador]');
  sim?.elements.cuotas && (sim.elements.cuotas.innerHTML = CUOTAS_POSIBLES.map((c) => `<option value="${c}"${c === 36 ? ' selected' : ''}>${c} cuotas</option>`).join(''));
  if (sim) sim.elements.anticipo.min = String(ANTICIPO_MINIMO);
  sim?.addEventListener('input', () => {
    calcular();
    actualizarMensaje();
  });
  sim?.addEventListener('submit', (e) => e.preventDefault());
  sim?.elements.unidad.addEventListener('change', (e) => sincronizarSelects(e.target.value));

  const contacto = $('[data-contacto]');
  contacto?.addEventListener('input', actualizarMensaje);
  contacto?.elements.unidad.addEventListener('change', (e) => sincronizarSelects(e.target.value));
  contacto?.addEventListener('submit', (e) => {
    e.preventDefault();
    actualizarMensaje();
    window.open($('[data-whatsapp]').href, '_blank', 'noopener');
  });

  calcular();
  actualizarMensaje();
  $$('[data-anio]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  $$('[data-entrega]').forEach((el) => (el.textContent = PROYECTO.entrega));
}

iniciar();
