const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

// Listar leads com filtros
router.get('/', async (req, res) => {
  const db = getDb();
  const { status, origem, busca, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (origem) { query += ' AND origem = ?'; params.push(origem); }
  if (busca) {
    query += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR whatsapp LIKE ? OR cpf_cnpj LIKE ?)';
    const b = `%${busca}%`;
    params.push(b, b, b, b, b);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const countParams = params.slice(0, -2);
  let countQuery = 'SELECT COUNT(*) as c FROM leads WHERE 1=1';
  if (status) countQuery += ' AND status = ?';
  if (origem) countQuery += ' AND origem = ?';
  if (busca) countQuery += ' AND (nome LIKE ? OR email LIKE ? OR telefone LIKE ? OR whatsapp LIKE ? OR cpf_cnpj LIKE ?)';

  try {
    const leads = await db.all(query, params);
    const row = await db.get(countQuery, countParams);
    res.json({ leads, total: row.c, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buscar lead por ID
router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    const lead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!lead) return res.status(404).json({ error: 'Lead não encontrado' });

    const propostas = await db.all('SELECT * FROM propostas WHERE lead_id = ? ORDER BY created_at DESC', [req.params.id]);
    const followups = await db.all('SELECT * FROM followups WHERE lead_id = ? ORDER BY data_hora DESC', [req.params.id]);
    const mensagens = await db.all('SELECT * FROM mensagens WHERE lead_id = ? ORDER BY timestamp DESC LIMIT 50', [req.params.id]);

    res.json({ ...lead, propostas, followups, mensagens });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar lead
router.post('/', async (req, res) => {
  const db = getDb();
  const {
    nome, cpf_cnpj, telefone, whatsapp, email,
    como_encontrou, origem, status, valor_estimado,
    area_direito, observacoes
  } = req.body;

  if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

  try {
    const result = await db.run(
      'INSERT INTO leads (nome, cpf_cnpj, telefone, whatsapp, email, como_encontrou, origem, status, valor_estimado, area_direito, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, cpf_cnpj, telefone, whatsapp, email, como_encontrou, origem || 'outros', status || 'novo', valor_estimado || 0, area_direito, observacoes]
    );
    const lead = await db.get('SELECT * FROM leads WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar lead
router.put('/:id', async (req, res) => {
  const db = getDb();
  const {
    nome, cpf_cnpj, telefone, whatsapp, email,
    como_encontrou, origem, status, motivo_perda,
    valor_estimado, area_direito, observacoes
  } = req.body;

  try {
    const existing = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Lead não encontrado' });

    await db.run(
      `UPDATE leads SET
        nome = ?, cpf_cnpj = ?, telefone = ?, whatsapp = ?, email = ?,
        como_encontrou = ?, origem = ?, status = ?, motivo_perda = ?,
        valor_estimado = ?, area_direito = ?, observacoes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        nome ?? existing.nome,
        cpf_cnpj ?? existing.cpf_cnpj,
        telefone ?? existing.telefone,
        whatsapp ?? existing.whatsapp,
        email ?? existing.email,
        como_encontrou ?? existing.como_encontrou,
        origem ?? existing.origem,
        status ?? existing.status,
        motivo_perda ?? existing.motivo_perda,
        valor_estimado ?? existing.valor_estimado,
        area_direito ?? existing.area_direito,
        observacoes ?? existing.observacoes,
        req.params.id,
      ]
    );

    const lead = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    res.json(lead);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar status (para drag & drop do kanban)
router.patch('/:id/status', async (req, res) => {
  const db = getDb();
  const { status, motivo_perda } = req.body;

  try {
    const existing = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Lead não encontrado' });

    await db.run(
      'UPDATE leads SET status = ?, motivo_perda = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, motivo_perda || existing.motivo_perda, req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar lead
router.delete('/:id', async (req, res) => {
  const db = getDb();
  try {
    const existing = await db.get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Lead não encontrado' });

    await db.run('DELETE FROM leads WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
