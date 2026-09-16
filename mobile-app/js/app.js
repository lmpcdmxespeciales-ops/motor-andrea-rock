/* ==========================================================================
   ANDREA ROCK FITNESS — APP ENGINE COMPLETO (mobile-app/js/app.js)
   Protección estricta (ANDREAROCK2026), Hidratación, SMAE, Red Mundial OFF,
   Cartelera Multi-disciplina, Persistencia Local y Sincronización API Backend.
   ========================================================================== */

/* ===================== CONFIGURACIÓN DE ENDPOINTS Y API ===================== */
const API_BASE_URL = (typeof window !== 'undefined' && window.location.hostname.includes('andrearockfitness.com'))
  ? 'https://andrearockfitness.com/api'
  : 'http://localhost:3000/api';

const CLAVE_ENTRENADORA_OFICIAL = 'ANDREAROCK2026';

/* ===================== ESTADO Y CONFIGURACIÓN GLOBAL ===================== */
let sesionCodigo = localStorage.getItem('ar_sesion_codigo') || null;
let esEntrenadora = localStorage.getItem('ar_es_entrenadora') === 'true';
let clienteActivoCod = localStorage.getItem('ar_cliente_activo') || 'RCK-10001';
let diaActivoIdx = 0;
let timerSeconds = 0;
let timerInterval = null;
let debounceTimerSearch = null;
let rmDiasTemp = [];

/* HELPER PARA GENERACIÓN AUTOMÁTICA DE TOKENS ÚNICOS RCK-XXXXX */
function generarTokenUnico() {
  return 'RCK-' + Math.floor(10000 + Math.random() * 90000);
}

/* BANCO GLOBAL DE EJERCICIOS Y DISCIPLINAS EXTENDIDO */
const BANCO_EJERCICIOS_DEFAULT = {
  Pecho: [
    'Press banca con barra', 'Press inclinado con mancuernas', 'Press declinado',
    'Aperturas en polea alta', 'Fondos en paralelas (Dips)', 'Press en máquina Chest Press',
    'Pullover con mancuerna', 'Flexiones (Push-ups)'
  ],
  Espalda: [
    'Remo con barra pronado/supinado', 'Jalón al pecho agarre abierto/neutro',
    'Peso muerto convencional', 'Remo en polea baja con agarre V', 'Dominadas neutras/pronadas',
    'Remo Seal Row', 'Remo Unilateral con mancuerna', 'Face pull'
  ],
  Cuádriceps: [
    'Sentadilla libre trasera', 'Sentadilla frontal', 'Sentadilla Búlgara',
    'Prensa de piernas 45°', 'Extensión de cuádriceps en máquina', 'Sentadilla Hack', 'Sissi Squat'
  ],
  'Isquiotibiales / Femoral': [
    'Peso muerto Rumano (RDL)', 'Curl femoral acostado', 'Curl femoral sentado',
    'Buenos días con barra', 'Nordic Hamstring Curl'
  ],
  Glúteo: [
    'Hip Thrust con barra', 'Kas Glute Bridge', 'Patada de glúteo en polea',
    'Abducción de cadera en máquina', 'Prensa de piernas agarre alto'
  ],
  Hombro: [
    'Press militar de pie con barra', 'Press Arnold con mancuernas', 'Elevaciones laterales con polea',
    'Elevaciones laterales con mancuernas', 'Pájaro / Pájaros en polea posterior', 'Press sentado en máquina'
  ],
  Bíceps: [
    'Curl de bíceps con barra Z', 'Curl martillo con mancuernas', 'Curl en banco Predicador',
    'Curl inclinado con mancuernas', 'Curl concentrado'
  ],
  Tríceps: [
    'Extensión en polea con cuerda', 'Press francés con barra Z', 'Copas / Extensión vertical sobre la cabeza',
    'Patada de tríceps', 'Fondos entre bancos'
  ],
  'Core / Abdominales': [
    'Plancha isométrica', 'Rueda abdominal (Ab Wheel)', 'Elevación de piernas colgado',
    'Crunch en polea alta', 'Russian Twists con disco'
  ],
  'Powerlifting / Fuerza': [
    'Sentadilla de competición', 'Press de banca con pausa', 'Peso muerto Sumo', 'Peso muerto Convencional'
  ],
  'Halterofilia / Olímpico': [
    'Snatch (Arrancada)', 'Clean and Jerk (Envión)', 'Power Clean', 'Hang Snatch', 'Push Press'
  ],
  'CrossFit / WOD': [
    'Wall Balls', 'Box Jumps', 'Burpees over bar', 'Toes to Bar (T2B)', 'Double Unders', 'Thrusters', 'Kettlebell Swings'
  ],
  'Calistenia / Peso Corporal': [
    'Muscle-up en barra', 'Handstand Push-ups', 'Pino / Handstand hold', 'Front Lever', 'Planis / Planche'
  ],
  'Cardio / Acondicionamiento': [
    'Sprints en caminadora', 'Remo Concept2 (Ergómetro)', 'Assault Bike', 'Saltos a la cuerda', 'Burpees'
  ]
};

let bancoEjercicios = JSON.parse(JSON.stringify(BANCO_EJERCICIOS_DEFAULT));

