const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getDb } = require('../database');
const { adminOnly } = require('../middleware/auth');

router.use(adminOnly);

// GET /api/usuarios
router.get('/', async (req, res) => {
  const db = getDb();
  try {
    const usuarios = await db.all(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome'
    );
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/usuarios
router.post('/', async (req, res) => {
  const db = getDb();
  const { nome, email, senha, perfil = 'advogado' } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
  }

  try {
    const existing = await db.get('SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const result = await db.run(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, ?, 1)',
      [nome, email.toLowerCase().trim(), senha_hash, perfil]
    );
    const usuario = await db.get(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?',
      [result.lastInsertRowid]
    );
    res.status(201).json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/usuarios/:id
router.put('/:id', async (req, res) => {
  const db = getDb();
  const { nome, email, senha, perfil, ativo } = req.body;

  try {
    const existing = await db.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });

    let senha_hash = existing.senha_hash;
    if (senha) senha_hash = await bcrypt.hash(senha, 10);

    await db.run(
      'UPDATE usuarios SET nome = ?, email = ?, senha_hash = ?, perfil = ?, ativo = ? WHERE id = ?',
      [
        nome ?? existing.nome,
        email?.toLowerCase().trim() ?? existing.email,
        senha_hash,
        perfil ?? existing.perfil,
        ativo !== undefined ? (ativo ? 1 : 0) : existing.ativo,
        req.params.id
      ]
    );

    const usuario = await db.get(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/usuarios/:id
router.delete('/:id', async (req, res) => {
  const db = getDb();
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Não é possível excluir sua própria conta' });
    }
    const existing = await db.get('SELECT id FROM usuarios WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Usuário não encontrado' });

    await db.run('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
