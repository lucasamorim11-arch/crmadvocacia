import { useState } from 'react'
import { Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../utils/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/login', form)
      login(res.data.usuario, res.data.token)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scale size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CRM Advocacia</h1>
          <p className="text-slate-400 mt-1 text-sm">Faça login para continuar</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">E-mail</label>
              <input
                className="input"
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@crm.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Senha</label>
              <input
                className="input"
                type="password"
                value={form.senha}
                onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 text-center">
            Acesso padrão: <strong>admin@crm.com</strong> / <strong>admin123</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