/* CARTELERA DE RUTINAS ESTRUCTURADAS (%1RM, FUERZA, HIPERTROFIA, CROSSFIT) */
const PLANTILLAS_DEFAULT = {
  powerlifting: {
    nombre: 'Powerlifting Competencia (Fuerza)',
    descripcion: 'Enfoque en los 3 movimientos principales con pausa y accesorios de fuerza.',
    dias: [
      {
        nombre: 'Día 1 — Sentadilla & Banca',
        ejercicios: [
          { nombre: 'Sentadilla de competición', grupo: 'Powerlifting / Fuerza', videoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', series: [{ peso: 100, reps: 5, hecha: false }, { peso: 110, reps: 5, hecha: false }, { peso: 120, reps: 3, hecha: false }] },
          { nombre: 'Press de banca con pausa', grupo: 'Powerlifting / Fuerza', videoUrl: '', series: [{ peso: 70, reps: 5, hecha: false }, { peso: 80, reps: 5, hecha: false }, { peso: 85, reps: 3, hecha: false }] },
          { nombre: 'Press militar de pie con barra', grupo: 'Hombro', videoUrl: '', series: [{ peso: 40, reps: 8, hecha: false }, { peso: 45, reps: 8, hecha: false }] }
        ]
      },
      {
        nombre: 'Día 2 — Peso Muerto & Accesorios',
        ejercicios: [
          { nombre: 'Peso muerto Convencional', grupo: 'Powerlifting / Fuerza', videoUrl: '', series: [{ peso: 130, reps: 5, hecha: false }, { peso: 145, reps: 3, hecha: false }] },
          { nombre: 'Remo Seal Row', grupo: 'Espalda', videoUrl: '', series: [{ peso: 50, reps: 10, hecha: false }, { peso: 55, reps: 10, hecha: false }] }
        ]
      }
    ]
  },
  hipertrofia: {
    nombre: 'Hipertrofia Muscular (Volumen)',
    descripcion: 'Rutina optimizada para ganancia de masa muscular en rango de 8-12 repeticiones.',
    dias: [
      {
        nombre: 'Día 1 — Torso (Empuje/Tracción)',
        ejercicios: [
          { nombre: 'Press inclinado con mancuernas', grupo: 'Pecho', videoUrl: '', series: [{ peso: 24, reps: 10, hecha: false }, { peso: 26, reps: 10, hecha: false }, { peso: 28, reps: 8, hecha: false }] },
          { nombre: 'Jalón al pecho agarre abierto/neutro', grupo: 'Espalda', videoUrl: '', series: [{ peso: 50, reps: 12, hecha: false }, { peso: 55, reps: 10, hecha: false }] },
          { nombre: 'Elevaciones laterales con polea', grupo: 'Hombro', videoUrl: '', series: [{ peso: 10, reps: 15, hecha: false }, { peso: 10, reps: 15, hecha: false }] }
        ]
      },
      {
        nombre: 'Día 2 — Pierna & Glúteo Enfocado',
        ejercicios: [
          { nombre: 'Sentadilla Búlgara', grupo: 'Cuádriceps', videoUrl: '', series: [{ peso: 16, reps: 10, hecha: false }, { peso: 18, reps: 10, hecha: false }] },
          { nombre: 'Hip Thrust con barra', grupo: 'Glúteo', videoUrl: '', series: [{ peso: 80, reps: 12, hecha: false }, { peso: 90, reps: 10, hecha: false }] },
          { nombre: 'Peso muerto Rumano (RDL)', grupo: 'Isquiotibiales / Femoral', videoUrl: '', series: [{ peso: 60, reps: 10, hecha: false }, { peso: 70, reps: 10, hecha: false }] }
        ]
      }
    ]
  },
  fuerza_maxima: {
    nombre: 'Fuerza Máxima (Protocolo 5x5)',
    descripcion: 'Progreso lineal de tensión mecánica para incremento acelerado de fuerza en barra.',
    dias: [
      {
        nombre: 'Día A — Sentadilla, Banca & Remo',
        ejercicios: [
          { nombre: 'Sentadilla libre trasera', grupo: 'Cuádriceps', videoUrl: '', series: Array(5).fill(0).map(() => ({ peso: 90, reps: 5, hecha: false })) },
          { nombre: 'Press banca con barra', grupo: 'Pecho', videoUrl: '', series: Array(5).fill(0).map(() => ({ peso: 70, reps: 5, hecha: false })) },
          { nombre: 'Remo con barra pronado/supinado', grupo: 'Espalda', videoUrl: '', series: Array(5).fill(0).map(() => ({ peso: 60, reps: 5, hecha: false })) }
        ]
      }
    ]
  },
  crossfit_wod: {
    nombre: 'CrossFit & Conditioning (WOD)',
    descripcion: 'Acondicionamiento metcon, alta densidad metabólica y fuerza gimnástica/olímpica.',
    dias: [
      {
        nombre: 'WOD 1 — AMRAP 15 min (Potencia)',
        ejercicios: [
          { nombre: 'Power Clean', grupo: 'Halterofilia / Olímpico', videoUrl: '', series: [{ peso: 50, reps: 10, hecha: false }, { peso: 50, reps: 10, hecha: false }] },
          { nombre: 'Thrusters', grupo: 'CrossFit / WOD', videoUrl: '', series: [{ peso: 40, reps: 12, hecha: false }, { peso: 40, reps: 12, hecha: false }] },
          { nombre: 'Burpees over bar', grupo: 'CrossFit / WOD', videoUrl: '', series: [{ peso: 0, reps: 15, hecha: false }] }
        ]
      }
    ]
  }
};

let plantillas = JSON.parse(JSON.stringify(PLANTILLAS_DEFAULT));

let discoInventario = {
  unidad: 'kg',
  barraPeso: 20,
  seguroPeso: 2.5,
  discos: [
    { peso: 25, cantidad: 8 },
    { peso: 20, cantidad: 6 },
    { peso: 15, cantidad: 4 },
    { peso: 10, cantidad: 6 },
    { peso: 5, cantidad: 6 },
    { peso: 2.5, cantidad: 4 },
    { peso: 1.25, cantidad: 4 }
  ]
};

const GRUPOS_NUTRICION_BASE = [
  { id: 'verduras',    nombre: 'Verduras',        color: '#34d399', kcal: 25,  carbs: 4,  prot: 2, grasa: 0, porciones: 0 },
  { id: 'frutas',      nombre: 'Frutas',          color: '#f2b84b', kcal: 60,  carbs: 15, prot: 0, grasa: 0, porciones: 0 },
  { id: 'cereales',    nombre: 'Cereales',        color: '#e0a13d', kcal: 70,  carbs: 15, prot: 2, grasa: 0, porciones: 0 },
  { id: 'leguminosas', nombre: 'Leguminosas',     color: '#8a6d3b', kcal: 120, carbs: 20, prot: 8, grasa: 1, porciones: 0 },
  { id: 'proteinas',   nombre: 'Proteínas (AOA)', color: '#e6297a', kcal: 75,  carbs: 0,  prot: 7, grasa: 5, porciones: 0 },
  { id: 'lacteos',     nombre: 'Lácteos',         color: '#b48bea', kcal: 95,  carbs: 12, prot: 9, grasa: 2, porciones: 0 },
  { id: 'grasas',      nombre: 'Grasas / aceites',color: '#8b5cf6', kcal: 45,  carbs: 0,  prot: 0, grasa: 5, porciones: 0 },
  { id: 'azucares',    nombre: 'Azúcares',        color: '#f472b6', kcal: 40,  carbs: 10, prot: 0, grasa: 0, porciones: 0 },
  { id: 'moderados',   nombre: 'Moderados',       color: '#94a3b8', kcal: 90,  carbs: 12, prot: 2, grasa: 3, porciones: 0 }
];

/* DICCIONARIO NUTRICIONAL BASE DE ALIMENTOS Y BEBIDAS */
const DICCIONARIO_NUTRIMENTAL = {
  'soya texturizada (deshidratada)': { kcal100g: 336, carbs100g: 30, prot100g: 52, grasa100g: 1.2, pesoPza: 100, pesoTaza: 50, pesoPorcion: 25 },
  'soya texturizada':                { kcal100g: 336, carbs100g: 30, prot100g: 52, grasa100g: 1.2, pesoPza: 100, pesoTaza: 50, pesoPorcion: 25 },
  'pechuga de pollo (cocida)':      { kcal100g: 165, carbs100g: 0,  prot100g: 31, grasa100g: 3.6, pesoPza: 120, pesoTaza: 140, pesoPorcion: 30 },
  'pechuga de pollo':               { kcal100g: 165, carbs100g: 0,  prot100g: 31, grasa100g: 3.6, pesoPza: 120, pesoTaza: 140, pesoPorcion: 30 },
  'atún en agua':                    { kcal100g: 116, carbs100g: 0,  prot100g: 26, grasa100g: 1.0, pesoPza: 100, pesoTaza: 150, pesoPorcion: 30 },
  'carne magra de res':              { kcal100g: 217, carbs100g: 0,  prot100g: 26, grasa100g: 11.0, pesoPza: 150, pesoTaza: 140, pesoPorcion: 30 },
  'pescado blanco (filete)':         { kcal100g: 90,  carbs100g: 0,  prot100g: 19, grasa100g: 1.2, pesoPza: 120, pesoTaza: 140, pesoPorcion: 30 },
  'huevo entero':                    { kcal100g: 155, carbs100g: 1.1,prot100g: 13, grasa100g: 11.0, pesoPza: 50,  pesoTaza: 200, pesoPorcion: 50 },
  'clara de huevo':                  { kcal100g: 52,  carbs100g: 0.7,prot100g: 11, grasa100g: 0.2, pesoPza: 33,  pesoTaza: 240, pesoPorcion: 100 },
  'queso panela':                    { kcal100g: 240, carbs100g: 3.0,prot100g: 18, grasa100g: 17.0, pesoPza: 30,  pesoTaza: 130, pesoPorcion: 30 },
  'queso cottage':                   { kcal100g: 98,  carbs100g: 3.4,prot100g: 11, grasa100g: 4.3, pesoPza: 100, pesoTaza: 220, pesoPorcion: 50 },
  'tofu firme':                      { kcal100g: 144, carbs100g: 2.8,prot100g: 15, grasa100g: 8.0, pesoPza: 100, pesoTaza: 200, pesoPorcion: 60 },
  'tempeh':                          { kcal100g: 193, carbs100g: 9.0,prot100g: 19, grasa100g: 11.0, pesoPza: 100, pesoTaza: 160, pesoPorcion: 35 },
  'seitán':                          { kcal100g: 370, carbs100g: 14, prot100g: 75, grasa100g: 1.9, pesoPza: 100, pesoTaza: 150, pesoPorcion: 30 },
  'arroz cocido':                    { kcal100g: 130, carbs100g: 28, prot100g: 2.7,grasa100g: 0.3, pesoPza: 100, pesoTaza: 160, pesoPorcion: 80 },
  'avena en hojuelas':               { kcal100g: 389, carbs100g: 66, prot100g: 17, grasa100g: 7.0, pesoPza: 100, pesoTaza: 90,  pesoPorcion: 30 },
  'tortilla de maíz':                { kcal100g: 218, carbs100g: 45, prot100g: 5.7,grasa100g: 2.8, pesoPza: 30,  pesoTaza: 100, pesoPorcion: 30 },
  'pan integral':                    { kcal100g: 247, carbs100g: 41, prot100g: 13, grasa100g: 3.4, pesoPza: 30,  pesoTaza: 100, pesoPorcion: 30 },
  'quinoa cocida':                   { kcal100g: 120, carbs100g: 21, prot100g: 4.4,grasa100g: 1.9, pesoPza: 100, pesoTaza: 185, pesoPorcion: 60 },
  'papa cocida':                     { kcal100g: 87,  carbs100g: 20, prot100g: 1.9,grasa100g: 0.1, pesoPza: 150, pesoTaza: 150, pesoPorcion: 100 },
  'lentejas cocidas':                { kcal100g: 116, carbs100g: 20, prot100g: 9.0,grasa100g: 0.4, pesoPza: 100, pesoTaza: 200, pesoPorcion: 100 },
  'aceite de oliva':                 { kcal100g: 884, carbs100g: 0,  prot100g: 0,  grasa100g: 100, pesoPza: 5,   pesoTaza: 200, pesoPorcion: 5 },
  'aguacate':                        { kcal100g: 160, carbs100g: 8.5,prot100g: 2.0,grasa100g: 15.0, pesoPza: 150, pesoTaza: 150, pesoPorcion: 30 },
  'almendras / nueces':              { kcal100g: 579, carbs100g: 22, prot100g: 21, grasa100g: 50.0, pesoPza: 1.2, pesoTaza: 140, pesoPorcion: 15 },
  'verduras al gusto':              { kcal100g: 25,  carbs100g: 4.0,prot100g: 2.0,grasa100g: 0.2, pesoPza: 100, pesoTaza: 100, pesoPorcion: 100 },
  'electrolit suero rehidrante':     { kcal100g: 20,  carbs100g: 5.0,prot100g: 0,   grasa100g: 0,   pesoPza: 625, pesoTaza: 240, pesoPorcion: 250 },
  'gatorade bebida deportiva':       { kcal100g: 24,  carbs100g: 6.0,prot100g: 0,   grasa100g: 0,   pesoPza: 500, pesoTaza: 240, pesoPorcion: 250 },
  'coca-cola zero / sin azúcar':     { kcal100g: 0,   carbs100g: 0,  prot100g: 0,   grasa100g: 0,   pesoPza: 355, pesoTaza: 240, pesoPorcion: 355 },
  'leche lala entera':               { kcal100g: 62,  carbs100g: 4.8,prot100g: 3.1,grasa100g: 3.3, pesoPza: 240, pesoTaza: 240, pesoPorcion: 240 },
  'leche lala descremada':           { kcal100g: 36,  carbs100g: 4.9,prot100g: 3.2,grasa100g: 0.2, pesoPza: 240, pesoTaza: 240, pesoPorcion: 240 },
  'proteína whey isolate':           { kcal100g: 370, carbs100g: 3.0,prot100g: 85, grasa100g: 1.5, pesoPza: 30,  pesoTaza: 120, pesoPorcion: 30 },
  'monster energy ultra zero':       { kcal100g: 2,   carbs100g: 0.5,prot100g: 0,   grasa100g: 0,   pesoPza: 473, pesoTaza: 240, pesoPorcion: 473 },
  'cerveza heineken 0.0':            { kcal100g: 21,  carbs100g: 4.8,prot100g: 0.4,grasa100g: 0,   pesoPza: 355, pesoTaza: 240, pesoPorcion: 355 }
};

const CATALOGO_ALIMENTOS_SMAE = {
  proteinas: {
    omnivora: [
      { nombre: 'Pechuga de pollo (cocida)', cantidad: 100, unidad: 'g' },
      { nombre: 'Atún en agua', cantidad: 1, unidad: 'pza' },
      { nombre: 'Carne magra de res', cantidad: 100, unidad: 'g' },
      { nombre: 'Pescado blanco (filete)', cantidad: 120, unidad: 'g' }
    ],
    vegetariana: [
      { nombre: 'Clara de huevo', cantidad: 3, unidad: 'pza' },
      { nombre: 'Huevo entero', cantidad: 1, unidad: 'pza' },
      { nombre: 'Queso panela', cantidad: 50, unidad: 'g' },
      { nombre: 'Queso cottage', cantidad: 0.5, unidad: 'taza' }
    ],
    vegana: [
      { nombre: 'Tofu firme', cantidad: 100, unidad: 'g' },
      { nombre: 'Soya texturizada (deshidratada)', cantidad: 30, unidad: 'g' },
      { nombre: 'Tempeh', cantidad: 60, unidad: 'g' },
      { nombre: 'Seitán', cantidad: 50, unidad: 'g' }
    ]
  },
  cereales: {
    estandar: [
      { nombre: 'Arroz cocido', cantidad: 1, unidad: 'taza' },
      { nombre: 'Avena en hojuelas', cantidad: 40, unidad: 'g' },
      { nombre: 'Tortilla de maíz', cantidad: 2, unidad: 'pza' },
      { nombre: 'Pan integral', cantidad: 2, unidad: 'pza' }
    ],
    sin_gluten: [
      { nombre: 'Arroz cocido', cantidad: 1, unidad: 'taza' },
      { nombre: 'Tortilla de maíz', cantidad: 2, unidad: 'pza' },
      { nombre: 'Quinoa cocida', cantidad: 1, unidad: 'taza' },
      { nombre: 'Papa cocida', cantidad: 1, unidad: 'pza' }
    ],
    diabetica: [
      { nombre: 'Quinoa cocida', cantidad: 1, unidad: 'taza' },
      { nombre: 'Avena en hojuelas', cantidad: 30, unidad: 'g' },
      { nombre: 'Lentejas cocidas', cantidad: 1, unidad: 'taza' }
    ]
  }
};

let nutTargets = { kcal: 1994, carbs: 199, prot: 100, grasa: 89 };

/* PERSISTENCIA Y CARGA DE DATOS DESDE LOCALSTORAGE */
let roster = JSON.parse(localStorage.getItem('ar_roster_data') || '{}');
if (!roster['RCK-10001']) {
  roster['RCK-10001'] = {
    code: 'RCK-10001',
    nombre: 'Cliente Demo',
    unidad: 'kg',
    preferencia: 'sin_restriccion',
    hidroVasos: 0,
    rachaDias: 0,
    recordRacha: 0,
    semanaPlan: 1,
    horasEntrenadas: 0,
    vigenciaMembresia: '31/12/2026',
    miembroDesde: '01/01/2026',
    datosNutricion: { peso: 85, altura: 183, edad: 37, sexo: 'hombre', actividad: 1.375, objetivo: -500 },
    gruposNut: JSON.parse(JSON.stringify(GRUPOS_NUTRICION_BASE)),
    menuNut: [
      {
        id: 1,
        nombre: 'Desayuno',
        alimentos: [
          { nombre: 'Huevo entero', cantidad: 2, unidad: 'pza' },
          { nombre: 'Tortilla de maíz', cantidad: 2, unidad: 'pza' }
        ]
      },
      {
        id: 2,
        nombre: 'Comida',
        alimentos: [
          { nombre: 'Pechuga de pollo (cocida)', cantidad: 150, unidad: 'g' },
          { nombre: 'Arroz cocido', cantidad: 1, unidad: 'taza' },
          { nombre: 'Verduras al gusto', cantidad: 100, unidad: 'g' }
        ]
      }
    ],
    prs: [{ ejercicio: 'Sentadilla libre trasera', peso: 140 }, { ejercicio: 'Press de banca con barra', peso: 100 }],
    pesosHistorial: [86.5, 86.0, 85.5, 85.0],
    rutinaSemanal: JSON.parse(JSON.stringify(PLANTILLAS_DEFAULT.powerlifting.dias))
  };
}

/* ===================== UTILIDADES Y HELPERS ===================== */
function slug(str) { return str ? str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : ''; }

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function abrirModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function cerrarModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

/* ===================== PERSISTENCIA Y SINCRONIZACIÓN API ===================== */
function guardarEstadoLocal() {
  localStorage.setItem('ar_roster_data', JSON.stringify(roster));
  localStorage.setItem('ar_sesion_codigo', sesionCodigo || '');
  localStorage.setItem('ar_es_entrenadora', esEntrenadora ? 'true' : 'false');
  localStorage.setItem('ar_cliente_activo', clienteActivoCod || '');
}

async function sincronizarProgresoServidor() {
  guardarEstadoLocal();
  const cliente = roster[clienteActivoCod];
  if (!cliente || !clienteActivoCod || esEntrenadora) return;

  try {
    const res = await fetch(`${API_BASE_URL}/mobile/cliente/${clienteActivoCod}/progreso`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rutinaSemanal: cliente.rutinaSemanal,
        datosNutricion: cliente.datosNutricion,
        menuNut: cliente.menuNut,
        prs: cliente.prs,
        pesosHistorial: cliente.pesosHistorial,
        hidroVasos: cliente.hidroVasos
      })
    });
    if (res.ok) console.log('Progreso sincronizado en servidor.');
  } catch (err) {
    console.warn('Modo offline: Guardado local en dispositivo.');
  }
}

