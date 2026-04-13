import { useState } from 'react'
import { ORIGEM_LEAD, STATUS_LEAD, AREAS_DIREITO } from '../utils/constants'
import api from '../utils/api'
import toast from 'react-hot-toast'
import Modal from './Modal'

const statusOptions = Object.entries(STATUS_LEAD).map(([k, v]) => ({ value: k, label: v.label }))
const origemOptions = Object.entries(ORIGEM_LEAD).map(([k, v]) => ({ value: k, label: v.label }))

export default function LeadForm({ lead, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState({
    nome: lead?.nome || '',
    cpf_cnpj: lead?.cpf_cnpj || '',
    telefone: lead?.telefone || '',
    whatsapp: lead?.whatsapp || '',
    email: lead?.email || '',
    como_encontrou: lead?.como_encontrou || '',
    origem: lead?.origem || 'outros',
    status: lead?.status || 'novo',
    valor_estimado: lead?.valor_estimado || '',
    area_direito: lead?.area_direito || '',
    observacoes: lead?.observacoes || '',
    motivo_perda: lead?.motivo_perda || ''
  })
  const [loading, setLoading] = useState(false)
  const [modalExcluir, setModalExcluir] = useState(false)
  const [loadingDelete, setLoadingDelete] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nome.trim()) return toast.error('Nome é obrigatório')
    setLoading(true)
    try {
      let res
      if (lead?.id) {
        res = await api.put(`/leads/${lead.id}`, form)
      } else {
        res = await api.post('/leads', form)
      }
      toast.success(lead?.id ? 'Lead atualizado!' : 'Lead criado!')
      onSave(res.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoadingDelete(true)
    try {
      await api.delete(`/leads/${lead.id}`)
      toast.success('Lead excluído!')
      setModalExcluir(false)
      onDelete(lead.id)
    } catch (err) {
      toast.error('Erro ao excluir lead')
      setLoadingDelete(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome completo *</label>
          <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do cliente" required />
        </div>
        <div>
          <label className="label">CPF / CNPJ</label>
          <input className="input" value={form.cpf_cnpj} onChange={e => set('cpf_cnpj', e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label className="label">WhatsApp</label>
          <input className="input" value={form.whatsapp} onChange={e => set('whatsapp', e.target.value)} placeholder="(11) 99999-9999" />
        </div>
        <div>
          <label className="label">Origem do lead</label>
          <select className="input" value={form.origem} onChange={e => set('origem', e.target.value)}>
            {origemOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
            {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
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
          <label className="label">Valor estimado (R$)</label>
          <input className="input" type="number" step="0.01" value={form.valor_estimado} onChange={e => set('valor_estimado', e.target.value)} placeholder="0,00" />
        </div>
        <div className="col-span-2">
          <label className="label">Como nos encontrou</label>
          <input className="input" value={form.como_encontrou} onChange={e => set('como_encontrou', e.target.value)} placeholder="Ex: Indicação do João Silva" />
        </div>
        {form.status === 'perdido' && (
          <div className="col-span-2">
            <label className="label">Motivo da perda</label>
            <input className="input" value={form.motivo_perda} onChange={e => set('motivo_perda', e.target.value)} placeholder="Por que o lead foi perdido?" />
          </div>
        )}
        <div className="col-span-2">
          <label className="label">Observações</label>
          <textarea className="input" rows={3} value={form.observacoes} onChange={e => set('observacoes', e.target.value)} placeholder="Informações adicionais sobre o caso..." />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Salvando...' : lead?.id ? 'Atualizar Lead' : 'Criar Lead'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>

      {lead?.id && onDelete && (
        <div className="border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setModalExcluir(true)}
            className="btn-danger w-full"
          >
            Excluir Lead
          </button>
        </div>
      )}

      <Modal isOpen={modalExcluir} onClose={() => setModalExcluir(false)} title="Excluir Lead" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalExcluir(false)}
              className="btn-secondary flex-1"
              disabled={loadingDelete}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger flex-1"
              disabled={loadingDelete}
            >
              {loadingDelete ? 'Excluindo...' : 'Excluir'}
            </button>
          </div>
        </div>
      </Modal>
    </form>
  )
}
