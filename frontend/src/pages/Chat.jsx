import { useEffect, useRef, useState, useCallback } from 'react'
import { Search, Send, MessageSquare, Phone } from 'lucide-react'
import api from '../utils/api'
import { formatDataHora } from '../utils/constants'
import toast from 'react-hot-toast'

export default function Chat() {
  const [conversas, setConversas] = useState([])
  const [conversa, setConversa] = useState(null)
  const [mensagens, setMensagens] = useState([])
  const [texto, setTexto] = useState('')
  const [busca, setBusca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const fetchConversas = useCallback(async () => {
    try {
      const r = await api.get('/whatsapp/conversas')
      setConversas(r.data)
    } catch {}
  }, [])

  const fetchMensagens = useCallback(async (numero) => {
    if (!numero) return
    try {
      const r = await api.get(`/whatsapp/mensagens?numero=${encodeURIComponent(numero)}&limit=200`)
      setMensagens(r.data)
    } catch {}
  }, [])

  useEffect(() => {
    fetchConversas()
    pollingRef.current = setInterval(() => {
      fetchConversas()
      if (conversa) fetchMensagens(conversa.numero)
    }, 3000)
    return () => clearInterval(pollingRef.current)
  }, [fetchConversas, fetchMensagens, conversa])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensagens])

  async function selecionarConversa(c) {
    setConversa(c)
    await fetchMensagens(c.numero)
  }

  async function enviar(e) {
    e.preventDefault()
    if (!texto.trim() || !conversa) return
    setEnviando(true)
    try {
      await api.post('/whatsapp/enviar', {
        numero: conversa.numero,
        mensagem: texto,
        lead_id: conversa.lead_id
      })
      setTexto('')
      await fetchMensagens(conversa.numero)
      await fetchConversas()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEnviando(false)
    }
  }

  const conversasFiltradas = conversas.filter(c =>
    (c.lead_nome || c.numero).toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="fade-in h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat WhatsApp</h1>
        <p className="text-gray-500 text-sm mt-0.5">Conversas via Evolution API</p>
      </div>

      <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Coluna esquerda — conversas */}
        <div className="w-80 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input pl-8 text-sm"
                placeholder="Buscar contato..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm p-6 text-center">
                <MessageSquare size={32} className="mb-3 opacity-30" />
                <p>Nenhuma conversa ainda</p>
                <p className="text-xs mt-1">As mensagens aparecem aqui quando chegarem via WhatsApp</p>
              </div>
            ) : conversasFiltradas.map(c => (
              <div
                key={c.numero}
                onClick={() => selecionarConversa(c)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-50 transition-colors ${conversa?.numero === c.numero ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(c.lead_nome || c.numero).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">{c.lead_nome || c.numero}</span>
                    <span className="text-xs text-gray-400 shrink-0 ml-1">
                      {c.ultima_mensagem_em ? new Date(c.ultima_mensagem_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  {c.lead_nome && (
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Phone size={10} /> {c.numero}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {c.ultima_direcao === 'saida' ? '↗ ' : '↙ '}{c.ultima_mensagem}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna direita — mensagens */}
        {!conversa ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p className="font-medium">Selecione uma conversa</p>
            <p className="text-sm mt-1">Escolha um contato à esquerda para ver as mensagens</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            {/* Header da conversa */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm">
                {(conversa.lead_nome || conversa.numero).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm">{conversa.lead_nome || conversa.numero}</div>
                {conversa.lead_nome && <div className="text-xs text-gray-400">{conversa.numero}</div>}
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
              {mensagens.length === 0 ? (
                <div className="text-center text-gray-400 text-sm mt-8">Nenhuma mensagem ainda</div>
              ) : mensagens.map(m => (
                <div key={m.id} className={`flex ${m.direcao === 'saida' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md rounded-xl px-3 py-2 text-sm shadow-sm ${
                    m.direcao === 'saida'
                      ? 'bg-green-600 text-white rounded-br-sm'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{m.mensagem}</p>
                    <div className={`text-xs mt-1 ${m.direcao === 'saida' ? 'text-green-200' : 'text-gray-400'}`}>
                      {formatDataHora(m.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Campo de envio */}
            <form onSubmit={enviar} className="p-3 border-t border-gray-100 flex gap-2 bg-white">
              <input
                className="input flex-1 text-sm"
                placeholder="Digite uma mensagem..."
                value={texto}
                onChange={e => setTexto(e.target.value)}
                disabled={enviando}
              />
              <button type="submit" className="btn-primary px-4" disabled={enviando || !texto.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
