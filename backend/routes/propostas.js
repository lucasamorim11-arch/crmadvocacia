const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Listar propostas
router.get('/', async (req, res) => {
  const db = getDb();
  const { status, lead_id } = req.query;

  let query = `
    SELECT p.*, l.nome as lead_nome, l.email as lead_email, l.whatsapp as lead_whatsapp
    FROM propostas p
    LEFT JOIN leads l ON p.lead_id = l.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (lead_id) { query += ' AND p.lead_id = ?'; params.push(lead_id); }

  query += ' ORDER BY p.created_at DESC';

  try {
    const propostas = await db.all(query, params);
    res.json(propostas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar proposta por ID
router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    const proposta = await db.get(
      `SELECT p.*, l.nome as lead_nome, l.email as lead_email
       FROM propostas p
       LEFT JOIN leads l ON p.lead_id = l.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (!proposta) return res.status(404).json({ error: 'Proposta não encontrada' });
    res.json(proposta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar proposta
router.post('/', async (req, res) => {
  const db = getDb();
  const {
    lead_id, titulo, valor_honorarios, forma_pagamento,
    area_direito, status, data_envio, validade, observacoes
  } = req.body;

  if (!lead_id || !valor_honorarios) {
    return res.status(400).json({ error: 'lead_id e valor_honorarios são obrigatórios' });
  }

  try {
    const lead = await db.get('SELECT * FROM leads WHERE id = ?', [lead_id]);
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    const result = await db.run(
      'INSERT INTO propostas (lead_id, titulo, valor_honorarios, forma_pagamento, area_direito, status, data_envio, validade, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [lead_id, titulo, valor_honorarios, forma_pagamento, area_direito, status || 'rascunho', data_envio, validade, observacoes]
    );

    if (status === 'enviada') {
      await db.run(
        "UPDATE leads SET status = 'proposta_enviada', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [lead_id]
      );
    }

    const proposta = await db.get('SELECT * FROM propostas WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(proposta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar proposta
router.put('/:id', async (req, res) => {
  const db = getDb();
  const {
    titulo, valor_honorarios, forma_pagamento,
    area_direito, status, data_envio, validade, observacoes
  } = req.body;

  try {
    const existing = await db.get('SELECT * FROM propostas WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Proposta não encontrada' });

    await db.run(
      `UPDATE propostas SET
        titulo = ?, valor_honorarios = ?, forma_pagamento = ?,
        area_direito = ?, status = ?, data_envio = ?, validade = ?,
        observacoes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        titulo ?? existing.titulo,
        valor_honorarios ?? existing.valor_honorarios,
        forma_pagamento ?? existing.forma_pagamento,
        area_direito ?? existing.area_direito,
        status ?? existing.status,
        data_envio ?? existing.data_envio,
        validade ?? existing.validade,
        observacoes ?? existing.observacoes,
        req.params.id,
      ]
    );

    if (status === 'aceita') {
      await db.run(
        "UPDATE leads SET status = 'fechado', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [existing.lead_id]
      );
    } else if (status === 'recusada') {
      await db.run(
        "UPDATE leads SET status = 'perdido', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [existing.lead_id]
      );
    }

    const proposta = await db.get('SELECT * FROM propostas WHERE id = ?', [req.params.id]);
    res.json(proposta);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar proposta
router.delete('/:id', async (req, res) => {
  const db = getDb();
  try {
    const existing = await db.get('SELECT * FROM propostas WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Proposta não encontrada' });

    await db.run('DELETE FROM propostas WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
