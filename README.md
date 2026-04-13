# CRM Advocacia

Sistema de CRM comercial para escritório de advocacia com funil de vendas Kanban, integração WhatsApp (Evolution API), dashboard e relatórios.

## Stack
- **Backend**: Node.js + Express + SQLite (porta 3001)
- **Frontend**: React + Vite + Tailwind CSS (porta 5173)
- **WhatsApp**: Evolution API via Docker (porta 8080)

## Como rodar

### Opção 1 — Script automático
```bash
cd crm-advocacia
./start.sh
```

### Opção 2 — Manual
```bash
# Terminal 1 — Backend
cd crm-advocacia/backend
npm install
node server.js

# Terminal 2 — Frontend
cd crm-advocacia/frontend
npm install
npm run dev
```

### WhatsApp (opcional)
```bash
# Sobe a Evolution API
docker compose up -d evolution

# Depois configure em: Configurações > Evolution API
# API Key padrão: change-me-api-key (troque no docker-compose.yml)
```

## Funcionalidades

- **Dashboard**: KPIs, taxa de conversão, meta mensal, gráficos
- **Funil Kanban**: arrastar e soltar entre colunas, valor por coluna
- **Leads**: cadastro completo, histórico, busca e filtros
- **Propostas**: honorários, forma de pagamento, status, validade
- **Follow-up**: registro de contatos, próxima ação, alertas de atraso
- **WhatsApp**: QR Code, envio/recebimento, envio em massa, templates
- **Relatórios**: por período, origem, propostas x aceitas, receita

## Estrutura
```
crm-advocacia/
├── backend/
│   ├── server.js
│   ├── database.js
│   └── routes/
│       ├── leads.js
│       ├── propostas.js
│       ├── followup.js
│       ├── whatsapp.js
│       ├── dashboard.js
│       └── configuracoes.js
├── frontend/
│   └── src/
│       ├── pages/
│       └── components/
├── docker-compose.yml
├── .env
└── start.sh
```
