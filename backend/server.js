require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, initDb } = require('./database');
const { authMiddleware } = require('./middleware/auth');

const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const leadsRouter = require('./routes/leads');
const propostasRouter = require('./routes/propostas');
const followupRouter = require('./routes/followup');
const whatsappRouter = require('./routes/whatsapp');
const dashboardRouter = require('./routes/dashboard');
const configuracoesRouter = require('./routes/configuracoes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas públicas (sem autenticação)
app.use('/api/auth/login', authRouter);
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Webhook Evolution API (sem autenticação)
app.post('/webhook/evolution', async (req, res) => {
  const db = getDb();
  const payload = req.body;

  try {
    if (payload.event === 'messages.upsert' && payload.data) {
      const msg = payload.data;
      const numero = msg.key?.remoteJid?.replace('@s.whatsapp.net', '');
      const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
      const direcao = msg.key?.fromMe ? 'saida' : 'entrada';

      if (numero && texto) {
        const lead = await db.get(
          'SELECT id FROM leads WHERE whatsapp LIKE ? OR telefone LIKE ?',
          [`%${numero}%`, `%${numero}%`]
        );

        await db.run(
          'INSERT INTO mensagens (lead_id, numero, mensagem, direcao, message_id, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
          [lead?.id || null, numero, texto, direcao, msg.key?.id || null, new Date().toISOString()]
        );
      }
    }
  } catch (err) {
    console.error('Erro no webhook:', err);
  }

  res.sendStatus(200);
});

// Middleware JWT para todas as demais rotas /api
app.use('/api', (req, res, next) => {
  // /api/auth/login já foi tratado acima; aqui protege todas as outras
  if (req.path === '/auth/login') return next();
  authMiddleware(req, res, next);
});

// Rotas protegidas
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/propostas', propostasRouter);
app.use('/api/followup', followupRouter);
app.use('/api/whatsapp', whatsappRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/configuracoes', configuracoesRouter);

// Servir frontend em produção
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor', details: err.message });
});

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CRM Advocacia API rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao inicializar o banco de dados:', err);
    process.exit(1);
  });
