const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Listar follow-ups com alertas de atraso
router.get('/', async (req, res) => {
  const db = getDb();
  const { lead_id, atrasados, pendentes } = req.query;

  let query = `
    SELECT f.*, l.nome as lead_nome, l.whatsapp as lead_whatsapp, l.status as lead_status
    FROM followups f
    LEFT JOIN leads l ON f.lead_id = l.id
    WHERE 1=1
  `;
  const params = [];

  if (lead_id) { query += ' AND f.lead_id = ?'; params.push(lead_id); }
  if (atrasados === 'true') {
    query += ' AND f.concluido = 0 AND f.proxima_data < datetime("now")';
  }
  if (pendentes === 'true') {
    query += ' AND f.concluido = 0';
  }

  query += ' ORDER BY f.proxima_data ASC, f.created_at DESC';

  try {
    const followups = await db.all(query, params);
    const agora = new Date();
    const result = followups.map(f => ({
      ...f,
      atrasado: f.proxima_data && !f.concluido && new Date(f.proxima_data) < agora
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Alertas de follow-up atrasado
router.get('/alertas', async (req, res) => {
  const db = getDb();
  try {
    const alertas = await db.all(
      `SELECT f.*, l.nome as lead_nome, l.whatsapp as lead_whatsapp
       FROM followups f
       LEFT JOIN leads l ON f.lead_id = l.id
       WHERE f.concluido = 0 AND f.proxima_data < datetime('now')
       ORDER BY f.proxima_data ASC
       LIMIT 20`,
      []
    );
    res.json(alertas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Próximas ações do dia
router.get('/hoje', async (req, res) => {
  const db = getDb();
  try {
    const hoje = await db.all(
      `SELECT f.*, l.nome as lead_nome, l.whatsapp as lead_whatsapp
       FROM followups f
       LEFT JOIN leads l ON f.lead_id = l.id
       WHERE f.concluido = 0 AND date(f.proxima_data) = date('now')
       ORDER BY f.proxima_data ASC`,
      []
    );
    res.json(hoje);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar follow-up
router.post('/', async (req, res) => {
  const db = getDb();
  const { lead_id, tipo, descricao, data_hora, proxima_acao, proxima_data } = req.body;

  if (!lead_id || !tipo) {
    return res.status(400).json({ error: 'lead_id e tipo são obrigatórios' });
  }

  try {
    const result = await db.run(
      'INSERT INTO followups (lead_id, tipo, descricao, data_hora, proxima_acao, proxima_data) VALUES (?, ?, ?, ?, ?, ?)',
      [lead_id, tipo, descricao, data_hora || new Date().toISOString(), proxima_acao, proxima_data]
    );

    await db.run(
      "UPDATE leads SET status = 'contato_feito', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'novo'",
      [lead_id]
    );

    const followup = await db.get('SELECT * FROM followups WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(followup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marcar como concluído
router.patch('/:id/concluir', async (req, res) => {
  const db = getDb();
  try {
    await db.run('UPDATE followups SET concluido = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar follow-up
router.put('/:id', async (req, res) => {
  const db = getDb();
  const { tipo, descricao, data_hora, proxima_acao, proxima_data, concluido } = req.body;

  try {
    const existing = await db.get('SELECT * FROM followups WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Follow-up não encontrado' });

    await db.run(
      `UPDATE followups SET
        tipo = ?, descricao = ?, data_hora = ?,
        proxima_acao = ?, proxima_data = ?, concluido = ?
      WHERE id = ?`,
      [
        tipo ?? existing.tipo,
        descricao ?? existing.descricao,
        data_hora ?? existing.data_hora,
        proxima_acao ?? existing.proxima_acao,
        proxima_data ?? existing.proxima_data,
        concluido ?? existing.concluido,
        req.params.id,
      ]
    );

    const followup = await db.get('SELECT * FROM followups WHERE id = ?', [req.params.id]);
    res.json(followup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar
router.delete('/:id', async (req, res) => {
  const db = getDb();
  try {
    await db.run('DELETE FROM followups WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
