const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// ============================================================
// CORS — BLINDADO (soporta preflight OPTIONS correctamente)
// ============================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-token']
}));

// Middleware manual que garantiza headers en TODAS las respuestas
// (incluso si cors() falla, este bloque actúa como respaldo)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-token');
  res.header('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ============================================================
// MongoDB Atlas
// ============================================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lmpcdmxespeciales_db_user:AndreaRock_2026@cluster0.bx6jilu.mongodb.net/andrea_rock_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error al conectar con MongoDB Atlas:', err));

// ============================================================
// Modelo Client
// ============================================================
const clientSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  token: String,
  nombre: String,
  programaDias: Number,
  fechaPago: String,
  duracionDias: Number,
  estadoPago: Boolean,
  tipoServicio: String,
  nutricionActiva: Boolean,
  datosFisicos: mongoose.Schema.Types.Mixed,
  macrosPct: mongoose.Schema.Types.Mixed,
  porcionesSmae: mongoose.Schema.Types.Mixed,
  menuComidas: mongoose.Schema.Types.Mixed,
  menuCoach: mongoose.Schema.Types.Mixed,
  rutinaDias: mongoose.Schema.Types.Mixed,
  rutinasPorSemana: mongoose.Schema.Types.Mixed,
  carteleraGlobal: mongoose.Schema.Types.Mixed,
  smartwatchData: mongoose.Schema.Types.Mixed,
  smartwatchHistory: mongoose.Schema.Types.Mixed,
  waterLog: mongoose.Schema.Types.Mixed,
  prs: mongoose.Schema.Types.Mixed,
  historialPeso: mongoose.Schema.Types.Mixed,
  fotos: mongoose.Schema.Types.Mixed
}, { timestamps: true, strict: false });

const Client = mongoose.model('Client', clientSchema);

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/', (req, res) => {
  res.send('🚀 Servidor Andrea Rock Fitness operando correctamente en MongoDB Atlas');
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ============================================================
// 🔥 NUEVO: GET /api/clients/by-token/:token — Login del atleta
// ============================================================
app.get('/api/clients/by-token/:token', async (req, res) => {
  try {
    const tokenRaw = String(req.params.token || '').trim();
    const tokenUpper = tokenRaw.toUpperCase();

    console.log(`🔍 [by-token GET] Buscando token: "${tokenRaw}"`);

    // Búsqueda case-insensitive por si el token está guardado en minúsculas
    const cliente = await Client.findOne({
      $or: [
        { token: tokenRaw },
        { token: tokenUpper },
        { token: { $regex: `^${tokenRaw}$`, $options: 'i' } }
      ]
    });

    if (!cliente) {
      console.log(`❌ [by-token GET] Token "${tokenRaw}" NO encontrado`);
      return res.status(404).json({
        error: 'Token no encontrado',
        token: tokenRaw
      });
    }

    console.log(`✅ [by-token GET] Cliente encontrado: ${cliente.nombre}`);
    res.json(cliente);
  } catch (error) {
    console.error('💥 [by-token GET] Error:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ============================================================
// 🔥 NUEVO: PUT /api/clients/by-token/:token — Guardar cambios del atleta
// ============================================================
app.put('/api/clients/by-token/:token', async (req, res) => {
  try {
    const tokenRaw = String(req.params.token || '').trim();
    const tokenUpper = tokenRaw.toUpperCase();

    console.log(`💾 [by-token PUT] Actualizando token: "${tokenRaw}"`);

    // Buscar primero para preservar el _id y no perder datos
    const existente = await Client.findOne({
      $or: [
        { token: tokenRaw },
        { token: tokenUpper },
        { token: { $regex: `^${tokenRaw}$`, $options: 'i' } }
      ]
    });

    if (!existente) {
      console.log(`❌ [by-token PUT] Token "${tokenRaw}" NO encontrado`);
      return res.status(404).json({ error: 'Token no encontrado' });
    }

    // Merge: no sobreescribir todo, solo actualizar campos permitidos
    const permitidos = [
      'nombre', 'datosFisicos', 'macrosPct', 'porcionesSmae',
      'menuComidas', 'menuCoach', 'rutinaDias', 'rutinasPorSemana',
      'smartwatchData', 'smartwatchHistory', 'waterLog',
      'prs', 'historialPeso', 'fotos', 'tipoServicio', 'nutricionActiva',
      'programaDias', 'duracionDias', 'fechaPago', 'estadoPago'
    ];

    permitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        existente[campo] = req.body[campo];
      }
    });

    await existente.save();

    console.log(`✅ [by-token PUT] Cliente actualizado: ${existente.nombre}`);
    res.json(existente);
  } catch (error) {
    console.error('💥 [by-token PUT] Error:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// ============================================================
// Rutas existentes (SE MANTIENEN igual)
// ============================================================
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ updatedAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const clientData = req.body;
    if (!clientData.id) clientData.id = 'c_' + Date.now();
    const client = await Client.findOneAndUpdate(
      { id: clientData.id },
      clientData,
      { upsert: true, new: true, runValidators: false }
    );
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar cliente' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const updatedClient = await Client.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true }
    );
    if (!updatedClient) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const result = await Client.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado correctamente', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  console.log(`=== SERVIDOR INICIADO EN PUERTO ${PORT} CON MONGODB ===`);
});
