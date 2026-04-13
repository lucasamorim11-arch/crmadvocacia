import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import api from '../utils/api'
import { STATUS_PROPOSTA, formatMoeda, formatData } from '../utils/constants'
import Modal from '../components/Modal'
import PropostaForm from '../components/PropostaForm'
import toast from 'react-hot-toast'

export default function Propostas() {
  const [propostas, setPropostas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)

  const fetch = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filtroStatus) params.set('status', filtroStatus)
    api.get(`/propostas?${params}`).then(r => setPropostas(r.data)).finally(() => setLoading(false))
  }, [filtroStatus])

  useEffect(() => { fetch() }, [fetch])

  async function atualizarStatus(id, status) {
    await api.put(`/propostas/${id}`, { status })
    toast.success('Status atualizado!')
    fetch()
  }

  async function deletar(id) {
    if (!confirm('Deletar proposta?')) return
    await api.delete(`/propostas/${id}`)
    toast.success('Proposta deletada')
    fetch()
  }

  const totais = propostas.reduce((acc, p) => {
    acc.total += p.valor_honorarios
    if (p.status === 'aceita') acc.aceito += p.valor_honorarios
    if (p.status === 'enviada') acc.aberto += p.valor_honorarios
    return acc
  }, { total: 0, aceito: 0, aberto: 0 })

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Propostas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{propostas.length} propostas</p>
        </div>
        <button onClick={() => { setEditando(null); setModal(true) }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nova Proposta
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-gray-800">{formatMoeda(totais.total)}</div>
          <div className="text-xs text-gray-500 mt-1">Volume total</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{formatMoeda(totais.aberto)}</div>
          <div className="text-xs text-gray-500 mt-1">Em aberto (enviadas)</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{formatMoeda(totais.aceito)}</div>
          <div className="text-xs text-gray-500 mt-1">Receita fechada</div>
        </div>
      </div>

      {/* Filtro */}
      <div className="card p-4 mb-5 flex gap-3">
        <select className="input w-48" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_PROPOSTA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">Carregando...</div>
        ) : propostas.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Nenhuma proposta encontrada</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Proposta</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Validade</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {propostas.map(p => {
                const st = STATUS_PROPOSTA[p.status]
                const vencida = p.validade && new Date(p.validade) < new Date() && p.status === 'enviada'
                return (
                  <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${vencida ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-3">
                      <Link to={`/leads/${p.lead_id}`} className="font-medium text-blue-600 hover:underline">{p.lead_nome}</Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.titulo || `Proposta #${p.id}`}</div>
                      {p.area_direito && <div className="text-xs text-gray-400">{p.area_direito}</div>}
                      {p.forma_pagamento && <div className="text-xs text-gray-400">{p.forma_pagamento}</div>}
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">{formatMoeda(p.valor_honorarios)}</td>
                    <td className="px-4 py-3">
                      <select
                        className={`badge ${st?.color} border-0 cursor-pointer`}
                        value={p.status}
                        onChange={e => atualizarStatus(p.id, e.target.value)}
                      >
                        {Object.entries(STATUS_PROPOSTA).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.validade ? (
                        <span className={vencida ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {vencida ? '⚠ ' : ''}{formatData(p.validade)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditando(p); setModal(true) }} className="text-xs text-blue-600 hover:underline">Editar</button>
                        <button onClick={() => deletar(p.id)} className="text-xs text-red-500 hover:underline">Del</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Proposta' : 'Nova Proposta'} size="lg">
        <PropostaForm
          proposta={editando}
          onSave={() => { setModal(false); fetch() }}
          onCancel={() => setModal(false)}
        />
      </Modal>
    </div>
  )
}
