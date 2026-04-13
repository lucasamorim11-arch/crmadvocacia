import { useState } from 'react'
import { TIPO_FOLLOWUP } from '../utils/constants'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function FollowUpForm({ leadId, followup, onSave, onCancel }) {
  const [form, setForm] = useState({
    lead_id: leadId || followup?.lead_id || '',
    tipo: followup?.tipo || 'ligacao',
    descricao: followup?.descricao || '',
    data_hora: followup?.data_hora ? followup.data_hora.slice(0, 16) : new Date().toISOString().slice(0, 16),
    proxima_acao: followup?.proxima_acao || '',
    proxima_data: followup?.proxima_data ? followup.proxima_data.slice(0, 16) : ''
  })
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      if (followup?.id) {
        res = await api.put(`/followup/${followup.id}`, form)
      } else {
        res = await api.post('/followup', form)
      }
      toast.success('Follow-up salvo!')
      onSave(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Tipo de contato *</label>
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            {Object.entries(TIPO_FOLLOWUP).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Data e hora do contato</label>
          <input className="input" type="datetime-local" value={form.data_hora} onChange={e => set('data_hora', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Descrição do contato</label>
        <textarea className="input" rows={3} value={form.descricao} onChange={e => set('descricao', e.target.value)} placeholder="O que foi conversado?" />
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div className="text-sm font-medium text-gray-700">Próxima ação</div>
        <div>
          <label className="label">O que fazer</label>
          <input className="input" value={form.proxima_acao} onChange={e => set('proxima_acao', e.target.value)} placeholder="Ex: Ligar para confirmar reunião" />
        </div>
        <div>
          <label className="label">Quando</label>
          <input className="input" type="datetime-local" value={form.proxima_data} onChange={e => set('proxima_data', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Follow-up'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
