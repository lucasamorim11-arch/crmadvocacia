const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });

  const db = getDb();
  try {
    const usuario = await db.get(
      'SELECT * FROM usuarios WHERE email = ? AND ativo = 1',
      [email.toLowerCase().trim()]
    );
    if (!usuario) return res.status(401).json({ error: 'Email ou senha inválidos' });

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return res.status(401).json({ error: 'Email ou senha inválidos' });

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const db = getDb();
  try {
    const usuario = await db.get(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?',
      [req.user.id]
    );
    if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
