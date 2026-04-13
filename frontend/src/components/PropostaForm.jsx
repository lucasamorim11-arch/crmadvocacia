import { useState, useEffect } from 'react'
import { AREAS_DIREITO, FORMAS_PAGAMENTO, STATUS_PROPOSTA, formatMoeda } from '../utils/constants'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function PropostaForm({ proposta, leadId, onSave, onCancel }) {
  const [form, setForm] = useState({
    lead_id: proposta?.lead_id || leadId || '',
    titulo: proposta?.titulo || '',
    valor_honorarios: proposta?.valor_honorarios || '',
    forma_pagamento: proposta?.forma_pagamento || 'À vista',
    area_direito: proposta?.area_direito || '',
    status: proposta?.status || 'rascunho',
    data_envio: proposta?.data_envio ? proposta.data_envio.split('T')[0] : '',
    validade: proposta?.validade || '',
    observacoes: proposta?.observacoes || ''
  })
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!leadId) {
      api.get('/leads?limit=200').then(r => setLeads(r.data.leads))
    }
  }, [leadId])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.lead_id) return toast.error('Selecione um lead')
    if (!form.valor_honorarios) return toast.error('Informe o valor')
    setLoading(true)
    try {
      let res
      if (proposta?.id) {
        res = await api.put(`/propostas/${proposta.id}`, form)
      } else {
        res = await api.post('/propostas', form)
      }
      toast.success(proposta?.id ? 'Proposta atualizada!' : 'Proposta criada!')
      onSave(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!leadId && (
        <div>
          <label className="label">Lead *</label>
          <select className="input" value={form.lead_id} onChange={e => set('lead_id', e.target.value)} required>
            <option value="">Selecione o lead...</option>
            {leads.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="label">Título da proposta</label>
        <input className="input" value={form.titulo} onChange={e => set('titulo', e.target.value)} placeholder="Ex: Honorários - Ação Trabalhista" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Valor dos honorários (R$) *</label>
          <input className="input" type="number" step="0.01" value={form.valor_honorarios} onChange={e => set('valor_honorarios', e.target.value)} placeholder="0,00" required />
        </div>
        <div>
          <label className="label">Forma de pagamento</label>
          <select className="input" value={form.forma_pagamento} onChange={e => set('forma_pagamento', e.target.value)}>
            {FORMAS_PAGAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Área do Direito</label>
          <select className="input" value={form.area_direito} onChange={e => set('area_direito', e.target.value)}>
            <option value="">Selecione...</option>
            {AREAS_DIREITO.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {Object.entries(STATUS_PROPOSTA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Data de envio</label>
          <input className="input" type="date" value={form.data_envio} onChange={e => set('data_envio', e.target.value)} />
        </div>
        <div>
          <label className="label">Validade da proposta</label>
          <input className="input" type="date" value={form.validade} onChange={e => set('validade', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Observações / Escopo do serviço</label>
        <textarea className="input" rows={4} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Descreva os serviços inclusos, condições especiais, etc..." />
      </div>

      {form.valor_honorarios && (
        <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
          <strong>Valor:</strong> {formatMoeda(form.valor_honorarios)} — {form.forma_pagamento}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Salvando...' : proposta?.id ? 'Atualizar' : 'Criar Proposta'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
