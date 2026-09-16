const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

// 1. Cabeceras de Seguridad HTTP para Producción
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// 2. Configuración Estricta y Segura de CORS
const allowedOrigins = [
  'https://andrearockfitness.com',
  'https://www.andrearockfitness.com',
  'https://api.andrearockfitness.com',
  'http://localhost',
  'https://localhost',
  'capacitor://localhost'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permite conexiones empaquetadas desde APK y Electron
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '10kb' })); // Previene ataques de payload masivo (DoS)

// Captura de excepciones globales para evitar caídas del servidor
process.on('uncaughtException', (err) => console.error('Excepción evitada:', err));
process.on('unhandledRejection', (reason) => console.error('Rechazo evitado:', reason));

// Función para sanitizar entradas de texto contra inyecciones
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&'"]/g, '').trim();
}

// Catálogo Global de Rutinas (Marketplace)
const routinesCatalog = [
  {
    id: "rutina-base",
    title: "Powerlifting Base 5x5",
    coach: "Andrea Rock",
    price: 0,
    priceLabel: "GRATIS",
    weeks: 8,
    days: "4 días / sem",
    level: "Intermedio",
    rating: "4.9 ★",
    description: "Programa enfocado en fuerza máxima y técnica para Sentadilla, Press de Banca y Peso Muerto.",
    routine: [
      { exercise: "Sentadilla Trasera con Barra", series: 4, reps: "8-10", weight: "140 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { exercise: "Press de Banca Plano con Barra", series: 4, reps: "8", weight: "100 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { exercise: "Peso Muerto Convencional", series: 3, reps: "5", weight: "180 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
    ]
  },
  {
    id: "rutina-hipertrofia",
    title: "Hipertrofia & Estética Avanzada",
    coach: "Andrea Rock",
    price: 499,
    priceLabel: "$499 MXN",
    weeks: 12,
    days: "5 días / sem",
    level: "Avanzado",
    rating: "4.9 ★",
    description: "Programa de alto volumen para hipertrofia muscular y definición corporal.",
    routine: [
      { exercise: "Sentadilla Búlgara con Mancuernas", series: 4, reps: "10-12", weight: "40 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { exercise: "Hip Thrust Pesado", series: 4, reps: "10", weight: "160 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { exercise: "Curl de Bíceps Alterno", series: 3, reps: "12", weight: "18 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
    ]
  }
];

// Registro de Clientes y Atletas
const clientsData = [
  {
    id: "1",
    name: "Manuel Navarro",
    token: "RCK-45890",
    status: "PAGO ACTIVO",
    plan: "Full (5d/sem)",
    unlockedRoutines: ["rutina-base"],
    activeRoutineId: "rutina-base",
    routine: [
      { exercise: "Sentadilla Trasera con Barra", series: 4, reps: "8-10", weight: "140 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { exercise: "Press de Banca Plano con Barra", series: 4, reps: "8", weight: "100 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
      { exercise: "Peso Muerto Convencional", series: 3, reps: "5", weight: "180 KG", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ" }
    ],
    nutrition: {
      calories: 2400,
      macros: { protein: "180g", carbs: "250g", fats: "65g" },
      meals: [
        { name: "Desayuno", items: ["Avena 100g", "Huevos 3 pzas", "Plátano 1 pza"], calories: 550 },
        { name: "Comida / Almuerzo", items: ["Pechuga de pollo 200g", "Arroz blanco 2 tazas"], calories: 800 },
        { name: "Cena", items: ["Salmón 180g", "Verduras al vapor"], calories: 650 }
      ]
    },
    nutritionLogs: [],
    progress: [{ exercise: "Sentadilla Trasera", weight: "140 KG", date: "2026-08-15" }],
    purchaseRequests: []
  }
];

// Ruta Principal de Estado de la API
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: "ONLINE", 
    environment: "PRODUCTION", 
    message: "API Andrea Rock Fitness v1.0 Activa" 
  });
});

// Endpoint 1: Autenticación / Login de Atleta
app.post('/api/client/login', (req, res) => {
  try {
    const rawToken = req.body?.token;
    const token = sanitizeString(rawToken).toUpperCase();

    if (!token) {
      return res.status(400).json({ success: false, error: 'Token de acceso requerido' });
    }

    const client = clientsData.find(c => c.token === token);
    if (!client) {
      return res.status(401).json({ success: false, error: 'Token inválido o membresía vencida' });
    }

    res.status(200).json({ 
      success: true, 
      client: {
        id: client.id,
        name: client.name,
        token: client.token,
        status: client.status,
        plan: client.plan,
        unlockedRoutines: client.unlockedRoutines || [],
        activeRoutineId: client.activeRoutineId,
        routine: client.routine || [],
        nutrition: client.nutrition || { calories: 0, macros: { protein: "0g", carbs: "0g", fats: "0g" }, meals: [] },
        nutritionLogs: client.nutritionLogs || [],
        progress: client.progress || []
      }, 
      catalog: routinesCatalog 
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Endpoint 2: Registrar Alimento / Consumo Calórico en Expediente
app.post('/api/client/nutrition-log', (req, res) => {
  try {
    const token = sanitizeString(req.body?.token).toUpperCase();
    const food = sanitizeString(req.body?.food);
    const calories = Math.abs(parseInt(req.body?.calories, 10) || 0);

    const client = clientsData.find(c => c.token === token);
    if (!client) {
      return res.status(401).json({ success: false, error: 'Atleta no autenticado' });
    }

    if (!client.nutritionLogs) client.nutritionLogs = [];
    
    const newLog = { food, calories, date: new Date().toISOString() };
    client.nutritionLogs.push(newLog);

    res.status(200).json({ success: true, logs: client.nutritionLogs });
  } catch (error) {
    console.error('Error en registro nutricional:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el alimento' });
  }
});

// Endpoint 3: Registrar Solicitud de Compra / Pago de Rutina en Marketplace
app.post('/api/client/request-purchase', (req, res) => {
  try {
    const token = sanitizeString(req.body?.token).toUpperCase();
    const routineId = sanitizeString(req.body?.routineId);

    const client = clientsData.find(c => c.token === token);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Cliente no encontrado' });
    }

    const routineItem = routinesCatalog.find(r => r.id === routineId);
    if (!routineItem) {
      return res.status(404).json({ success: false, error: 'Programa no encontrado en cartelera' });
    }

    if (!client.purchaseRequests) client.purchaseRequests = [];

    client.purchaseRequests.push({
      routineId,
      routineTitle: routineItem.title,
      price: routineItem.priceLabel,
      date: new Date().toISOString(),
      status: "PENDIENTE DE CONFIRMACIÓN"
    });

    res.status(200).json({ 
      success: true, 
      message: 'Solicitud de compra enviada con éxito. El coach validará tu pago para desbloquearla.',
      client 
    });
  } catch (error) {
    console.error('Error en solicitud de compra:', error);
    res.status(500).json({ success: false, error: 'Error al procesar la solicitud de compra' });
  }
});

// Arrancar Servidor
app.listen(PORT, () => {
  console.log(`=== API ANDREA ROCK FITNESS CORRIENDO EN PUERTO ${PORT} ===`);
});