const express = require('express');
const router = express.Router();
const { getDb } = require('../database');

router.get('/', async (req, res) => {
  const db = getDb();

  try {
    const [
      leadsHojeRow,
      leadsSemanaRow,
      porStatus,
      totalLeadsRow,
      fechadosRow,
      propostasAbertas,
      propostasMes,
      porOrigem,
      followupsAtrasadosRow,
      leadsPorDia,
      receitaMesRow,
    ] = await Promise.all([
      db.get("SELECT COUNT(*) as total FROM leads WHERE date(created_at) = date('now')", []),
      db.get("SELECT COUNT(*) as total FROM leads WHERE created_at >= datetime('now', '-7 days')", []),
      db.all('SELECT status, COUNT(*) as total, SUM(valor_estimado) as valor_total FROM leads GROUP BY status', []),
      db.get('SELECT COUNT(*) as total FROM leads', []),
      db.get("SELECT COUNT(*) as total FROM leads WHERE status = 'fechado'", []),
      db.get("SELECT COUNT(*) as total, SUM(valor_honorarios) as valor_total FROM propostas WHERE status IN ('rascunho', 'enviada')", []),
      db.get(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'aceita' THEN 1 ELSE 0 END) as aceitas,
          SUM(CASE WHEN status = 'recusada' THEN 1 ELSE 0 END) as recusadas,
          SUM(CASE WHEN status = 'enviada' THEN 1 ELSE 0 END) as enviadas,
          SUM(CASE WHEN status = 'aceita' THEN valor_honorarios ELSE 0 END) as receita_fechada
        FROM propostas
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
        []
      ),
      db.all(
        `SELECT origem, COUNT(*) as total,
          SUM(CASE WHEN status = 'fechado' THEN 1 ELSE 0 END) as fechados
        FROM leads GROUP BY origem ORDER BY total DESC`,
        []
      ),
      db.get("SELECT COUNT(*) as total FROM followups WHERE concluido = 0 AND proxima_data < datetime('now')", []),
      db.all(
        `SELECT date(created_at) as dia, COUNT(*) as total
        FROM leads WHERE created_at >= datetime('now', '-30 days')
        GROUP BY date(created_at) ORDER BY dia`,
        []
      ),
      db.get(
        `SELECT SUM(valor_honorarios) as total FROM propostas
        WHERE status = 'aceita'
        AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')`,
        []
      ),
    ]);

    const mesAtual = new Date().getMonth() + 1;
    const anoAtual = new Date().getFullYear();
    const meta = await db.get('SELECT * FROM metas WHERE mes = ? AND ano = ?', [mesAtual, anoAtual]);

    const totalLeads = totalLeadsRow.total;
    const fechados = fechadosRow.total;
    const taxaConversao = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : 0;

    res.json({
      leadsHoje: leadsHojeRow.total,
      leadsSemana: leadsSemanaRow.total,
      totalLeads,
      taxaConversao: Number(taxaConversao),
      porStatus,
      propostasAbertas,
      propostasMes,
      porOrigem,
      followupsAtrasados: followupsAtrasadosRow.total,
      leadsPorDia,
      meta,
      receitaMes: receitaMesRow.total || 0,
      fechadosMes: propostasMes.aceitas || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Relatório por período
router.get('/relatorio', async (req, res) => {
  const db = getDb();
  const { inicio, fim } = req.query;

  const dataInicio = inicio || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const dataFim = fim || new Date().toISOString().split('T')[0];

  try {
    const [leads, propostas, receitaRow] = await Promise.all([
      db.all(
        `SELECT origem, status, COUNT(*) as total, SUM(valor_estimado) as valor_total
        FROM leads
        WHERE date(created_at) BETWEEN ? AND ?
        GROUP BY origem, status
        ORDER BY total DESC`,
        [dataInicio, dataFim]
      ),
      db.all(
        `SELECT area_direito, status, COUNT(*) as total, SUM(valor_honorarios) as valor_total
        FROM propostas
        WHERE date(created_at) BETWEEN ? AND ?
        GROUP BY area_direito, status`,
        [dataInicio, dataFim]
      ),
      db.get(
        "SELECT SUM(valor_honorarios) as total FROM propostas WHERE status = 'aceita' AND date(updated_at) BETWEEN ? AND ?",
        [dataInicio, dataFim]
      ),
    ]);

    res.json({ leads, propostas, receitaTotal: receitaRow.total || 0, periodo: { inicio: dataInicio, fim: dataFim } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Salvar/atualizar meta mensal
router.post('/meta', async (req, res) => {
  const db = getDb();
  const { mes, ano, meta_fechamentos, meta_valor } = req.body;

  try {
    await db.run(
      `INSERT INTO metas (mes, ano, meta_fechamentos, meta_valor)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(mes, ano) DO UPDATE SET
        meta_fechamentos = excluded.meta_fechamentos,
        meta_valor = excluded.meta_valor`,
      [mes, ano, meta_fechamentos, meta_valor]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
