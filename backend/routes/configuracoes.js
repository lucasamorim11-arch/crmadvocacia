const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
  const db = getDb();
  try {
    const configs = await db.all('SELECT chave, valor FROM configuracoes', []);
    const result = {};
    configs.forEach(c => { result[c.chave] = c.valor; });
    if (result.evolution_key) result.evolution_key_set = result.evolution_key.length > 0;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  const db = getDb();
  const { evolution_url, evolution_key, evolution_instance, nome_escritorio } = req.body;

  const upsert = (chave, valor) =>
    db.run(
      'INSERT INTO configuracoes (chave, valor, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor, updated_at = CURRENT_TIMESTAMP',
      [chave, valor]
    );

  try {
    const ops = [];
    if (evolution_url !== undefined) ops.push(upsert('evolution_url', evolution_url));
    if (evolution_key !== undefined) ops.push(upsert('evolution_key', evolution_key));
    if (evolution_instance !== undefined) ops.push(upsert('evolution_instance', evolution_instance));
    if (nome_escritorio !== undefined) ops.push(upsert('nome_escritorio', nome_escritorio));
    await Promise.all(ops);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
