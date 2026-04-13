import { useEffect, useState } from 'react'
import { Save, RefreshCw } from 'lucide-react'
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
  const [testando, setTestando] = useState(false)

  useEffect(() => {
    api.get('/configuracoes').then(r => {
      setConfig(c => ({
        ...c,
        nome_escritorio: r.data.nome_escritorio || '',
        evolution_url: r.data.evolution_url || 'http://localhost:8080',
        evolution_instance: r.data.evolution_instance || 'crm-advocacia'
      }))
    })
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

  async function testarConexao() {
    setTestando(true)
    try {
      const r = await api.get('/whatsapp/status')
      toast.success(`Conexão OK! Estado: ${r.data.state || 'desconhecido'}`)
    } catch (err) {
      toast.error(`Falha na conexão: ${err.message}`)
    } finally {
      setTestando(false)
    }
  }

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

        {/* Evolution API */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Evolution API (WhatsApp)</h2>
          <p className="text-sm text-gray-500 mb-4">Configure a integração com o WhatsApp via Evolution API</p>

          <div className="space-y-4">
            <div>
              <label className="label">URL da Evolution API</label>
              <input className="input" value={config.evolution_url} onChange={e => set('evolution_url', e.target.value)} placeholder="http://localhost:8080" />
              <p className="text-xs text-gray-400 mt-1">URL onde a Evolution API está rodando</p>
            </div>
            <div>
              <label className="label">API Key</label>
              <input className="input" type="password" value={config.evolution_key} onChange={e => set('evolution_key', e.target.value)} placeholder="Sua API Key da Evolution API" />
            </div>
            <div>
              <label className="label">Nome da Instância</label>
              <input className="input" value={config.evolution_instance} onChange={e => set('evolution_instance', e.target.value)} placeholder="crm-advocacia" />
            </div>

            <button type="button" onClick={testarConexao} disabled={testando} className="btn-secondary flex items-center gap-2 text-sm">
              <RefreshCw size={14} className={testando ? 'animate-spin' : ''} />
              {testando ? 'Testando...' : 'Testar Conexão'}
            </button>
          </div>
        </div>

        {/* Docker info */}
        <div className="card p-5 bg-blue-50 border-blue-100">
          <h2 className="font-semibold text-blue-800 mb-3">Subir Evolution API com Docker</h2>
          <p className="text-sm text-blue-700 mb-3">Use o arquivo <code className="bg-blue-100 px-1 rounded">docker-compose.yml</code> na raiz do projeto:</p>
          <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-700 space-y-1">
            <div>$ cd /caminho/para/crm-advocacia</div>
            <div>$ docker compose up -d evolution</div>
          </div>
          <p className="text-xs text-blue-600 mt-3">A Evolution API ficará disponível em <strong>http://localhost:8080</strong></p>
        </div>

        {/* Webhook */}
        <div className="card p-5">
          <h2 className="font-semibold mb-2">Webhook</h2>
          <p className="text-sm text-gray-600 mb-2">Configure este webhook na Evolution API para receber mensagens:</p>
          <div className="bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700">
            http://localhost:3001/webhook/evolution
          </div>
          <p className="text-xs text-gray-400 mt-2">Em produção, substitua <code>localhost:3001</code> pelo endereço do seu servidor</p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          <Save size={16} />
          {loading ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  )
}