/* ===================== CONVERSIÓN ACTIVA KG <-> LBS ===================== */
function setUnidad(u) {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  const unidadAnterior = cliente.unidad || 'kg';
  if (unidadAnterior === u) return;

  const factor = u === 'lbs' ? 2.20462 : (1 / 2.20462);
  cliente.unidad = u;

  if (cliente.rutinaSemanal) {
    cliente.rutinaSemanal.forEach(dia => {
      if (dia.ejercicios) {
        dia.ejercicios.forEach(ej => {
          if (ej.series) {
            ej.series.forEach(s => {
              if (s.peso && !isNaN(s.peso) && parseFloat(s.peso) > 0) {
                s.peso = Math.round(parseFloat(s.peso) * factor * 10) / 10;
              }
            });
          }
        });
      }
    });
  }

  const btnKg = document.getElementById('unitKg');
  const btnLbs = document.getElementById('unitLbs');
  if (btnKg) btnKg.classList.toggle('active', u === 'kg');
  if (btnLbs) btnLbs.classList.toggle('active', u === 'lbs');

  renderEntrenamiento();
  sincronizarProgresoServidor();
  showToast(`Pesos convertidos a ${u.toUpperCase()}`);
}

/* ===================== BÚSQUEDA Y MACROS OPEN FOOD FACTS ===================== */
function obtenerMacrosAlimento(nombre, cantidad, unidad) {
  const key = nombre ? nombre.toLowerCase().trim() : '';
  const item = DICCIONARIO_NUTRIMENTAL[key] || {
    kcal100g: 100, carbs100g: 10, prot100g: 5, grasa100g: 2, pesoPza: 100, pesoTaza: 150, pesoPorcion: 30
  };

  let gramosTotales = 0;
  const cant = parseFloat(cantidad) || 0;

  if (unidad === 'g' || unidad === 'ml') {
    gramosTotales = cant;
  } else if (unidad === 'pza') {
    gramosTotales = cant * (item.pesoPza || 100);
  } else if (unidad === 'taza') {
    gramosTotales = cant * (item.pesoTaza || 150);
  } else if (unidad === 'porcion') {
    gramosTotales = cant * (item.pesoPorcion || 30);
  } else {
    gramosTotales = cant;
  }

  const factor = gramosTotales / 100;

  return {
    kcal: Math.round(item.kcal100g * factor),
    carbs: Math.round(item.carbs100g * factor * 10) / 10,
    prot: Math.round(item.prot100g * factor * 10) / 10,
    grasa: Math.round(item.grasa100g * factor * 10) / 10
  };
}

