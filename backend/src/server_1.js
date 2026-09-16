const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

process.on('uncaughtException', (err) => console.error('Excepción evitada:', err));
process.on('unhandledRejection', (reason) => console.error('Rechazo evitado:', reason));

// Catálogo global de rutinas (Marketplace)
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

const clientsData = [
  {
    id: "1",
    name: "Manuel Navarro",
    token: "RCK-45890",
    status: "PAGO ACTIVO",
    plan: "Full (5d/sem)",
    unlockedRoutines: ["rutina-base"], // Rutinas que el usuario ya tiene pagadas/desbloqueadas
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
    progress: [{ exercise: "Sentadilla Trasera", weight: "140 KG", date: "2026-08-15" }],
    purchaseRequests: []
  }
];

app.get('/', (req, res) => {
  res.status(200).json({ status: "ONLINE", message: "API Andrea Rock Fitness" });
});

// Obtener cartelera de rutinas y estado del cliente
app.post('/api/client/login', (req, res) => {
  const token = String(req.body?.token || '').trim().toUpperCase();
  if (!token) return res.status(400).json({ error: 'Token es requerido' });

  const client = clientsData.find(c => c.token === token);
  if (!client) return res.status(401).json({ error: 'Token inválido o plan vencido' });

  res.status(200).json({ success: true, client, catalog: routinesCatalog });
});

// Registrar solicitud de compra / pago de una rutina en el expediente
app.post('/api/client/request-purchase', (req, res) => {
  const { token, routineId } = req.body;
  const client = clientsData.find(c => c.token === String(token).toUpperCase());
  if (!client) return res.status(404).json({ success: false, error: 'Cliente no encontrado' });

  const routineItem = routinesCatalog.find(r => r.id === routineId);
  if (!routineItem) return res.status(404).json({ success: false, error: 'Rutina no encontrada' });

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
});

app.listen(PORT, () => {
  console.log(`API corriendo en puerto ${PORT}`);
});