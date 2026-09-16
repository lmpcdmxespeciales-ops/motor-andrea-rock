const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware de parsing y CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// URI de conexión a MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lmpcdmxespeciales_db_user:AndreaRock_2026@cluster0.bx6jilu.mongodb.net/andrea_rock_db?retryWrites=true&w=majority';

// Conexión a MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error al conectar con MongoDB Atlas:', err));

// Esquema flexible para los clientes y rutinas
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
  rutinaDias: mongoose.Schema.Types.Mixed,
  carteleraGlobal: mongoose.Schema.Types.Mixed,
  prs: mongoose.Schema.Types.Mixed,
  historialPeso: mongoose.Schema.Types.Mixed,
  fotos: mongoose.Schema.Types.Mixed
}, { timestamps: true, strict: false });

const Client = mongoose.model('Client', clientSchema);

// Middleware opcional de autenticación por Token
const authMiddleware = (req, res, next) => {
  const token = req.headers['authorization'] || req.headers['x-api-token'];
  // Permite llamadas sin restricción estricta o valida ANDREAROCK2026
  next();
};

// --- ENDPOINTS DE LA API ---

// 1. Obtener todos los clientes
app.get('/api/clients', async (req, res) => {
  try {
    const clients = await Client.find({}).sort({ updatedAt: -1 });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes de la base de datos' });
  }
});

// 2. Crear un nuevo cliente
app.post('/api/clients', authMiddleware, async (req, res) => {
  try {
    const clientData = req.body;
    if (!clientData.id) {
      clientData.id = 'c_' + Date.now();
    }
    const client = await Client.findOneAndUpdate(
      { id: clientData.id },
      clientData,
      { upsert: true, new: true, runValidators: false }
    );
    res.status(201).json(client);
  } catch (error) {
    console.error('Error al guardar cliente:', error);
    res.status(500).json({ error: 'Error al crear/guardar cliente' });
  }
});

// 3. Actualizar cliente existente por su ID personalizado
app.put('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const clientId = req.params.id;
    const updatedClient = await Client.findOneAndUpdate(
      { id: clientId },
      req.body,
      { new: true }
    );
    if (!updatedClient) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
});

// 4. Eliminar un cliente por su ID
app.delete('/api/clients/:id', authMiddleware, async (req, res) => {
  try {
    const clientId = req.params.id;
    const result = await Client.deleteOne({ id: clientId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado para eliminar' });
    }
    res.json({ message: 'Cliente eliminado correctamente', id: clientId });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el cliente' });
  }
});

// Ruta raíz de verificación (Health Check)
app.get('/', (req, res) => {
  res.send('🚀 Servidor Andrea Rock Fitness operando correctamente con MongoDB Atlas');
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=== SERVIDOR ANDREA ROCK FIT INICIADO EN PUERTO ${PORT} CON MONGODB ===`);
});