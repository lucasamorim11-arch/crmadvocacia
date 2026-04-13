import { useEffect, useState, useRef } from 'react'
import { Save, RefreshCw, Wifi, WifiOff, QrCode } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Configuracoes() {
  const [config, setConfig] = useState({
    nome_escritorio: '',
    evolution_url: 'http://localhost:8080',
    evolution_key: '',
    evolution_instance: 'crm-advocacia'
  })
  const [loading, setLoading] = useState(false)
  const [waStatus, setWaStatus] = useState(null)
  const [qrcode, setQrcode] = useState(null)
  const [carregandoQr, setCarregandoQr] = useState(false)
  const [conectando, setConectando] = useState(false)
  const pollingRef = useRef(null)

  useEffect(() => {
    api.get('/configuracoes').then(r => {
      setConfig(c => ({
        ...c,
        nome_escritorio: r.data.nome_escritorio || '',
        evolution_url: r.data.evolution_url || 'http://localhost:8080',
        evolution_key: r.data.evolution_key || '',
        evolution_instance: r.data.evolution_instance || 'crm-advocacia'
      }))
    })
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const r = await api.get('/whatsapp/status')
      setWaStatus(r.data)
      return r.data
    } catch {
      setWaStatus({ state: 'offline' })
      return { state: 'offline' }
    }
  }

  useEffect(() => {
    pollingRef.current = setInterval(async () => {
      const st = await fetchStatus()
      if (st?.state === 'open') {
        setQrcode(null)
        clearInterval(pollingRef.current)
      }
    }, 5000)
    return () => clearInterval(pollingRef.current)
  }, [])

  const set = (k, v) => setConfig(c => ({ ...c, [k]: v }))

  async function salvar(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/configuracoes', config)
      toast.success('Configurações salvas!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function conectarWhatsapp() {
    setConectando(true)
    setQrcode(null)
    try {
      await api.post('/whatsapp/criar-instancia')
      toast.success('Instância criada!')
      await fetchStatus()
      setCarregandoQr(true)
      const r = await api.get('/whatsapp/qrcode')
      setQrcode(r.data)
    } catch (err) {
      toast.error('Erro ao conectar: ' + err.message)
    } finally {
      setConectando(false)
      setCarregandoQr(false)
    }
  }

  async function desconectar() {
    try {
      await api.post('/whatsapp/desconectar')
      toast.success('WhatsApp desconectado')
      setQrcode(null)
      fetchStatus()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const isConnected = waStatus?.state === 'open'

  return (
    <div className="max-w-2xl fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configure o sistema e integrações</p>
      </div>

      <form onSubmit={salvar} className="space-y-6">
        {/* Escritório */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Escritório</h2>
          <div>
            <label className="label">Nome do Escritório</label>
            <input className="input" value={config.nome_escritorio} onChange={e => set('nome_escritorio', e.target.value)} placeholder="Escritório Silva & Advogados" />
          </div>
        </div>

        {/* WhatsApp — Conexão */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold">Conexão WhatsApp</h2>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
              {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isConnected ? 'Conectado' : waStatus?.state === 'offline' ? 'Offline' : (waStatus?.state || 'Desconectado')}
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-5">Escaneie o QR Code para conectar o WhatsApp</p>

          {!isConnected && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={conectarWhatsapp}
                disabled={conectando || carregandoQr}
                className="btn-primary flex items-center gap-2"
              >
                <QrCode size={16} />
                {conectando || carregandoQr ? 'Aguarde...' : 'Conectar WhatsApp'}
              </button>

              {qrcode && (
                <div className="border border-gray-200 rounded-xl p-5 text-center space-y-3">
                  <p className="text-sm font-medium text-gray-700">Escaneie o QR Code</p>
                  {qrcode.qrcode?.base64 ? (
                    <img
                      src={qrcode.qrcode.base64}
                      alt="QR Code WhatsApp"
                      className="mx-auto rounded-xl w-56 h-56 object-contain"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono break-all text-gray-500">
                      {JSON.stringify(qrcode)}
                    </div>
                  )}
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 text-left space-y-1">
                    <p className="font-semibold">Como escanear:</p>
                    <p>1. Abra o WhatsApp no celular</p>
                    <p>2. Toque em <strong>Dispositivos conectados</strong></p>
                    <p>3. Toque em <strong>Conectar dispositivo</strong></p>
                    <p>4. Aponte a câmera para o QR Code acima</p>
                  </div>
                  <p className="text-xs text-gray-400">O status atualiza automaticamente a cada 5 segundos</p>
                </div>
              )}
            </div>
          )}

          {isConnected && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-sm text-green-800">
                ✅ WhatsApp conectado e pronto para enviar e receber mensagens!
              </div>
              <button type="button" onClick={desconectar} className="btn-danger text-sm">
                Desconectar WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Evolution API */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Evolution API</h2>
          <p className="text-sm text-gray-500 mb-4">Configurações técnicas da integração</p>

          <div className="space-y-4">
            <div>
              <label className="label">URL da Evolution API</label>
              <input className="input" value={config.evolution_url} onChange={e => set('evolution_url', e.target.value)} placeholder="http://localhost:8080" />
              <p className="text-xs text-gray-400 mt-1">URL onde a Evolution API está rodando</p>
            </div>
            <div>
              <label className="label">API Key</label>
              <input className="input" type="password" value={config.evolution_key} onChange={e => set('evolution_key', e.target.value)} placeholder="Sua API Key" />
            </div>
            <div>
              <label className="label">Nome da Instância</label>
              <input className="input" value={config.evolution_instance} onChange={e => set('evolution_instance', e.target.value)} placeholder="crm-advocacia" />
            </div>
          </div>
        </div>

        {/* Webhook */}
        <div className="card p-5">
          <h2 className="font-semibold mb-2">URL do Webhook</h2>
          <p className="text-sm text-gray-600 mb-2">Configure este endereço na Evolution API para receber mensagens em tempo real:</p>
          <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 select-all">
            {window.location.origin.replace('5173', '3001')}/webhook/evolution
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save size={16} />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  )
}
