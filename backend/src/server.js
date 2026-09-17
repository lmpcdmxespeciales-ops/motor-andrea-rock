const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://lmpcdmxespeciales_db_user:AndreaRock_2026@cluster0.bx6jilu.mongodb.net/andrea_rock_db?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conexión exitosa a MongoDB Atlas'))
  .catch((err) => console.error('❌ Error al conectar con MongoDB Atlas:', err));

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

app.get('/', (req, res) => {
  res.send('🚀 Servidor Andrea Rock Fitness operando correctamente con MongoDB Atlas');
});

app.listen(PORT, () => {
  console.log(`=== SERVIDOR INICIADO EN PUERTO ${PORT} CON MONGODB ===`);
});