async function buscarAlimentoAPIMundial(query, cIdx, aIdx) {
  if (!query || query.length < 3) return;
  const key = query.toLowerCase().trim();

  if (DICCIONARIO_NUTRIMENTAL[key]) {
    actualizarFilaNutDOM(cIdx, aIdx);
    return;
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/search?search_terms=${encodeURIComponent(query)}&fields=product_name,nutriments,brands&page_size=3`;
    const res = await fetch(url);
    const data = await res.json();

    if (data && data.products && data.products.length > 0) {
      const p = data.products[0];
      const nut = p.nutriments || {};

      const kcal = nut['energy-kcal_100g'] || nut['energy-kcal'] || nut['energy-kcal_value'] || 100;
      const carbs = nut['carbohydrates_100g'] || nut['carbohydrates'] || 0;
      const prot = nut['proteins_100g'] || nut['proteins'] || 0;
      const grasa = nut['fat_100g'] || nut['fat'] || 0;

      DICCIONARIO_NUTRIMENTAL[key] = {
        kcal100g: Math.round(kcal),
        carbs100g: Math.round(carbs * 10) / 10,
        prot100g: Math.round(prot * 10) / 10,
        grasa100g: Math.round(grasa * 10) / 10,
        pesoPza: 100, pesoTaza: 150, pesoPorcion: 30
      };

      const dl = document.getElementById('listaAlimentosNutricional');
      if (dl) {
        const opt = document.createElement('option');
        opt.value = p.product_name || query;
        dl.appendChild(opt);
      }

      actualizarFilaNutDOM(cIdx, aIdx);
    }
  } catch (err) {}
}

/* ===================== AUTENTICACIÓN Y ROLES (ANDREAROCK2026) ===================== */
function aplicarVisibilidadSegunRol() {
  const btnPanelNav = document.querySelector('.tab-btn[data-tab="panel"]');
  const btnModoEnt = document.getElementById('btnModoEntrenador');

  if (esEntrenadora) {
    if (btnPanelNav) btnPanelNav.style.display = 'flex';
    if (btnModoEnt) btnModoEnt.classList.add('active');
  } else {
    if (btnPanelNav) btnPanelNav.style.display = 'none';
    if (btnModoEnt) btnModoEnt.classList.remove('active');
  }
}

function abrirModalTrainerLogin() { abrirModal('modalTrainerLogin'); }

function verificarTrainerLogin() {
  const passInput = document.getElementById('trainerPassInput');
  const val = passInput ? passInput.value.trim() : '';

  if (val.toUpperCase() === CLAVE_ENTRENADORA_OFICIAL) {
    cerrarModal('modalTrainerLogin');
    if (passInput) passInput.value = '';
    activarModoEntrenador();
    showToast('Sesión de Entrenadora Iniciada');
  } else {
    showToast('Contraseña de Entrenadora incorrecta');
  }
}

function activarModoEntrenador() {
  esEntrenadora = true;
  sesionCodigo = 'ADMIN';
  guardarEstadoLocal();

  document.getElementById('gateScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  aplicarVisibilidadSegunRol();

  const saludo = document.getElementById('saludoNombre');
  const sublinea = document.getElementById('subSaludoTexto');
  if (saludo) saludo.textContent = 'Hola, entrenadora';
  if (sublinea) sublinea.textContent = 'Selecciona un cliente en el panel para ver su día.';

  mostrarTab('inicio');
}

function activarModoCliente(code) {
  esEntrenadora = false;
  clienteActivoCod = code;
  sesionCodigo = code;
  guardarEstadoLocal();

  document.getElementById('gateScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');

  aplicarVisibilidadSegunRol();

  const cliente = roster[code];
  const saludo = document.getElementById('saludoNombre');
  const sublinea = document.getElementById('subSaludoTexto');

  if (saludo && cliente) saludo.textContent = `Hola, ${cliente.nombre}`;
  if (sublinea) sublinea.textContent = 'Tu plan semanal y metas de hoy están listas.';

  mostrarTab('inicio');
}

async function intentarAcceso() {
  const codeInput = document.getElementById('gateCode');
  if (!codeInput) return;
  const code = codeInput.value.trim().toUpperCase();

  if (code.length === 0) return;

  try {
    const res = await fetch(`${API_BASE_URL}/mobile/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (res.ok && data.exito && data.cliente) {
      roster[code] = data.cliente;
      activarModoCliente(code);
      showToast(`¡Bienvenid@ ${data.cliente.nombre}!`);
      return;
    }
  } catch (err) {}

  if (roster[code]) {
    activarModoCliente(code);
    showToast(`Acceso local: ${roster[code].nombre}`);
  } else {
    showToast('Token no registrado. Solicítalo a la entrenadora.');
  }
}

function cerrarSesion() {
  sesionCodigo = null;
  esEntrenadora = false;
  guardarEstadoLocal();
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('gateScreen').classList.remove('hidden');
}

/* ===================== NAVEGACIÓN PRINCIPAL ENTRE TABS ===================== */
function mostrarTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  const activeTab = document.getElementById('tab-' + tabId);
  if (activeTab) activeTab.classList.add('active');

  const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'inicio') renderInicio();
  if (tabId === 'entrenamiento') renderEntrenamiento();
  if (tabId === 'nutricion') renderNutricion();
  if (tabId === 'progreso') renderProgreso();
  if (tabId === 'perfil') renderPerfil();
  if (tabId === 'panel') renderPanelEntrenador();
}

function mostrarSubtab(subId) {
  document.querySelectorAll('.sub-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.subtab-btn').forEach(el => el.classList.remove('active'));

  const subEl = document.getElementById('sub-' + subId);
  if (subEl) subEl.classList.remove('hidden');

  const subBtn = document.querySelector(`.subtab-btn[data-sub="${subId}"]`);
  if (subBtn) subBtn.classList.add('active');

  if (subId === 'cartelera') renderCartelera();
  if (subId === 'discos') renderDiscos();
  if (subId === 'rutina') renderEntrenamiento();
}

/* ===================== TAB 1: INICIO & HIDRATACIÓN ===================== */
function renderInicio() {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  const fechaEl = document.getElementById('fechaHoyTexto');
  if (fechaEl) {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormat = new Date().toLocaleDateString('es-ES', opciones);
    fechaEl.textContent = fechaFormat.charAt(0).toUpperCase() + fechaFormat.slice(1);
  }

  const elD = document.getElementById('diasEntrenadosSemana'); if (elD) elD.textContent = cliente.diasEntrenados || 0;
  const elR = document.getElementById('recordSemanal'); if (elR) elR.textContent = cliente.recordSemanal || 0;
  const elRac = document.getElementById('rachaActual'); if (elRac) elRac.textContent = cliente.rachaDias || 0;

  const resumenHoyEl = document.getElementById('entrenamientoHoyResumen');
  if (resumenHoyEl) {
    const diaActual = (cliente.rutinaSemanal && cliente.rutinaSemanal[diaActivoIdx]) ? cliente.rutinaSemanal[diaActivoIdx] : null;
    if (diaActual && diaActual.ejercicios && diaActual.ejercicios.length > 0) {
      resumenHoyEl.innerHTML = `<strong>${diaActual.nombre}</strong> — ${diaActual.ejercicios.length} ejercicios programados para hoy.`;
    } else {
      resumenHoyEl.textContent = 'Sin rutina asignada para hoy.';
    }
  }

  const hidroEl = document.getElementById('hidroCounterText');
  if (hidroEl) hidroEl.textContent = `${cliente.hidroVasos || 0} / 8 vasos`;
}

function cambiarHidratacion(delta) {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;
  cliente.hidroVasos = Math.max(0, Math.min(16, (cliente.hidroVasos || 0) + delta));
  renderInicio();
  sincronizarProgresoServidor();
}

/* ===================== TAB 2: ENTRENAMIENTO & RUTINAS ===================== */
function toggleBancoEjercicios() {
  const body = document.getElementById('bancoEjerciciosBody');
  if (body) body.classList.toggle('hidden');
}

