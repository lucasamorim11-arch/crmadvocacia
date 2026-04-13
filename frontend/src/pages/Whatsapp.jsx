import { useEffect, useState, useCallback } from 'react'
import { MessageSquare, Send, Users, Plus, Edit, Trash2, RefreshCw } from 'lucide-react'
import api from '../utils/api'
import { formatDataHora } from '../utils/constants'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

export default function Whatsapp() {
  const [aba, setAba] = useState('status')
  const [status, setStatus] = useState(null)
  const [qrcode, setQrcode] = useState(null)
  const [templates, setTemplates] = useState([])
  const [leads, setLeads] = useState([])
  const [mensagens, setMensagens] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalTemplate, setModalTemplate] = useState(false)
  const [editTemplate, setEditTemplate] = useState(null)
  const [modalMassa, setModalMassa] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState([])
  const [templateSelecionado, setTemplateSelecionado] = useState('')
  const [mensagemMassa, setMensagemMassa] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')

  const fetchStatus = useCallback(async () => {
    try {
      const r = await api.get('/whatsapp/status')
      setStatus(r.data)
    } catch {
      setStatus({ state: 'offline' })
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    api.get('/whatsapp/templates').then(r => setTemplates(r.data))
    api.get('/leads?limit=500').then(r => setLeads(r.data.leads))
    api.get('/whatsapp/mensagens?limit=100').then(r => setMensagens(r.data)).catch(() => {})
  }, [fetchStatus])

  async function criarInstancia() {
    setLoading(true)
    try {
      await api.post('/whatsapp/criar-instancia')
      toast.success('Instância criada!')
      fetchStatus()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function obterQRCode() {
    setLoading(true)
    try {
      const r = await api.get('/whatsapp/qrcode')
      setQrcode(r.data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function salvarTemplate(dados) {
    if (editTemplate?.id) {
      await api.put(`/whatsapp/templates/${editTemplate.id}`, dados)
      toast.success('Template atualizado!')
    } else {
      await api.post('/whatsapp/templates', dados)
      toast.success('Template criado!')
    }
    const r = await api.get('/whatsapp/templates')
    setTemplates(r.data)
    setModalTemplate(false)
    setEditTemplate(null)
  }

  async function deletarTemplate(id) {
    if (!confirm('Deletar template?')) return
    await api.delete(`/whatsapp/templates/${id}`)
    setTemplates(t => t.filter(x => x.id !== id))
  }

  async function enviarMassa() {
    if (!selectedLeads.length) return toast.error('Selecione ao menos 1 lead')
    if (!mensagemMassa.trim()) return toast.error('Digite a mensagem')
    setLoading(true)
    try {
      const r = await api.post('/whatsapp/enviar-massa', { lead_ids: selectedLeads, mensagem: mensagemMassa })
      const ok = r.data.resultados.filter(x => x.status === 'enviado').length
      const fail = r.data.resultados.filter(x => x.status !== 'enviado').length
      toast.success(`${ok} enviadas${fail > 0 ? `, ${fail} falharam` : ''}`)
      setModalMassa(false)
      setSelectedLeads([])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const leadsFiltrados = leads.filter(l => {
    if (filtroOrigem && l.origem !== filtroOrigem) return false
    if (filtroStatus && l.status !== filtroStatus) return false
    return true
  })

  const isConnected = status?.state === 'open'

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">WhatsApp</h1>
          <p className="text-gray-500 text-sm mt-0.5">Integração via Evolution API</p>
        </div>
        <button onClick={() => setModalMassa(true)} className="btn-primary flex items-center gap-2">
          <Users size={16} /> Envio em Massa
        </button>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {['status', 'mensagens', 'templates'].map(t => (
          <button key={t} onClick={() => setAba(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition-colors ${aba === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'status' ? 'Conexão' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {aba === 'status' && (
        <div className="max-w-lg">
          <div className="card p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Status da Conexão</div>
                <div className={`text-sm mt-1 font-medium ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                  {isConnected ? '● Conectado' : status?.state === 'offline' ? '● Offline' : `● ${status?.state || 'Desconhecido'}`}
                </div>
              </div>
              <button onClick={fetchStatus} className="btn-secondary flex items-center gap-1.5 text-sm">
                <RefreshCw size={14} /> Atualizar
              </button>
            </div>

            {!isConnected && (
              <div className="space-y-3">
                <button onClick={criarInstancia} disabled={loading} className="btn-primary w-full">
                  {loading ? 'Aguarde...' : 'Criar Instância'}
                </button>
                <button onClick={obterQRCode} disabled={loading} className="btn-secondary w-full">
                  {loading ? 'Aguarde...' : 'Obter QR Code para parear'}
                </button>
              </div>
            )}

            {qrcode && (
              <div className="text-center space-y-3">
                <div className="text-sm font-medium text-gray-700">Escaneie o QR Code no WhatsApp</div>
                {qrcode.qrcode?.base64 ? (
                  <img src={qrcode.qrcode.base64} alt="QR Code" className="mx-auto rounded-lg border w-64 h-64 object-contain" />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-xs font-mono break-all text-gray-600">
                    {JSON.stringify(qrcode, null, 2)}
                  </div>
                )}
                <p className="text-xs text-gray-400">Abra o WhatsApp → Dispositivos vinculados → Vincular dispositivo</p>
              </div>
            )}

            {isConnected && (
              <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                WhatsApp conectado e pronto para enviar mensagens!
              </div>
            )}
          </div>

          <div className="card p-4 mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Configuração</div>
            <p className="text-sm text-gray-500 mb-3">Configure a URL e API Key da Evolution API em <a href="/configuracoes" className="text-blue-600 hover:underline">Configurações</a>.</p>
            <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-600">
              Webhook URL: {window.location.origin.replace('5173', '3001')}/webhook/evolution
            </div>
          </div>
        </div>
      )}

      {aba === 'mensagens' && (
        <div className="card overflow-hidden">
          {mensagens.length === 0 ? (
            <div className="p-12 text-center text-gray-400">Nenhuma mensagem registrada</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Número</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mensagem</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Direção</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mensagens.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{m.numero}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{m.mensagem}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${m.direcao === 'saida' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {m.direcao === 'saida' ? '→ Saída' : '← Entrada'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${m.status === 'enviado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{m.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDataHora(m.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {aba === 'templates' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditTemplate(null); setModalTemplate(true) }} className="btn-primary flex items-center gap-2">
              <Plus size={16} /> Novo Template
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {templates.map(t => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium">{t.nome}</div>
                    <span className="badge bg-gray-100 text-gray-600 text-xs">{t.tipo}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditTemplate(t); setModalTemplate(true) }} className="text-blue-500 hover:text-blue-700 p-1"><Edit size={15} /></button>
                    <button onClick={() => deletarTemplate(t.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={15} /></button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{t.conteudo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Template */}
      <Modal isOpen={modalTemplate} onClose={() => setModalTemplate(false)} title={editTemplate ? 'Editar Template' : 'Novo Template'}>
        <TemplateForm template={editTemplate} onSave={salvarTemplate} onCancel={() => setModalTemplate(false)} />
      </Modal>

      {/* Modal Envio em Massa */}
      <Modal isOpen={modalMassa} onClose={() => setModalMassa(false)} title="Envio em Massa" size="xl">
        <div className="space-y-4">
          <div className="flex gap-3">
            <select className="input flex-1" value={filtroOrigem} onChange={e => setFiltroOrigem(e.target.value)}>
              <option value="">Todas as origens</option>
              <option value="instagram">Instagram</option>
              <option value="indicacao">Indicação</option>
              <option value="google">Google</option>
              <option value="site">Site</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
            <select className="input flex-1" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="novo">Novo</option>
              <option value="contato_feito">Contato feito</option>
              <option value="consulta_agendada">Consulta agendada</option>
              <option value="proposta_enviada">Proposta enviada</option>
            </select>
          </div>

          <div className="border rounded-lg overflow-hidden max-h-48 overflow-y-auto">
            <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 flex justify-between">
              <span>{leadsFiltrados.length} leads</span>
              <button onClick={() => setSelectedLeads(leadsFiltrados.map(l => l.id))} className="text-blue-600 hover:underline">
                Selecionar todos
              </button>
            </div>
            {leadsFiltrados.map(l => (
              <label key={l.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer border-t border-gray-50">
                <input
                  type="checkbox"
                  checked={selectedLeads.includes(l.id)}
                  onChange={e => setSelectedLeads(s => e.target.checked ? [...s, l.id] : s.filter(x => x !== l.id))}
                />
                <span className="text-sm">{l.nome}</span>
                <span className="text-xs text-gray-400">{l.whatsapp || l.telefone || 'sem número'}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="label">Template (opcional)</label>
            <select className="input mb-2" value={templateSelecionado} onChange={e => {
              setTemplateSelecionado(e.target.value)
              const t = templates.find(x => x.id === Number(e.target.value))
              if (t) setMensagemMassa(t.conteudo)
            }}>
              <option value="">Selecione um template...</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="label">Mensagem (use {'{{nome}}'} para personalizar)</label>
            <textarea className="input" rows={4} value={mensagemMassa} onChange={e => setMensagemMassa(e.target.value)} placeholder="Olá, {{nome}}! ..." />
          </div>

          <div className="flex gap-3">
            <button onClick={enviarMassa} disabled={loading} className="btn-primary flex-1">
              {loading ? 'Enviando...' : `Enviar para ${selectedLeads.length} leads`}
            </button>
            <button onClick={() => setModalMassa(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TemplateForm({ template, onSave, onCancel }) {
  const [form, setForm] = useState({
    nome: template?.nome || '',
    tipo: template?.tipo || 'geral',
    conteudo: template?.conteudo || ''
  })

  const TIPOS = ['primeiro_contato', 'followup', 'proposta', 'cobranca', 'consulta', 'geral']

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} className="space-y-4">
      <div>
        <label className="label">Nome do template</label>
        <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required placeholder="Ex: Primeiro contato" />
      </div>
      <div>
        <label className="label">Tipo</label>
        <select className="input" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Mensagem (use {'{{nome}}'}, {'{{data}}'}, {'{{hora}}'})</label>
        <textarea className="input" rows={6} value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))} required placeholder="Digite o conteúdo do template..." />
      </div>
      <div className="flex gap-3">
        <button type="submit" className="btn-primary flex-1">Salvar</button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  )
}
