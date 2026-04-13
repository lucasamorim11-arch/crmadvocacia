import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, MessageSquare, Plus, Check, Trash2, Edit } from 'lucide-react'
import api from '../utils/api'
import { STATUS_LEAD, ORIGEM_LEAD, TIPO_FOLLOWUP, STATUS_PROPOSTA, formatMoeda, formatDataHora, formatData } from '../utils/constants'
import Modal from '../components/Modal'
import LeadForm from '../components/LeadForm'
import PropostaForm from '../components/PropostaForm'
import FollowUpForm from '../components/FollowUpForm'
import toast from 'react-hot-toast'

export default function LeadDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('followups')
  const [modalEdit, setModalEdit] = useState(false)
  const [modalProposta, setModalProposta] = useState(false)
  const [modalFollowup, setModalFollowup] = useState(false)
  const [modalMsg, setModalMsg] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const fetch = () => {
    setLoading(true)
    api.get(`/leads/${id}`).then(r => setLead(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [id])

  async function enviarMsg() {
    if (!mensagem.trim()) return
    const numero = lead.whatsapp || lead.telefone
    if (!numero) return toast.error('Lead sem número cadastrado')
    await api.post('/whatsapp/enviar', { numero, mensagem, lead_id: lead.id })
    toast.success('Mensagem enviada!')
    setMensagem('')
    setModalMsg(false)
    fetch()
  }

  async function concluirFollowup(fId) {
    await api.patch(`/followup/${fId}/concluir`)
    toast.success('Follow-up concluído!')
    fetch()
  }

  async function deletarProposta(pId) {
    if (!confirm('Deletar proposta?')) return
    await api.delete(`/propostas/${pId}`)
    fetch()
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>
  if (!lead) return <div className="text-center py-12 text-gray-400">Lead não encontrado</div>

  const status = STATUS_LEAD[lead.status]
  const origem = ORIGEM_LEAD[lead.origem]
  const followupsAtrasados = lead.followups?.filter(f => !f.concluido && f.proxima_data && new Date(f.proxima_data) < new Date()) || []

  return (
    <div className="max-w-4xl mx-auto fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{lead.nome}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`badge ${status?.color}`}>{status?.label}</span>
            {origem && <span className="text-sm text-gray-500">{origem.icon} {origem.label}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalMsg(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
            <MessageSquare size={15} /> Mensagem
          </button>
          <button onClick={() => setModalEdit(true)} className="btn-secondary flex items-center gap-1.5 text-sm">
            <Edit size={15} /> Editar
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contato</div>
          {lead.telefone && <div className="flex items-center gap-2 text-sm"><Phone size={14} className="text-gray-400" />{lead.telefone}</div>}
          {lead.whatsapp && <div className="flex items-center gap-2 text-sm"><MessageSquare size={14} className="text-green-500" />{lead.whatsapp}</div>}
          {lead.email && <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-gray-400" />{lead.email}</div>}
          {lead.cpf_cnpj && <div className="text-sm text-gray-500">CPF/CNPJ: {lead.cpf_cnpj}</div>}
        </div>

        <div className="card p-4 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Negócio</div>
          {lead.area_direito && <div className="text-sm"><span className="text-gray-400">Área:</span> {lead.area_direito}</div>}
          {lead.valor_estimado > 0 && <div className="text-sm"><span className="text-gray-400">Valor est.:</span> <strong className="text-green-600">{formatMoeda(lead.valor_estimado)}</strong></div>}
          <div className="text-sm"><span className="text-gray-400">Cadastro:</span> {formatData(lead.created_at)}</div>
        </div>

        <div className="card p-4 space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumo</div>
          <div className="text-sm"><span className="text-gray-400">Follow-ups:</span> {lead.followups?.length || 0}</div>
          <div className="text-sm"><span className="text-gray-400">Propostas:</span> {lead.propostas?.length || 0}</div>
          <div className="text-sm"><span className="text-gray-400">Mensagens:</span> {lead.mensagens?.length || 0}</div>
          {followupsAtrasados.length > 0 && (
            <div className="text-xs text-orange-600 font-medium">⚠ {followupsAtrasados.length} follow-up(s) atrasado(s)</div>
          )}
        </div>
      </div>

      {lead.observacoes && (
        <div className="card p-4 mb-6">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Observações</div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.observacoes}</p>
        </div>
      )}

      {lead.status === 'perdido' && lead.motivo_perda && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
          <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Motivo da perda</div>
          <p className="text-sm text-red-700">{lead.motivo_perda}</p>
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {[
          { key: 'followups', label: `Follow-ups (${lead.followups?.length || 0})` },
          { key: 'propostas', label: `Propostas (${lead.propostas?.length || 0})` },
          { key: 'mensagens', label: `Mensagens (${lead.mensagens?.length || 0})` }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setAba(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              aba === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {aba === 'followups' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setModalFollowup(true)} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Registrar Contato
            </button>
          </div>
          {lead.followups?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhum follow-up registrado</div>
          ) : (
            <div className="space-y-3">
              {lead.followups.map(f => {
                const tipo = TIPO_FOLLOWUP[f.tipo]
                const atrasado = !f.concluido && f.proxima_data && new Date(f.proxima_data) < new Date()
                return (
                  <div key={f.id} className={`card p-4 ${f.concluido ? 'opacity-60' : ''} ${atrasado ? 'border-orange-200 bg-orange-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{tipo?.icon} {tipo?.label}</span>
                          {atrasado && <span className="badge bg-orange-100 text-orange-700 text-xs">Atrasado</span>}
                          {f.concluido && <span className="badge bg-green-100 text-green-700 text-xs">Concluído</span>}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">{formatDataHora(f.data_hora)}</div>
                        {f.descricao && <p className="text-sm text-gray-700 mt-2">{f.descricao}</p>}
                        {f.proxima_acao && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                            <strong>Próxima ação:</strong> {f.proxima_acao}
                            {f.proxima_data && ` — ${formatDataHora(f.proxima_data)}`}
                          </div>
                        )}
                      </div>
                      {!f.concluido && (
                        <button onClick={() => concluirFollowup(f.id)} className="ml-3 text-green-600 hover:text-green-700" title="Marcar como concluído">
                          <Check size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {aba === 'propostas' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setModalProposta(true)} className="btn-primary flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Nova Proposta
            </button>
          </div>
          {lead.propostas?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma proposta criada</div>
          ) : (
            <div className="space-y-3">
              {lead.propostas.map(p => {
                const st = STATUS_PROPOSTA[p.status]
                return (
                  <div key={p.id} className="card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-sm">{p.titulo || `Proposta #${p.id}`}</div>
                        <div className="text-xl font-bold text-green-600 mt-1">{formatMoeda(p.valor_honorarios)}</div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className={`badge ${st?.color}`}>{st?.label}</span>
                          {p.forma_pagamento && <span>{p.forma_pagamento}</span>}
                          {p.area_direito && <span>{p.area_direito}</span>}
                        </div>
                        {p.validade && <div className="text-xs text-gray-400 mt-1">Válida até: {formatData(p.validade)}</div>}
                        {p.observacoes && <p className="text-xs text-gray-600 mt-2 line-clamp-2">{p.observacoes}</p>}
                      </div>
                      <button onClick={() => deletarProposta(p.id)} className="text-red-400 hover:text-red-600 ml-3">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {aba === 'mensagens' && (
        <div>
          <div className="flex justify-end mb-3">
            <button onClick={() => setModalMsg(true)} className="btn-primary flex items-center gap-1.5 text-sm">
              <MessageSquare size={15} /> Enviar Mensagem
            </button>
          </div>
          {lead.mensagens?.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma mensagem registrada</div>
          ) : (
            <div className="space-y-2">
              {[...lead.mensagens].reverse().map(m => (
                <div key={m.id} className={`flex ${m.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm rounded-xl px-4 py-2.5 text-sm ${m.direcao === 'saida' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    <p className="whitespace-pre-wrap">{m.mensagem}</p>
                    <div className={`text-xs mt-1 ${m.direcao === 'saida' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {formatDataHora(m.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modais */}
      <Modal isOpen={modalEdit} onClose={() => setModalEdit(false)} title="Editar Lead" size="lg">
        <LeadForm
          lead={lead}
          onSave={() => { setModalEdit(false); fetch() }}
          onCancel={() => setModalEdit(false)}
          onDelete={() => { setModalEdit(false); navigate('/funil') }}
        />
      </Modal>

      <Modal isOpen={modalProposta} onClose={() => setModalProposta(false)} title="Nova Proposta" size="lg">
        <PropostaForm leadId={lead.id} onSave={() => { setModalProposta(false); fetch() }} onCancel={() => setModalProposta(false)} />
      </Modal>

      <Modal isOpen={modalFollowup} onClose={() => setModalFollowup(false)} title="Registrar Contato">
        <FollowUpForm leadId={lead.id} onSave={() => { setModalFollowup(false); fetch() }} onCancel={() => setModalFollowup(false)} />
      </Modal>

      <Modal isOpen={modalMsg} onClose={() => setModalMsg(false)} title="Enviar Mensagem WhatsApp" size="sm">
        <div className="space-y-4">
          <div className="text-sm text-gray-500">Para: <strong>{lead.whatsapp || lead.telefone || 'Sem número'}</strong></div>
          <textarea className="input" rows={4} value={mensagem} onChange={e => setMensagem(e.target.value)} placeholder="Digite a mensagem..." autoFocus />
          <div className="flex gap-3">
            <button onClick={enviarMsg} className="btn-primary flex-1">Enviar</button>
            <button onClick={() => setModalMsg(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
