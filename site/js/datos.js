// Datos del emprendimiento. Es un negocio ficticio: los precios y las fechas son de ejemplo.

export const PROYECTO = {
  desarrolladora: 'Atrio Desarrollos',
  edificio: 'Edificio Ceibo',
  barrio: 'Pichincha, Rosario',
  entrega: 'diciembre de 2028',
  pisos: 7, // pisos de departamentos, sin contar la planta baja
  superficieTotal: 2140, // m² construidos
  amenities: ['Terraza con pileta y solárium', 'Huerta compartida', 'Bicicletero cubierto', 'Laundry', 'Cocheras en subsuelo (opcionales)'],
};

// Los tres tipos de departamento que se repiten en cada piso.
export const TIPOS = {
  A: { letra: 'A', ambientes: 3, nombre: '3 ambientes', cubiertos: 86, balcon: 9, orientacion: 'Norte, al frente' },
  B: { letra: 'B', ambientes: 2, nombre: '2 ambientes', cubiertos: 58, balcon: 6, orientacion: 'Norte, al frente' },
  C: { letra: 'C', ambientes: 1, nombre: 'Monoambiente', cubiertos: 38, balcon: 4, orientacion: 'Este, lateral' },
};

export const PRECIO_M2_BASE = 2450; // USD por m² en el primer piso
export const PRECIO_M2_POR_PISO = 40; // cada piso más arriba suma esto por m²

// Estado comercial de ejemplo. Lo que no figura está disponible.
export const VENDIDAS = ['1A', '1B', '2C', '3A', '4B', '5C', '7A'];
export const RESERVADAS = ['2A', '6C', '6B'];

export const CUOTAS_POSIBLES = [12, 24, 36, 48];
export const ANTICIPO_MINIMO = 30; // %

export const AVANCE = [
  { etapa: 'Excavación y bases', avance: 100 },
  { etapa: 'Estructura de hormigón', avance: 62 },
  { etapa: 'Mampostería', avance: 20 },
  { etapa: 'Instalaciones', avance: 5 },
  { etapa: 'Terminaciones', avance: 0 },
];
