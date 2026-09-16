const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const prisma = new PrismaClient();

// Acceso de alumno por código RCK
router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'El código es requerido' });
    }

    const client = await prisma.client.findFirst({
      where: { code: code.trim().toUpperCase() }
    });

    if (!client) {
      return res.status(404).json({ error: 'Código no encontrado. Verifica con tu entrenadora.' });
    }

    if (!client.pagoVerificado) {
      return res.status(403).json({ error: 'Tu pago aún no ha sido verificado. Contacta a tu entrenadora.' });
    }

    const token = jwt.sign(
      { role: 'CLIENT', clientId: client.id, code: client.code },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      client
    });
  } catch (error) {
    console.error('Error en acceso de alumno:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener datos del cliente autenticado
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.user.clientId }
    });

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.json(client);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({ error: 'Error al obtener datos del perfil' });
  }
});

// Registrar log de peso o entrenamientos
router.post('/progress', verifyToken, async (req, res) => {
  try {
    const { peso, fecha, logs } = req.body;

    const progressEntry = await prisma.progress.create({
      data: {
        clientId: req.user.clientId,
        peso: peso ? parseFloat(peso) : null,
        fecha: fecha || new Date().toISOString().slice(0, 10),
        data: logs ? JSON.stringify(logs) : null
      }
    });

    return res.status(201).json(progressEntry);
  } catch (error) {
    console.error('Error registrando progreso:', error);
    return res.status(500).json({ error: 'Error al registrar progreso' });
  }
});

module.exports = router;