const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getDb } = require('../database');

async function getEvolutionConfig() {
  const db = getDb();
  const urlRow = await db.get("SELECT valor FROM configuracoes WHERE chave = 'evolution_url'");
  const keyRow = await db.get("SELECT valor FROM configuracoes WHERE chave = 'evolution_key'");
  const instRow = await db.get("SELECT valor FROM configuracoes WHERE chave = 'evolution_instance'");
  return {
    url: urlRow?.valor || 'http://localhost:8080',
    key: keyRow?.valor || '',
    instance: instRow?.valor || 'crm-advocacia',
  };
}

function evolutionApi(config) {
  return axios.create({
    baseURL: config.url,
    headers: { 'apikey': config.key, 'Content-Type': 'application/json' }
  });
}

// Status da instância / QR Code
router.get('/status', async (req, res) => {
  try {
    const config = await getEvolutionConfig();
    const api = evolutionApi(config);
    const response = await api.get(`/instance/connectionState/${config.instance}`);
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ error: 'Evolution API indisponível', details: err.message });
  }
});

// Obter QR Code
router.get('/qrcode', async (req, res) => {
  try {
    const config = await getEvolutionConfig();
    const api = evolutionApi(config);
    const response = await api.get(`/instance/connect/${config.instance}`);
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ error: 'Erro ao obter QR Code', details: err.message });
  }
});

// Criar instância
router.post('/criar-instancia', async (req, res) => {
  try {
    const config = await getEvolutionConfig();
    const api = evolutionApi(config);
    const response = await api.post('/instance/create', {
      instanceName: config.instance,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS',
      webhook: {
        url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/webhook/evolution`,
        events: ['messages.upsert', 'connection.update']
      }
    });
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ error: 'Erro ao criar instância', details: err.message });
  }
});

// Listar conversas (agrupadas por número)
router.get('/conversas', async (req, res) => {
  const db = getDb();
  try {
    const conversas = await db.all(`
      SELECT
        m.numero,
        m.lead_id,
        l.nome as lead_nome,
        MAX(m.timestamp) as ultima_mensagem_em,
        (SELECT mensagem FROM mensagens WHERE numero = m.numero ORDER BY timestamp DESC LIMIT 1) as ultima_mensagem,
        (SELECT direcao FROM mensagens WHERE numero = m.numero ORDER BY timestamp DESC LIMIT 1) as ultima_direcao,
        COUNT(*) as total_mensagens
      FROM mensagens m
      LEFT JOIN leads l ON l.id = m.lead_id
      GROUP BY m.numero
      ORDER BY ultima_mensagem_em DESC
    `);
    res.json(conversas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Desconectar instância
router.post('/desconectar', async (req, res) => {
  try {
    const config = await getEvolutionConfig();
    const api = evolutionApi(config);
    await api.delete(`/instance/logout/${config.instance}`);
    res.json({ success: true });
  } catch (err) {
    res.status(503).json({ error: 'Erro ao desconectar', details: err.message });
  }
});

// Listar mensagens de um lead ou número
router.get('/mensagens', async (req, res) => {
  const db = getDb();
  const { lead_id, numero } = req.query;

  let query = 'SELECT * FROM mensagens WHERE 1=1';
  const params = [];

  if (lead_id) { query += ' AND lead_id = ?'; params.push(lead_id); }
  if (numero) { query += ' AND numero LIKE ?'; params.push(`%${numero}%`); }

  query += ' ORDER BY timestamp ASC';

  try {
    const mensagens = await db.all(query, params);
    res.json(mensagens);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enviar mensagem
router.post('/enviar', async (req, res) => {
  const db = getDb();
  const { numero, mensagem, lead_id } = req.body;

  if (!numero || !mensagem) {
    return res.status(400).json({ error: 'numero e mensagem são obrigatórios' });
  }

  try {
    const config = await getEvolutionConfig();
    const api = evolutionApi(config);
    const response = await api.post(`/message/sendText/${config.instance}`, {
      number: numero.replace(/\D/g, ''),
      text: mensagem
    });

    await db.run(
      "INSERT INTO mensagens (lead_id, numero, mensagem, direcao, status, message_id) VALUES (?, ?, ?, 'saida', 'enviado', ?)",
      [lead_id || null, numero, mensagem, response.data?.key?.id || null]
    );

    res.json({ success: true, data: response.data });
  } catch (err) {
    await getDb().run(
      "INSERT INTO mensagens (lead_id, numero, mensagem, direcao, status) VALUES (?, ?, ?, 'saida', 'falhou')",
      [lead_id || null, numero, mensagem]
    ).catch(() => {});

    res.status(503).json({ error: 'Erro ao enviar mensagem', details: err.message });
  }
});

// Envio em massa
router.post('/enviar-massa', async (req, res) => {
  const db = getDb();
  const { lead_ids, mensagem, intervalo_ms = 2000 } = req.body;

  if (!lead_ids?.length || !mensagem) {
    return res.status(400).json({ error: 'lead_ids e mensagem são obrigatórios' });
  }

  try {
    const placeholders = lead_ids.map(() => '?').join(',');
    const leads = await db.all(
      `SELECT id, nome, whatsapp, telefone FROM leads WHERE id IN (${placeholders})`,
      lead_ids
    );

    const config = await getEvolutionConfig();
    const resultados = [];
    const api = evolutionApi(config);

    for (const lead of leads) {
      const numero = lead.whatsapp || lead.telefone;
      if (!numero) {
        resultados.push({ lead_id: lead.id, nome: lead.nome, status: 'sem_numero' });
        continue;
      }

      const textoFinal = mensagem.replace('{{nome}}', lead.nome);

      try {
        await new Promise(r => setTimeout(r, intervalo_ms));
        await api.post(`/message/sendText/${config.instance}`, {
          number: numero.replace(/\D/g, ''),
          text: textoFinal
        });

        await db.run(
          "INSERT INTO mensagens (lead_id, numero, mensagem, direcao, status) VALUES (?, ?, ?, 'saida', 'enviado')",
          [lead.id, numero, textoFinal]
        );

        resultados.push({ lead_id: lead.id, nome: lead.nome, status: 'enviado' });
      } catch (err) {
        resultados.push({ lead_id: lead.id, nome: lead.nome, status: 'falhou', erro: err.message });
      }
    }

    res.json({ total: leads.length, resultados });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar templates
router.get('/templates', async (req, res) => {
  const db = getDb();
  try {
    const templates = await db.all('SELECT * FROM templates ORDER BY nome', []);
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar template
router.post('/templates', async (req, res) => {
  const db = getDb();
  const { nome, tipo, conteudo } = req.body;

  if (!nome || !conteudo) return res.status(400).json({ error: 'nome e conteudo são obrigatórios' });

  try {
    const result = await db.run(
      'INSERT INTO templates (nome, tipo, conteudo) VALUES (?, ?, ?)',
      [nome, tipo || 'geral', conteudo]
    );
    const template = await db.get('SELECT * FROM templates WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Atualizar template
router.put('/templates/:id', async (req, res) => {
  const db = getDb();
  const { nome, tipo, conteudo } = req.body;
  try {
    await db.run(
      'UPDATE templates SET nome = ?, tipo = ?, conteudo = ? WHERE id = ?',
      [nome, tipo, conteudo, req.params.id]
    );
    const template = await db.get('SELECT * FROM templates WHERE id = ?', [req.params.id]);
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar template
router.delete('/templates/:id', async (req, res) => {
  const db = getDb();
  try {
    await db.run('DELETE FROM templates WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
