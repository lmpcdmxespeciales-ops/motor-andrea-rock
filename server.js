const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 4000;

// Configuración de PostgreSQL (Lee la variable DATABASE_URL de Render)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middleware de seguridad y CORS
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Inicializar la tabla en PostgreSQL
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        token VARCHAR(255),
        data JSONB
      );
    `);
    
    const res = await pool.query('SELECT COUNT(*) FROM clients');
    if (parseInt(res.rows[0].count) === 0) {
      const defaultClient = {
        id: 'c1',
        token: 'RCK-45890',
        nombre: 'Manuel Navarro',
        programaDias: 5,
        tipoServicio: 'full',
        nutricionActiva: true,
        rutinasPorSemana: {
          1: [
            { nombre: 'Lunes', ejercicios: [{ id: 'ex1', ejercicio: 'Sentadilla Trasera', series: 4, reps: '8-10', peso: 100, unidad: 'KG', videoUrl: '' }] },
            { nombre: 'Martes', ejercicios: [] },
            { nombre: 'Miércoles', ejercicios: [] },
            { nombre: 'Jueves', ejercicios: [] },
            { nombre: 'Viernes', ejercicios: [] },
            { nombre: 'Sábado', ejercicios: [] },
            { nombre: 'Domingo', ejercicios: [] }
          ],
          2: Array(7).fill(0).map((_, i) => ({ nombre: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i], ejercicios: [] })),
          3: Array(7).fill(0).map((_, i) => ({ nombre: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i], ejercicios: [] })),
          4: Array(7).fill(0).map((_, i) => ({ nombre: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i], ejercicios: [] }))
        },
        rutinaDias: Array(7).fill(0).map((_, i) => ({ nombre: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'][i], ejercicios: [] })),
        prs: [],
        historialPeso: [],
        historialTiempoRutinas: [],
        fotos: [],
        porcionesSmae: {}
      };
      
      await pool.query(
        'INSERT INTO clients (id, token, data) VALUES ($1, $2, $3)',
        [defaultClient.id, defaultClient.token, JSON.stringify(defaultClient)]
      );
      console.log('🔥 Cliente por defecto insertado en PostgreSQL');
    }
    console.log('🔥 Conectado exitosamente y tabla verificada en PostgreSQL');
  } catch (err) {
    console.error('Error al inicializar la base de datos PostgreSQL:', err);
  }
}

initDB();

// Rutas API REST
app.get('/', (req, res) => {
  res.status(200).json({ status: "ONLINE", message: "API Andrea Rock Fitness v3 con PostgreSQL Activa" });
});

app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT data FROM clients');
    const clients = result.rows.map(row => row.data);
    res.json(clients);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const newClient = req.body;
    if (!newClient.id) newClient.id = 'c_' + Date.now();
    if (!newClient.token) newClient.token = 'RCK-' + Math.floor(10000 + Math.random() * 90000);

    await pool.query(
      'INSERT INTO clients (id, token, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET token = $2, data = $3',
      [newClient.id, newClient.token, JSON.stringify(newClient)]
    );
    res.status(201).json(newClient);
  } catch (err) {
    console.error('Error al crear cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    updatedData.id = id;
    const token = updatedData.token || 'RCK-00000';

    await pool.query(
      'INSERT INTO clients (id, token, data) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET token = $2, data = $3',
      [id, token, JSON.stringify(updatedData)]
    );
    res.json(updatedData);
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ success: true, message: "Cliente eliminado" });
  } catch (err) {
    console.error('Error al eliminar cliente:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.post('/api/client/login', async (req, res) => {
  try {
    const { token } = req.body;
    const cleanToken = (token || '').trim().toUpperCase();

    const result = await pool.query('SELECT data FROM clients WHERE UPPER(token) = $1', [cleanToken]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Token no encontrado o vencido' });
    }
    res.json({ success: true, client: result.rows.data });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`=== SERVIDOR ANDREA ROCK FIT INICIADO EN PUERTO ${PORT} CON POSTGRESQL ===`);
});
