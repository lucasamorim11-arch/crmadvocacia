const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH
  || (process.env.NODE_ENV === 'production'
    ? path.join('/data', 'crm.db')
    : path.join(__dirname, 'crm.db'));

let _db;

function getRawDb() {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

function getDb() {
  const raw = getRawDb();
  return {
    get: (sql, params = []) => {
      return Promise.resolve(raw.prepare(sql).get(...params) || null);
    },
    all: (sql, params = []) => {
      return Promise.resolve(raw.prepare(sql).all(...params));
    },
    run: (sql, params = []) => {
      const info = raw.prepare(sql).run(...params);
      return Promise.resolve({ lastInsertRowid: info.lastInsertRowid, changes: info.changes });
    },
    exec: (sql) => {
      raw.exec(sql);
      return Promise.resolve();
    },
  };
}

async function initDb() {
  const db = getDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cpf_cnpj TEXT,
      telefone TEXT,
      whatsapp TEXT,
      email TEXT,
      como_encontrou TEXT,
      origem TEXT DEFAULT 'outros',
      status TEXT DEFAULT 'novo',
      motivo_perda TEXT,
      valor_estimado REAL DEFAULT 0,
      area_direito TEXT,
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS propostas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      titulo TEXT,
      valor_honorarios REAL NOT NULL,
      forma_pagamento TEXT,
      area_direito TEXT,
      status TEXT DEFAULT 'rascunho',
      data_envio DATETIME,
      validade DATE,
      observacoes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS followups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      descricao TEXT,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
      proxima_acao TEXT,
      proxima_data DATETIME,
      concluido INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mensagens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      numero TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      direcao TEXT NOT NULL,
      status TEXT DEFAULT 'enviado',
      message_id TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      tipo TEXT NOT NULL,
      conteudo TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS configuracoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chave TEXT UNIQUE NOT NULL,
      valor TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS metas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mes INTEGER NOT NULL,
      ano INTEGER NOT NULL,
      meta_fechamentos INTEGER DEFAULT 0,
      meta_valor REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(mes, ano)
    );

    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha_hash TEXT NOT NULL,
      perfil TEXT DEFAULT 'advogado',
      ativo INTEGER DEFAULT 1,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed templates padrão
  const row = await db.get('SELECT COUNT(*) as c FROM templates');
  if (row.c === 0) {
    const tpl = 'INSERT INTO templates (nome, tipo, conteudo) VALUES (?, ?, ?)';
    await db.run(tpl, ['Primeiro Contato', 'primeiro_contato', 'Olá, {{nome}}! Tudo bem? Sou do escritório *[Nome do Escritório]*. Vi que você entrou em contato conosco e gostaria de entender melhor como podemos te ajudar. Qual é a sua situação jurídica atual?']);
    await db.run(tpl, ['Follow-up', 'followup', 'Olá, {{nome}}! Passando para verificar se você teve a oportunidade de analisar nossa proposta. Estamos à disposição para esclarecer qualquer dúvida. Quando seria um bom momento para conversar?']);
    await db.run(tpl, ['Envio de Proposta', 'proposta', 'Olá, {{nome}}! Conforme nossa conversa, segue a proposta de honorários advocatícios para o seu caso. Qualquer dúvida, estou à disposição. Podemos agendar uma reunião para detalhar melhor?']);
    await db.run(tpl, ['Cobrança', 'cobranca', 'Olá, {{nome}}. Gostaríamos de lembrá-lo(a) sobre o pagamento referente aos serviços jurídicos prestados. Por favor, entre em contato para regularizar a situação. Agradecemos a compreensão.']);
    await db.run(tpl, ['Consulta Agendada', 'consulta', 'Olá, {{nome}}! Confirmando nossa consulta no dia *{{data}}* às *{{hora}}*. Nosso endereço é [Endereço do Escritório]. Qualquer imprevisto, por favor nos avise com antecedência.']);
  }

  // Seed configurações padrão
  const cfg = await db.get("SELECT COUNT(*) as c FROM configuracoes WHERE chave = 'evolution_url'");
  if (cfg.c === 0) {
    const ins = 'INSERT OR IGNORE INTO configuracoes (chave, valor) VALUES (?, ?)';
    await db.run(ins, ['evolution_url', 'http://localhost:8080']);
    await db.run(ins, ['evolution_key', '']);
    await db.run(ins, ['evolution_instance', 'crm-advocacia']);
    await db.run(ins, ['nome_escritorio', 'Escritório de Advocacia']);
  }

  // Seed admin padrão
  const userCount = await db.get('SELECT COUNT(*) as c FROM usuarios');
  if (userCount.c === 0) {
    const bcrypt = require('bcryptjs');
    const senhaHash = await bcrypt.hash('admin123', 10);
    await db.run(
      "INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo) VALUES (?, ?, ?, 'admin', 1)",
      ['Administrador', 'admin@crm.com', senhaHash]
    );
    console.log('Usuário admin criado: admin@crm.com / admin123');
  }
}

module.exports = { getDb, initDb };
