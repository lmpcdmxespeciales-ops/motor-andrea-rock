const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, verifyAdmin, JWT_SECRET } = require('../middleware/auth');

const prisma = new PrismaClient();

// Autenticación de entrenadora
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'ANDREARCK2026';

    if (password !== adminPass) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { role: 'ADMIN', user: 'Andrea' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: { name: 'Andrea', role: 'ADMIN' }
    });
  } catch (error) {
    console.error('Error en login de admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener lista completa de clientes
router.get('/clients', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(clients);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de clientes' });
  }
});

// Crear nuevo cliente y generar código RCK
router.post('/clients', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { nombre, diasEntrenamiento, unidad, servicios, membresia } = req.body;

    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const code = `RCK-${randomDigits}`;

    const newClient = await prisma.client.create({
      data: {
        code,
        nombre,
        pagoVerificado: true,
        diasEntrenamiento: parseInt(diasEntrenamiento) || 3,
        unidad: unidad || 'kg',
        servicios: JSON.stringify(servicios || { entrenamiento: true, nutricion: false, rutinas: true }),
        membresia: JSON.stringify(membresia || { tipo: 'mensual', inicio: new Date().toISOString().slice(0, 10), fin: '' })
      }
    });

    return res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creando cliente:', error);
    return res.status(500).json({ error: 'Error al crear el cliente' });
  }
});

// Actualizar datos o rutinas de un cliente
router.put('/clients/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { pagoVerificado, servicios, membresia, rutinaSemanal } = req.body;

    const updatedClient = await prisma.client.update({
      where: { id: parseInt(id) },
      data: {
        ...(pagoVerificado !== undefined && { pagoVerificado }),
        ...(servicios && { servicios: typeof servicios === 'string' ? servicios : JSON.stringify(servicios) }),
        ...(membresia && { membresia: typeof membresia === 'string' ? membresia : JSON.stringify(membresia) }),
        ...(rutinaSemanal && { rutinaSemanal: typeof rutinaSemanal === 'string' ? rutinaSemanal : JSON.stringify(rutinaSemanal) })
      }
    });

    return res.json(updatedClient);
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    return res.status(500).json({ error: 'Error al actualizar el cliente' });
  }
});

module.exports = router;