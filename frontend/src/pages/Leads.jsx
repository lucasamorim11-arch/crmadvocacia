import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Filter } from 'lucide-react'
import api from '../utils/api'
import { STATUS_LEAD, ORIGEM_LEAD, formatMoeda, formatData } from '../utils/constants'
import Modal from '../components/Modal'
import LeadForm from '../components/LeadForm'
import toast from 'react-hot-toast'

export default function Leads() {
  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [modalNovo, setModalNovo] = useState(false)

  const fetchLeads = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (busca) params.set('busca', busca)
    if (filtroStatus) params.set('status', filtroStatus)
    if (filtroOrigem) params.set('origem', filtroOrigem)
    params.set('limit', '100')

    api.get(`/leads?${params}`).then(r => {
      setLeads(r.data.leads)
      setTotal(r.data.total)
    }).finally(() => setLoading(false))
  }, [busca, filtroStatus, filtroOrigem])

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300)
    return () => clearTimeout(t)
  }, [fetchLeads])

  async function deletar(id) {
    if (!confirm('Deletar este lead?')) return
    await api.delete(`/leads/${id}`)
    toast.success('Lead deletado')
    fetchLeads()
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads & Clientes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{total} registros encontrados</p>
        </div>
        <button onClick={() => setModalNovo(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo Lead
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 mb-5 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Buscar por nome, e-mail, telefone..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <select className="input w-48" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LEAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className="input w-40" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}>
          <option value="">Todas as origens</option>
          {Object.entries(ORIGEM_LEAD).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        {(filtroStatus || filtroOrigem || busca) && (
          <button onClick={() => { setBusca(''); setFiltroStatus(''); setFiltroOrigem('') }} className="btn-secondary text-xs px-3">
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-2">Nenhum lead encontrado</div>
            <button onClick={() => setModalNovo(true)} className="btn-primary text-sm">Criar primeiro lead</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Origem</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cadastro</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.map(lead => {
                const status = STATUS_LEAD[lead.status]
                const origem = ORIGEM_LEAD[lead.origem]
                return (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline">{lead.nome}</Link>
                      {lead.area_direito && <div className="text-xs text-gray-400">{lead.area_direito}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div>{lead.whatsapp || lead.telefone || '-'}</div>
                      {lead.email && <div className="text-xs text-gray-400">{lead.email}</div>}
                    </td>
                    <td className="px-4 py-3">
                      {origem ? <span className="text-sm">{origem.icon} {origem.label}</span> : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${status?.color}`}>{status?.label}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-700">
                      {lead.valor_estimado > 0 ? formatMoeda(lead.valor_estimado) : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatData(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/leads/${lead.id}`} className="text-xs text-blue-600 hover:underline">Ver</Link>
                        <button onClick={() => deletar(lead.id)} className="text-xs text-red-500 hover:underline">Del</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalNovo} onClose={() => setModalNovo(false)} title="Novo Lead" size="lg">
        <LeadForm onSave={() => { setModalNovo(false); fetchLeads() }} onCancel={() => setModalNovo(false)} />
      </Modal>
    </div>
  )
}
