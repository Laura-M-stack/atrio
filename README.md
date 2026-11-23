# Atrio Desarrollos · Edificio Ceibo

Sitio de demostración de un desarrollo inmobiliario (negocio ficticio). El hero cuenta la obra con el scroll: el terreno, la estructura piso por piso, la fachada, la terraza y, al final, el edificio se abre en el quinto piso para mostrar las unidades por dentro.

Demo: https://laura-m-stack.github.io/atrio/

## Qué muestra

- **Animación guiada por el scroll (scroll-linked).** Usa las líneas de tiempo de scroll nativas del navegador (`ViewTimeline` + Web Animations): el navegador avanza las animaciones en el hilo del compositor, sin JavaScript en cada cuadro. Donde no existen, un respaldo mueve las mismas animaciones con `requestAnimationFrame`. Para probar el respaldo: `?respaldo` en la URL.
- **Ilustración isométrica generada con código.** El edificio es un SVG armado desde un modelo 3D simple (prismas proyectados), así que las medidas, los pisos y las unidades salen de los mismos datos.
- **Unidades con filtros, estado de stock y plano** de cada tipología.
- **Simulador de financiación**: anticipo en dólares y cuotas en pesos ajustadas por CAC, con validaciones y el caso de pago de contado.
- **Consulta por WhatsApp** con la unidad y la simulación ya escritas en el mensaje.
- Accesibilidad: con "reducir movimiento" el hero muestra el edificio terminado sin animación; foco visible, objetivos táctiles de 44 px, contraste AA.

## Uso

```powershell
npm test     # tests de cálculo de precios, cuotas, guion de la animación y respaldo del scroll
npm start    # http://localhost:4174
```

Sin dependencias: HTML, CSS y JavaScript con módulos nativos. Node 20 o superior solo para los tests y el servidor local.

## Estructura

```
site/
  index.html
  css/styles.css
  js/datos.js       datos del proyecto, tipologías, stock
  js/unidades.js    precios, filtros, planos
  js/finanzas.js    plan de pagos y mensaje de consulta
  js/edificio.js    modelo isométrico y SVG
  js/obra.js        guion: qué pieza aparece en qué momento del scroll
  js/scrub.js       ata las animaciones al scroll (nativo o respaldo)
  js/main.js        arma la página
test/
scripts/serve.mjs
```

Diseño y desarrollo: [Laura Moyano](https://laura-moyano-web.pages.dev/).
