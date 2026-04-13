export const STATUS_LEAD = {
  novo: { label: 'Novo Lead', color: 'bg-slate-100 text-slate-700', kanban: 'bg-slate-50' },
  contato_feito: { label: 'Primeiro Contato', color: 'bg-blue-100 text-blue-700', kanban: 'bg-blue-50' },
  consulta_agendada: { label: 'Consulta Agendada', color: 'bg-yellow-100 text-yellow-700', kanban: 'bg-yellow-50' },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-purple-100 text-purple-700', kanban: 'bg-purple-50' },
  fechado: { label: 'Fechado', color: 'bg-green-100 text-green-700', kanban: 'bg-green-50' },
  perdido: { label: 'Perdido', color: 'bg-red-100 text-red-700', kanban: 'bg-red-50' }
}

export const ORIGEM_LEAD = {
  instagram: { label: 'Instagram', icon: '📸' },
  indicacao: { label: 'Indicação', icon: '🤝' },
  google: { label: 'Google', icon: '🔍' },
  site: { label: 'Site', icon: '🌐' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  outros: { label: 'Outros', icon: '📌' }
}

export const TIPO_FOLLOWUP = {
  ligacao: { label: 'Ligação', icon: '📞' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  email: { label: 'E-mail', icon: '📧' },
  reuniao: { label: 'Reunião', icon: '🤝' },
  visita: { label: 'Visita', icon: '🏢' }
}

export const STATUS_PROPOSTA = {
  rascunho: { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' },
  enviada: { label: 'Enviada', color: 'bg-blue-100 text-blue-700' },
  aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' }
}

export const AREAS_DIREITO = [
  'Direito Civil', 'Direito de Família', 'Direito Criminal', 'Direito Trabalhista',
  'Direito Tributário', 'Direito Empresarial', 'Direito Previdenciário',
  'Direito do Consumidor', 'Direito Imobiliário', 'Direito Digital', 'Outros'
]

export const FORMAS_PAGAMENTO = [
  'À vista', 'Parcelado (2x)', 'Parcelado (3x)', 'Parcelado (4x)',
  'Parcelado (6x)', 'Parcelado (12x)', 'Mensalidade'
]

export const FUNIL_COLUNAS = [
  'novo', 'contato_feito', 'consulta_agendada', 'proposta_enviada', 'fechado', 'perdido'
]

export function formatMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0)
}

export function formatData(data) {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR')
}

export function formatDataHora(data) {
  if (!data) return '-'
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