function renderBancoEjercicios() {
  const body = document.getElementById('bancoEjerciciosBody');
  if (!body) return;
  body.innerHTML = Object.keys(bancoEjercicios).map(grupo => `
    <div class="bank-group" style="margin-bottom:14px;">
      <h4 style="display:flex; justify-content:space-between; align-items:center; color:var(--lila); font-size:13px; margin-bottom:6px;">
        ${grupo} 
        <button class="btn-ghost btn-tiny" onclick="agregarEjercicioBanco('${grupo}')">+ Agregar</button>
      </h4>
      <div style="display:flex; flex-wrap:wrap; gap:6px;">
        ${bancoEjercicios[grupo].map((it, idx) => `
          <div style="background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:6px; font-size:11px; display:flex; align-items:center; gap:6px;">
            <span>${it}</span>
            <button class="btn-ghost btn-tiny" style="color:var(--bad); padding:0 2px;" onclick="eliminarEjercicioBanco('${grupo}',${idx})">✕</button>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function agregarEjercicioBanco(grupo) {
  const nombre = prompt(`Nuevo ejercicio para ${grupo}:`);
  if (nombre) {
    bancoEjercicios[grupo].push(nombre.trim());
    renderBancoEjercicios();
  }
}

function eliminarEjercicioBanco(grupo, idx) {
  bancoEjercicios[grupo].splice(idx, 1);
  renderBancoEjercicios();
}

function renderEntrenamiento() {
  renderBancoEjercicios();
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  const unidad = cliente.unidad || 'kg';
  const btnKg = document.getElementById('unitKg');
  const btnLbs = document.getElementById('unitLbs');
  if (btnKg) btnKg.classList.toggle('active', unidad === 'kg');
  if (btnLbs) btnLbs.classList.toggle('active', unidad === 'lbs');

  const dias = cliente.rutinaSemanal || [];
  const pills = document.getElementById('dayPills');
  if (pills) {
    pills.innerHTML = dias.map((d, i) => `
      <button class="day-pill ${i === diaActivoIdx ? 'active' : ''}" onclick="diaActivoIdx=${i}; renderEntrenamiento();">
        ${d.nombre}
      </button>
    `).join('');
  }

  const cont = document.getElementById('ejerciciosContainer');
  if (!cont) return;

  const dia = dias[diaActivoIdx];
  if (!dia || !dia.ejercicios || dia.ejercicios.length === 0) {
    cont.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:12px;">Sin ejercicios asignados para este día.</p>';
    return;
  }

  cont.innerHTML = dia.ejercicios.map((ej, eIdx) => `
    <div class="card" style="background:var(--azul-marino); margin-bottom:12px; border-radius:10px; padding:12px;">
      <div class="card-header-flex" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <strong style="font-size:14px; color:#fff;">${ej.nombre}</strong> 
          <span style="font-size:11px; color:var(--muted);">(${ej.grupo || 'General'})</span>
          
          ${ej.videoUrl ? `
            <a href="${ej.videoUrl}" target="_blank" 
               style="display:inline-flex; align-items:center; gap:4px; background:#ff0000; color:#fff; padding:3px 8px; border-radius:4px; font-size:10px; font-weight:700; text-decoration:none;">
               ▶ Video YouTube
            </a>
            <button class="btn-ghost btn-tiny" style="padding:2px 6px; font-size:10px; color:var(--lila);" onclick="editarVideoUrl(${eIdx})" title="Editar enlace de tu canal">✏️ Cambiar link</button>
          ` : `
            <button class="btn-ghost btn-tiny" style="padding:3px 8px; font-size:10px; color:#ff4757; border:1px dashed #ff4757;" onclick="editarVideoUrl(${eIdx})">+ Agregar tu video de YouTube</button>
          `}
        </div>
        <button class="btn-ghost btn-tiny" style="color:var(--bad)" onclick="eliminarEjercicio(${eIdx})">✕ eliminar</button>
      </div>
      <table style="width:100%; margin-top:8px; font-size:12px; border-collapse:collapse;">
        <thead>
          <tr style="color:var(--muted); text-align:center;">
            <th>SERIE</th>
            <th>PESO (${unidad.toUpperCase()})</th>
            <th>REPS</th>
            <th>✓</th>
          </tr>
        </thead>
        <tbody>
          ${ej.series.map((s, sIdx) => `
            <tr>
              <td style="text-align:center;">${sIdx + 1}</td>
              <td style="text-align:center;">
                <input type="number" step="0.5" value="${s.peso}" 
                       style="width:65px; text-align:center; padding:4px; border:1px solid var(--line); border-radius:4px; background:#121826; color:#fff;" 
                       oninput="actualizarSet(${eIdx}, ${sIdx}, 'peso', this.value)">
              </td>
              <td style="text-align:center;">
                <input type="number" value="${s.reps}" 
                       style="width:55px; text-align:center; padding:4px; border:1px solid var(--line); border-radius:4px; background:#121826; color:#fff;" 
                       oninput="actualizarSet(${eIdx}, ${sIdx}, 'reps', this.value)">
              </td>
              <td style="text-align:center;">
                <input type="checkbox" ${s.hecha ? 'checked' : ''} onchange="actualizarSet(${eIdx}, ${sIdx}, 'hecha', this.checked)">
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <button class="btn-ghost btn-tiny" style="margin-top:10px;" onclick="agregarSerie(${eIdx})">+ Agregar serie</button>
    </div>
  `).join('');
}

function editarVideoUrl(eIdx) {
  const cliente = roster[clienteActivoCod];
  if (!cliente || !cliente.rutinaSemanal[diaActivoIdx]) return;
  const ej = cliente.rutinaSemanal[diaActivoIdx].ejercicios[eIdx];

  const actual = ej.videoUrl || '';
  const nuevo = prompt('Pega el enlace de tu canal de YouTube para este ejercicio:', actual);

  if (nuevo !== null) {
    ej.videoUrl = nuevo.trim();
    renderEntrenamiento();
    sincronizarProgresoServidor();
    showToast(ej.videoUrl ? 'Link de video guardado' : 'Link de video eliminado');
  }
}

function actualizarSet(eIdx, sIdx, campo, val) {
  const cliente = roster[clienteActivoCod];
  const set = cliente.rutinaSemanal[diaActivoIdx].ejercicios[eIdx].series[sIdx];
  if (set) {
    set[campo] = campo === 'hecha' ? val : (parseFloat(val) || 0);
    sincronizarProgresoServidor();
  }
}

function agregarSerie(eIdx) {
  roster[clienteActivoCod].rutinaSemanal[diaActivoIdx].ejercicios[eIdx].series.push({ peso: '', reps: '', hecha: false });
  renderEntrenamiento();
  sincronizarProgresoServidor();
}

function eliminarEjercicio(eIdx) {
  roster[clienteActivoCod].rutinaSemanal[diaActivoIdx].ejercicios.splice(eIdx, 1);
  renderEntrenamiento();
  sincronizarProgresoServidor();
}

function abrirModalAgregarEjercicio() { abrirModal('modalAgregarEjercicio'); }

function agregarEjercicio() {
  const nombre = document.getElementById('nuevoEjNombre').value.trim();
  const grupo = document.getElementById('nuevoEjGrupo').value;
  const videoUrl = document.getElementById('nuevoEjVideo').value.trim();
  const seriesCount = parseInt(document.getElementById('nuevoEjSeries').value) || 3;

  if (!nombre) return;

  const series = [];
  for (let i = 0; i < seriesCount; i++) series.push({ peso: '', reps: '', hecha: false });

  if (!roster[clienteActivoCod].rutinaSemanal[diaActivoIdx]) {
    roster[clienteActivoCod].rutinaSemanal[diaActivoIdx] = { nombre: `Día ${diaActivoIdx + 1}`, ejercicios: [] };
  }

  roster[clienteActivoCod].rutinaSemanal[diaActivoIdx].ejercicios.push({ nombre, grupo, videoUrl, series });

  document.getElementById('nuevoEjNombre').value = '';
  document.getElementById('nuevoEjVideo').value = '';

  cerrarModal('modalAgregarEjercicio');
  renderEntrenamiento();
  sincronizarProgresoServidor();
  showToast('Ejercicio asignado');
}

/* ===================== SUBTAB: CARTELERA DE RUTINAS ===================== */
function renderCartelera() {
  const cont = document.getElementById('plantillasContainer');
  if (!cont) return;

  cont.innerHTML = Object.keys(plantillas).map(key => {
    const p = plantillas[key];
    return `
      <div class="card" style="background:var(--azul-marino); border:1px solid var(--line); border-radius:12px; padding:14px; margin-bottom:12px;">
        <h3 style="font-size:16px; font-weight:800; color:#fff; margin-bottom:4px;">${p.nombre}</h3>
        <p style="font-size:12px; color:var(--muted); margin-bottom:12px;">${p.descripcion || ''}</p>
        <div style="margin-bottom:12px;">
          ${p.dias.map(d => `<div style="font-size:12px; padding:4px 0; border-bottom:1px solid rgba(255,255,255,0.06); color:var(--lila);">• ${d.nombre} (${d.ejercicios ? d.ejercicios.length : 0} ejercicios)</div>`).join('')}
        </div>
        <button class="btn-primary btn-tiny" style="width:100%; font-weight:700;" onclick="cargarPlantillaARutina('${key}')">⚡ Asignar esta Rutina a mi Plan</button>
      </div>
    `;
  }).join('');
}

function cargarPlantillaARutina(key) {
  const p = plantillas[key];
  const cliente = roster[clienteActivoCod];
  if (!p || !cliente) return;

  cliente.rutinaSemanal = JSON.parse(JSON.stringify(p.dias));
  diaActivoIdx = 0;
  renderEntrenamiento();
  sincronizarProgresoServidor();
  mostrarSubtab('rutina');
  mostrarTab('entrenamiento');
  showToast(`Rutina "${p.nombre}" cargada con éxito`);
}

/* ===================== TAB 3: NUTRICIÓN & CALCULADORA SMAE ===================== */
function renderNutricion() {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  if (cliente.datosNutricion) {
    const elP = document.getElementById('nutPeso'); if (elP) elP.value = cliente.datosNutricion.peso;
    const elA = document.getElementById('nutAltura'); if (elA) elA.value = cliente.datosNutricion.altura;
    const elE = document.getElementById('nutEdad'); if (elE) elE.value = cliente.datosNutricion.edad;
    const elS = document.getElementById('nutSexo'); if (elS) elS.value = cliente.datosNutricion.sexo;
    const elAct = document.getElementById('nutActividad'); if (elAct) elAct.value = cliente.datosNutricion.actividad;
    const elObj = document.getElementById('nutObjetivo'); if (elObj) elObj.value = cliente.datosNutricion.objetivo;
  }

  const elPref = document.getElementById('nutPreferencia');
  if (elPref) elPref.value = cliente.preferencia || 'sin_restriccion';

  calcularNutricion();
  renderGruposNut();
  renderMenuNut();
}

function calcularNutricion() {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  const peso = parseFloat(document.getElementById('nutPeso')?.value) || 0;
  const altura = parseFloat(document.getElementById('nutAltura')?.value) || 0;
  const edad = parseFloat(document.getElementById('nutEdad')?.value) || 0;
  const sexo = document.getElementById('nutSexo')?.value || 'hombre';
  const factorAct = parseFloat(document.getElementById('nutActividad')?.value) || 1.375;
  const ajusteObj = parseFloat(document.getElementById('nutObjetivo')?.value) || 0;

  if (!peso || !altura || !edad) return;

  cliente.datosNutricion = { peso, altura, edad, sexo, actividad: factorAct, objetivo: ajusteObj };

  const tmb = sexo === 'hombre'
    ? Math.round(10 * peso + 6.25 * altura - 5 * edad + 5)
    : Math.round(10 * peso + 6.25 * altura - 5 * edad - 161);

  const get = Math.round(tmb * factorAct);
  const kcalMeta = Math.max(1000, get + ajusteObj);

  const elTmb = document.getElementById('nutTmb'); if (elTmb) elTmb.textContent = tmb;
  const elGet = document.getElementById('nutGet'); if (elGet) elGet.textContent = get;
  const elMeta = document.getElementById('nutKcalObjetivo'); if (elMeta) elMeta.textContent = `${kcalMeta} kcal`;

  const pC = parseFloat(document.getElementById('nutPctCarbs')?.value) || 40;
  const pP = parseFloat(document.getElementById('nutPctProt')?.value) || 20;
  const pG = parseFloat(document.getElementById('nutPctGrasa')?.value) || 40;

  const gCarbs = Math.round((kcalMeta * (pC / 100)) / 4);
  const gProt = Math.round((kcalMeta * (pP / 100)) / 4);
  const gGrasa = Math.round((kcalMeta * (pG / 100)) / 9);

  const elGC = document.getElementById('nutGCarbs'); if (elGC) elGC.textContent = gCarbs;
  const elGP = document.getElementById('nutGProt'); if (elGP) elGP.textContent = gProt;
  const elGG = document.getElementById('nutGGrasa'); if (elGG) elGG.textContent = gGrasa;

  nutTargets = { kcal: kcalMeta, carbs: gCarbs, prot: gProt, grasa: gGrasa };
  sincronizarProgresoServidor();
}

function onSliderNut(changed) {
  const inputC = document.getElementById('nutPctCarbs');
  const inputP = document.getElementById('nutPctProt');
  const inputG = document.getElementById('nutPctGrasa');

  if (!inputC || !inputP || !inputG) return;

  let c = parseFloat(inputC.value) || 0;
  let p = parseFloat(inputP.value) || 0;
  let g = parseFloat(inputG.value) || 0;

  if (changed === 'carbs') {
    c = Math.min(85, Math.max(5, c));
    const rem = 100 - c;
    const oldSum = p + g;
    if (oldSum > 0) {
      p = Math.round(rem * (p / oldSum));
      g = rem - p;
    } else {
      p = Math.round(rem / 2);
      g = rem - p;
    }
  } else if (changed === 'prot') {
    p = Math.min(85, Math.max(5, p));
    const rem = 100 - p;
    const oldSum = c + g;
    if (oldSum > 0) {
      c = Math.round(rem * (c / oldSum));
      g = rem - c;
    } else {
      c = Math.round(rem / 2);
      g = rem - c;
    }
  } else if (changed === 'grasa') {
    g = Math.min(85, Math.max(5, g));
    const rem = 100 - g;
    const oldSum = c + p;
    if (oldSum > 0) {
      c = Math.round(rem * (c / oldSum));
      p = rem - c;
    } else {
      c = Math.round(rem / 2);
      p = rem - c;
    }
  }

  inputC.value = c;
  inputP.value = p;
  inputG.value = g;

  const lblC = document.getElementById('nutPctCarbsLbl'); if (lblC) lblC.textContent = `${c}%`;
  const lblP = document.getElementById('nutPctProtLbl'); if (lblP) lblP.textContent = `${p}%`;
  const lblG = document.getElementById('nutPctGrasaLbl'); if (lblG) lblG.textContent = `${g}%`;

  const bar = document.getElementById('nutBalanceBar');
  if (bar) {
    bar.innerHTML = `
      <div style="width:${c}%;background:#f2b84b;height:100%;"></div>
      <div style="width:${p}%;background:#e6297a;height:100%;"></div>
      <div style="width:${g}%;background:#c89bff;height:100%;"></div>
    `;
  }

  calcularNutricion();
}

function cambiarPreferenciaAlimenticia() {
  const cliente = roster[clienteActivoCod];
  const pref = document.getElementById('nutPreferencia').value;
  cliente.preferencia = pref;

  if (pref === 'keto') {
    document.getElementById('nutPctCarbs').value = 5;
    document.getElementById('nutPctProt').value = 25;
    document.getElementById('nutPctGrasa').value = 70;
  } else if (pref === 'vegana' || pref === 'vegetariana') {
    document.getElementById('nutPctCarbs').value = 50;
    document.getElementById('nutPctProt').value = 25;
    document.getElementById('nutPctGrasa').value = 25;
  }

  onSliderNut('carbs');
  if (cliente.menuNut && cliente.menuNut.length > 0) distribuirComidasAuto();
  sincronizarProgresoServidor();
  showToast(`Preferencia: ${pref.toUpperCase()}`);
}

function renderGruposNut() {
  const cliente = roster[clienteActivoCod];
  const cont = document.getElementById('nutGroupsContainer');
  if (!cont || !cliente) return;

  cont.innerHTML = cliente.gruposNut.map((g, idx) => `
    <div class="group-row" style="display:flex; justify-content:space-between; align-items:center; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:12px;">
      <div style="font-weight:700; color:${g.color}; width:120px;">${g.nombre}</div>
      <div style="text-align:center;">
        <input type="number" min="0" step="0.5" value="${g.porciones}" 
               style="width:45px; text-align:center; padding:4px; background:#121826; border:1px solid var(--line); color:#fff; border-radius:4px;" 
               oninput="actualizarPorcionGrupo(${idx}, this.value)">
      </div>
      <div style="text-align:center; width:50px;">${Math.round(g.porciones * g.kcal)}</div>
      <div style="text-align:center; width:45px;">${Math.round(g.porciones * g.carbs)}g</div>
      <div style="text-align:center; width:45px;">${Math.round(g.porciones * g.prot)}g</div>
      <div style="text-align:center; width:45px;">${Math.round(g.porciones * g.grasa)}g</div>
    </div>
  `).join('');

  actualizarTotalesGrupos();
}

function actualizarPorcionGrupo(idx, val) {
  const cliente = roster[clienteActivoCod];
  cliente.gruposNut[idx].porciones = parseFloat(val) || 0;
  renderGruposNut();
  sincronizarProgresoServidor();
}

function actualizarTotalesGrupos() {
  const cliente = roster[clienteActivoCod];
  let tk = 0, tc = 0, tp = 0, tg = 0;
  cliente.gruposNut.forEach(g => {
    tk += g.porciones * g.kcal;
    tc += g.porciones * g.carbs;
    tp += g.porciones * g.prot;
    tg += g.porciones * g.grasa;
  });

  const elTK = document.getElementById('nutTotKcal'); if (elTK) elTK.textContent = Math.round(tk);
  const elTC = document.getElementById('nutTotCarbs'); if (elTC) elTC.textContent = `${Math.round(tc)}g`;
  const elTP = document.getElementById('nutTotProt'); if (elTP) elTP.textContent = `${Math.round(tp)}g`;
  const elTG = document.getElementById('nutTotGrasa'); if (elTG) elTG.textContent = `${Math.round(tg)}g`;
}

function autoSugerirNut() {
  calcularNutricion();
  const cliente = roster[clienteActivoCod];
  const t = nutTargets;

  const setP = (id, p) => {
    const item = cliente.gruposNut.find(x => x.id === id);
    if (item) item.porciones = Math.round(p * 2) / 2;
  };

  setP('verduras', 4);
  setP('lacteos', cliente.preferencia === 'vegana' ? 0 : 2);
  setP('leguminosas', 1);

  const protActual = 4 * 2 + (cliente.preferencia === 'vegana' ? 0 : 2 * 9) + 1 * 8;
  const protFaltante = Math.max(0, t.prot - protActual);
  setP('proteinas', protFaltante / 7);

  const grasaActual = (protFaltante / 7) * 5 + 2 * 2 + 1 * 1;
  const grasaFaltante = Math.max(0, t.grasa - grasaActual);
  setP('grasas', grasaFaltante / 5);

  const carbsActual = 4 * 4 + 2 * 12 + 1 * 20;
  const carbsFaltantes = Math.max(0, t.carbs - carbsActual);
  setP('cereales', (carbsFaltantes * 0.7) / 15);
  setP('frutas', (carbsFaltantes * 0.3) / 15);
  setP('azucares', 0);
  setP('moderados', 0);

  renderGruposNut();
  sincronizarProgresoServidor();
  showToast('Porciones SMAE sugeridas');
}

function agregarComidaNut() {
  const cliente = roster[clienteActivoCod];
  const numComida = cliente.menuNut.length + 1;
  cliente.menuNut.push({
    id: Date.now(),
    nombre: `Comida ${numComida}`,
    alimentos: [{ nombre: 'Pechuga de pollo (cocida)', cantidad: 100, unidad: 'g' }]
  });
  renderMenuNut();
  sincronizarProgresoServidor();
  showToast('Comida agregada');
}

function renderMenuNut() {
  const cliente = roster[clienteActivoCod];
  const cont = document.getElementById('nutMenuContainer');
  if (!cont || !cliente) return;

  if (!cliente.menuNut || cliente.menuNut.length === 0) {
    cont.innerHTML = '<p style="color:var(--muted);font-size:12px;margin-bottom:12px;">No has agregado comidas a tu menú.</p>';
    actualizarTotalesMenu();
    return;
  }

  cont.innerHTML = cliente.menuNut.map((comida, cIdx) => {
    let mKcal = 0, mCarbs = 0, mProt = 0, mGrasa = 0;

    const alimentosRows = comida.alimentos.map((a, aIdx) => {
      const macros = obtenerMacrosAlimento(a.nombre, a.cantidad, a.unidad || 'g');
      mKcal += macros.kcal;
      mCarbs += macros.carbs;
      mProt += macros.prot;
      mGrasa += macros.grasa;

      return `
        <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px; background:rgba(255,255,255,0.03); padding:6px 8px; border-radius:8px; box-sizing:border-box; width:100%;">
          <input type="text" list="listaAlimentosNutricional" value="${a.nombre}" 
                 placeholder="Ej. Pechuga de pollo / Avena"
                 style="flex:2; min-width:110px; font-size:12px; padding:6px; border:1px solid var(--line); border-radius:6px; background:#121826; color:#fff;"
                 oninput="actualizarItemNombreNut(${cIdx}, ${aIdx}, this.value)">
          
          <input type="number" min="0" step="1" value="${a.cantidad}" 
                 style="width:55px; text-align:center; font-size:12px; padding:6px; border:1px solid var(--line); border-radius:6px; background:#121826; color:#fff;" 
                 oninput="actualizarItemCantNut(${cIdx}, ${aIdx}, this.value)">
          
          <select style="width:75px; font-size:11px; padding:6px; border:1px solid var(--line); border-radius:6px; background:#121826; color:#fff;"
                  onchange="actualizarItemUnidadNut(${cIdx}, ${aIdx}, this.value)">
            <option value="g" ${(a.unidad === 'g' || !a.unidad) ? 'selected' : ''}>g</option>
            <option value="ml" ${a.unidad === 'ml' ? 'selected' : ''}>ml</option>
            <option value="pza" ${a.unidad === 'pza' ? 'selected' : ''}>pza</option>
            <option value="taza" ${a.unidad === 'taza' ? 'selected' : ''}>taza</option>
            <option value="porcion" ${a.unidad === 'porcion' ? 'selected' : ''}>porción</option>
          </select>

          <div id="kcal-item-${cIdx}-${aIdx}" style="width:65px; text-align:right; font-weight:700; color:var(--lila); font-size:12px; flex-shrink:0;">
            ${macros.kcal} kcal
          </div>

          <button class="btn-ghost btn-tiny" style="color:var(--bad); padding:4px 8px; flex-shrink:0;" onclick="eliminarItemNut(${cIdx}, ${aIdx})">✕</button>
        </div>
      `;
    }).join('');

    return `
      <div style="background:var(--azul-marino); border:1px solid var(--line); border-radius:12px; padding:12px; margin-bottom:12px; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <input type="text" value="${comida.nombre}" 
                 style="background:transparent; border:none; color:#fff; font-weight:700; font-size:14px;" 
                 oninput="roster['${clienteActivoCod}'].menuNut[${cIdx}].nombre=this.value; sincronizarProgresoServidor();">
          <button class="btn-ghost btn-tiny" style="color:var(--bad)" onclick="eliminarComidaNut(${cIdx})">✕ Eliminar</button>
        </div>

        ${alimentosRows}

        <button class="btn-ghost btn-tiny" style="margin-top:4px;" onclick="agregarItemNut(${cIdx})">+ Agregar alimento</button>
        <div id="subtotal-comida-${cIdx}" style="font-size:11px; color:var(--muted); margin-top:10px; border-top:1px solid rgba(255,255,255,0.08); padding-top:6px;">
          Subtotal: <strong style="color:#fff;">${Math.round(mKcal)} kcal</strong> | CHO: ${Math.round(mCarbs)}g | PROT: ${Math.round(mProt)}g | GRASA: ${Math.round(mGrasa)}g
        </div>
      </div>
    `;
  }).join('');

  actualizarTotalesMenu();
}

function actualizarFilaNutDOM(cIdx, aIdx) {
  const cliente = roster[clienteActivoCod];
  if (!cliente || !cliente.menuNut[cIdx]) return;

  const a = cliente.menuNut[cIdx].alimentos[aIdx];
  const macros = obtenerMacrosAlimento(a.nombre, a.cantidad, a.unidad || 'g');

  const elKcal = document.getElementById(`kcal-item-${cIdx}-${aIdx}`);
  if (elKcal) elKcal.textContent = `${macros.kcal} kcal`;

  let mKcal = 0, mCarbs = 0, mProt = 0, mGrasa = 0;
  cliente.menuNut[cIdx].alimentos.forEach(item => {
    const m = obtenerMacrosAlimento(item.nombre, item.cantidad, item.unidad || 'g');
    mKcal += m.kcal;
    mCarbs += m.carbs;
    mProt += m.prot;
    mGrasa += m.grasa;
  });

  const elSubtotal = document.getElementById(`subtotal-comida-${cIdx}`);
  if (elSubtotal) {
    elSubtotal.innerHTML = `Subtotal: <strong style="color:#fff;">${Math.round(mKcal)} kcal</strong> | CHO: ${Math.round(mCarbs)}g | PROT: ${Math.round(mProt)}g | GRASA: ${Math.round(mGrasa)}g`;
  }

  actualizarTotalesMenu();
  sincronizarProgresoServidor();
}

function actualizarItemNombreNut(cIdx, aIdx, val) {
  const cliente = roster[clienteActivoCod];
  cliente.menuNut[cIdx].alimentos[aIdx].nombre = val;
  actualizarFilaNutDOM(cIdx, aIdx);

  clearTimeout(debounceTimerSearch);
  debounceTimerSearch = setTimeout(() => {
    buscarAlimentoAPIMundial(val, cIdx, aIdx);
  }, 400);
}

function actualizarItemCantNut(cIdx, aIdx, val) {
  const cliente = roster[clienteActivoCod];
  cliente.menuNut[cIdx].alimentos[aIdx].cantidad = parseFloat(val) || 0;
  actualizarFilaNutDOM(cIdx, aIdx);
}

function actualizarItemUnidadNut(cIdx, aIdx, val) {
  const cliente = roster[clienteActivoCod];
  cliente.menuNut[cIdx].alimentos[aIdx].unidad = val;
  actualizarFilaNutDOM(cIdx, aIdx);
}

function agregarItemNut(cIdx) {
  const cliente = roster[clienteActivoCod];
  cliente.menuNut[cIdx].alimentos.push({ nombre: 'Arroz cocido', cantidad: 100, unidad: 'g' });
  renderMenuNut();
  sincronizarProgresoServidor();
}

function eliminarItemNut(cIdx, aIdx) {
  const cliente = roster[clienteActivoCod];
  cliente.menuNut[cIdx].alimentos.splice(aIdx, 1);
  renderMenuNut();
  sincronizarProgresoServidor();
}

function eliminarComidaNut(cIdx) {
  const cliente = roster[clienteActivoCod];
  cliente.menuNut.splice(cIdx, 1);
  renderMenuNut();
  sincronizarProgresoServidor();
}

function actualizarTotalesMenu() {
  const cliente = roster[clienteActivoCod];
  let tk = 0, tc = 0, tp = 0, tg = 0;
  if (cliente && cliente.menuNut) {
    cliente.menuNut.forEach(comida => {
      comida.alimentos.forEach(a => {
        const m = obtenerMacrosAlimento(a.nombre, a.cantidad, a.unidad || 'g');
        tk += m.kcal;
        tc += m.carbs;
        tp += m.prot;
        tg += m.grasa;
      });
    });
  }

  const elK = document.getElementById('nutMenuTotKcal'); if (elK) elK.textContent = Math.round(tk);
  const elC = document.getElementById('nutMenuTotCarbs'); if (elC) elC.textContent = Math.round(tc);
  const elP = document.getElementById('nutMenuTotProt'); if (elP) elP.textContent = Math.round(tp);
  const elG = document.getElementById('nutMenuTotGrasa'); if (elG) elG.textContent = Math.round(tg);
}

function distribuirComidasAuto() {
  calcularNutricion();
  const cliente = roster[clienteActivoCod];
  const pref = cliente.preferencia || 'sin_restriccion';

  let numComidas = cliente.menuNut.length;
  if (numComidas === 0) {
    const nombresPorDefecto = ['Desayuno', 'Comida 1', 'Comida 2', 'Cena'];
    for (let i = 0; i < 4; i++) {
      cliente.menuNut.push({ id: Date.now() + i, nombre: nombresPorDefecto[i], alimentos: [] });
    }
    numComidas = 4;
  }

  const targetCarbsMeal = nutTargets.carbs / numComidas;
  const targetProtMeal = nutTargets.prot / numComidas;

  let proteinaList = CATALOGO_ALIMENTOS_SMAE.proteinas.omnivora;
  if (pref === 'vegana') {
    proteinaList = CATALOGO_ALIMENTOS_SMAE.proteinas.vegana;
  } else if (pref === 'vegetariana') {
    proteinaList = CATALOGO_ALIMENTOS_SMAE.proteinas.vegetariana;
  }

  let carbsList = CATALOGO_ALIMENTOS_SMAE.cereales.estandar;
  if (pref === 'sin_gluten') {
    carbsList = CATALOGO_ALIMENTOS_SMAE.cereales.sin_gluten;
  } else if (pref === 'diabetica') {
    carbsList = CATALOGO_ALIMENTOS_SMAE.cereales.diabetica;
  }

  cliente.menuNut.forEach((comida, idx) => {
    const baseProt = proteinaList[idx % proteinaList.length];
    const baseCarb = carbsList[idx % carbsList.length];

    const cantProt = Math.round((targetProtMeal / 25) * 100);
    const cantCarb = Math.round((targetCarbsMeal / 28) * 100);

    comida.alimentos = [
      { nombre: baseProt.nombre, cantidad: cantProt > 0 ? cantProt : 100, unidad: 'g' },
      { nombre: baseCarb.nombre, cantidad: cantCarb > 0 ? cantCarb : 100, unidad: 'g' },
      { nombre: 'Aceite de oliva', cantidad: 5, unidad: 'ml' },
      { nombre: 'Verduras al gusto', cantidad: 100, unidad: 'g' }
    ];
  });

  renderMenuNut();
  sincronizarProgresoServidor();
  showToast('Menú distribuido equitativamente');
}

/* ===================== TAB 4: MI PROGRESO ===================== */
function renderProgreso() {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  const pesos = cliente.pesosHistorial || [];
  if (pesos.length > 0) {
    const pAct = document.getElementById('pesoActual');
    const pAlt = document.getElementById('pesoAlto');
    const pBaj = document.getElementById('pesoBajo');
    if (pAct) pAct.textContent = `${pesos[pesos.length - 1]} kg`;
    if (pAlt) pAlt.textContent = `${Math.max(...pesos)} kg`;
    if (pBaj) pBaj.textContent = `${Math.min(...pesos)} kg`;
  }

  const prCont = document.getElementById('prList');
  if (prCont) {
    prCont.innerHTML = (cliente.prs || []).map(p => `
      <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px; border-bottom:1px solid var(--line); padding-bottom:4px;">
        <span>${p.ejercicio}</span>
        <strong style="color:var(--fucsia);">${p.peso} kg</strong>
      </div>
    `).join('');
  }
}

function agregarPeso() {
  const input = document.getElementById('nuevoPeso');
  if (!input) return;
  const val = parseFloat(input.value);
  if (val && val > 0) {
    if (!roster[clienteActivoCod].pesosHistorial) roster[clienteActivoCod].pesosHistorial = [];
    roster[clienteActivoCod].pesosHistorial.push(val);
    input.value = '';
    renderProgreso();
    sincronizarProgresoServidor();
    showToast('Peso registrado');
  }
}

function abrirModalAgregarPR() { abrirModal('modalAgregarPR'); }

function guardarPR() {
  const ej = document.getElementById('nuevoPRNombre').value.trim();
  const val = parseFloat(document.getElementById('nuevoPRValor').value);

  if (ej && val) {
    if (!roster[clienteActivoCod].prs) roster[clienteActivoCod].prs = [];
    roster[clienteActivoCod].prs.push({ ejercicio: ej, peso: val });
    cerrarModal('modalAgregarPR');
    renderProgreso();
    sincronizarProgresoServidor();
    showToast('Marca personal guardada');
  }
}

function subirFotoProgreso() {
  showToast('Foto subida a la comparativa de progreso');
}

/* ===================== TAB 5: PERFIL DEL CLIENTE ===================== */
function renderPerfil() {
  const cliente = roster[clienteActivoCod];
  if (!cliente) return;

  const elRacha = document.getElementById('perfilRachaActual'); if (elRacha) elRacha.textContent = `${cliente.rachaDias || 0} días`;
  const elRec = document.getElementById('perfilRecordRacha'); if (elRec) elRec.textContent = `${cliente.recordRacha || 0} días`;
  const elSem = document.getElementById('perfilSemanaPlan'); if (elSem) elSem.textContent = `Semana ${cliente.semanaPlan || 1}`;
  const elHoras = document.getElementById('perfilHorasTotales'); if (elHoras) elHoras.textContent = `${cliente.horasEntrenadas || 0} h`;
  const elVig = document.getElementById('perfilVigencia'); if (elVig) elVig.textContent = cliente.vigenciaMembresia || 'Activa';
  const elMiembro = document.getElementById('perfilMiembroDesde'); if (elMiembro) elMiembro.textContent = cliente.miembroDesde || '2026';
}

/* ===================== TAB 6: PANEL ENTRENADOR & TOKENS ===================== */
function renderPanelEntrenador() {
  const list = document.getElementById('clientesList');
  if (!list) return;

  list.innerHTML = Object.values(roster).map(c => `
    <div class="client-row ${c.code === clienteActivoCod ? 'active' : ''}" style="display:flex; justify-content:space-between; align-items:center; background:#0b0f19; padding:12px; border-radius:10px; margin-bottom:8px; border-left: 4px solid ${c.code === clienteActivoCod ? 'var(--fucsia)' : 'transparent'};">
      <div class="client-info">
        <strong style="color:#fff; font-size:14px;">${c.nombre}</strong>
        <div style="font-size:11px; color:var(--fucsia); font-family:monospace; font-weight:bold; margin-top:2px;">${c.code}</div>
      </div>
      <span style="font-size:11px; color:var(--lila); font-weight:600;">${(c.preferencia || 'sin_restriccion').toUpperCase()}</span>
      <button class="btn-primary btn-tiny" onclick="seleccionarCliente('${c.code}')">Cargar cliente</button>
    </div>
  `).join('');
}

function seleccionarCliente(code) {
  clienteActivoCod = code;
  guardarEstadoLocal();
  renderPanelEntrenador();
  mostrarTab('inicio');
  showToast(`Cliente activo: ${roster[code].nombre}`);
}

function abrirModalNuevoCliente() { abrirModal('modalNuevoCliente'); }

async function crearCliente() {
  const nombreInput = document.getElementById('nuevoClienteNombre');
  const nombre = nombreInput ? nombreInput.value.trim() : '';

  if (nombre) {
    let tokenNuevo = '';

    try {
      const res = await fetch(`${API_BASE_URL}/admin/clientes/crear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
      });
      const data = await res.json();
      if (res.ok && data.cliente) {
        tokenNuevo = data.cliente.code;
        roster[tokenNuevo] = data.cliente;
      } else {
        throw new Error('Servidor indisponible');
      }
    } catch (err) {
      tokenNuevo = generarTokenUnico();
      roster[tokenNuevo] = {
        code: tokenNuevo,
        nombre: nombre,
        unidad: 'kg',
        preferencia: 'sin_restriccion',
        hidroVasos: 0,
        datosNutricion: { peso: 70, altura: 170, edad: 25, sexo: 'mujer', actividad: 1.375, objetivo: 0 },
        gruposNut: JSON.parse(JSON.stringify(GRUPOS_NUTRICION_BASE)),
        menuNut: [],
        rutinaSemanal: JSON.parse(JSON.stringify(PLANTILLAS_DEFAULT.hipertrofia.dias))
      };
    }

    guardarEstadoLocal();
    if (nombreInput) nombreInput.value = '';
    cerrarModal('modalNuevoCliente');
    renderPanelEntrenador();
    showToast(`Token generado: ${tokenNuevo}`);
  }
}

