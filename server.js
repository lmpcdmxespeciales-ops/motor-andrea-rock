const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Tu conexión a MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:AndraRock2026@cluster0.bx6jilu.mongodb.net/?appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('🔥 Conectado exitosamente a la base de datos'))
    .catch(err => console.error('Error al conectar a MongoDB:', err));

const clienteSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    token: String,
    nombre: String,
    email: String,
    programaDias: Number,
    fechaPago: String,
    duracionDias: Number,
    estadoPago: Boolean,
    tipoServicio: String,
    nutricionActiva: Boolean,
    datosFisicos: Object,
    macrosPct: Object,
    porcionesSmae: Object,
    rutinaSemanal: Array,
    prs: Array,
    historialPeso: Array,
    fotos: Array
}, { strict: false });

const Cliente = mongoose.model('Cliente', clienteSchema);

app.get('/api/clients', async (req, res) => {
    try {
        const clients = await Cliente.find();
        res.json(clients);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updatedClient = await Cliente.findOneAndUpdate(
            { id }, req.body, { new: true, upsert: true }
        );
        res.json(updatedClient);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/clients/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Cliente.findOneAndDelete({ id });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