/* ===================== TIMER & COMPONENTES ADICIONALES ===================== */
function toggleTimer() {
  const btn = document.getElementById('btnTimer');
  const btnFin = document.getElementById('btnFinalizar');
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    if (btn) btn.textContent = 'Iniciar';
    if (btnFin) btnFin.classList.add('hidden');
  } else {
    if (btnFin) btnFin.classList.remove('hidden');
    if (btn) btn.textContent = 'Pausar';
    timerInterval = setInterval(() => {
      timerSeconds++;
      const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const s = String(timerSeconds % 60).padStart(2, '0');
      const elDisp = document.getElementById('timerDisplay');
      if (elDisp) elDisp.textContent = `${m}:${s}`;
    }, 1000);
  }
}

function finalizarEntrenamiento() {
  if (timerInterval) toggleTimer();
  timerSeconds = 0;
  const elDisp = document.getElementById('timerDisplay');
  if (elDisp) elDisp.textContent = '00:00';
  sincronizarProgresoServidor();
  showToast('Entrenamiento completado y guardado');
}

function renderDiscos() {
  const list = document.getElementById('inventarioDiscosList');
  if (!list) return;

  list.innerHTML = discoInventario.discos.map((d, i) => `
    <div class="inventory-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; font-size:12px;">
      <input type="number" value="${d.peso}" style="width:60px; padding:4px; background:#0b0f19; border:1px solid var(--line); color:#fff; border-radius:4px;" oninput="discoInventario.discos[${i}].peso=parseFloat(this.value)||0; calcularDiscos();">
      <span style="color:var(--muted);">${discoInventario.unidad} por disco</span>
      <input type="number" value="${d.cantidad}" style="width:60px; padding:4px; background:#0b0f19; border:1px solid var(--line); color:#fff; border-radius:4px;" oninput="discoInventario.discos[${i}].cantidad=parseInt(this.value)||0; calcularDiscos();">
      <button class="btn-ghost btn-tiny" style="color:var(--bad)" onclick="discoInventario.discos.splice(${i},1); renderDiscos();">✕</button>
    </div>
  `).join('');

  calcularDiscos();
}

function cambiarUnidadDiscos(u) { discoInventario.unidad = u; renderDiscos(); }

function actualizarConfigDiscos() {
  discoInventario.barraPeso = parseFloat(document.getElementById('discoBarra').value) || 20;
  discoInventario.seguroPeso = parseFloat(document.getElementById('discoSeguro').value) || 2.5;
  calcularDiscos();
}

function agregarDiscoInventario() { discoInventario.discos.push({ peso: 10, cantidad: 2 }); renderDiscos(); }

function calcularDiscos() {
  const objetivo = parseFloat(document.getElementById('discoObjetivo')?.value) || 0;
  const barra = discoInventario.barraPeso;
  const seguros = discoInventario.seguroPeso * 2;
  const restante = Math.max(objetivo - barra - seguros, 0);

  const breakEl = document.getElementById('plateBreakdown');
  if (breakEl) breakEl.innerHTML = `<span style="font-size:13px; color:var(--lila);">Peso por lado: ${restante / 2} ${discoInventario.unidad}</span>`;
}

/* ===================== INICIALIZACIÓN GENERAL ===================== */
document.addEventListener('DOMContentLoaded', () => {
  aplicarVisibilidadSegunRol();

  if (sesionCodigo === 'ADMIN' || esEntrenadora) {
    activarModoEntrenador();
  } else if (sesionCodigo && roster[sesionCodigo]) {
    activarModoCliente(sesionCodigo);
  } else {
    document.getElementById('gateScreen').classList.remove('hidden');
    document.getElementById('appShell').classList.add('hidden');
  }
});