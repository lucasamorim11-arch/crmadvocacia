import { useEffect, useState } from 'react'
import { UserPlus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../utils/api'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const PERFIS = { admin: 'Admin', advogado: 'Advogado' }

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState(null)

  const fetchUsuarios = () => api.get('/usuarios').then(r => setUsuarios(r.data))

  useEffect(() => { fetchUsuarios() }, [])

  function abrirNovo() { setEditando(null); setModal(true) }
  function abrirEditar(u) { setEditando(u); setModal(true) }

  async function toggleAtivo(u) {
    try {
      await api.put(`/usuarios/${u.id}`, { ativo: !u.ativo })
      toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
      fetchUsuarios()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function excluir(u) {
    if (!confirm(`Excluir usuário "${u.nome}"?`)) return
    try {
      await api.delete(`/usuarios/${u.id}`)
      toast.success('Usuário excluído')
      fetchUsuarios()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function salvar(dados) {
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, dados)
        toast.success('Usuário atualizado!')
      } else {
        await api.post('/usuarios', dados)
        toast.success('Usuário criado!')
      }
      setModal(false)
      fetchUsuarios()
    } catch (err) {
      toast.error(err.message)
    }
  }

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie quem tem acesso ao CRM</p>
        </div>
        <button onClick={abrirNovo} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Novo Usuário
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">E-mail</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Perfil</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Criado em</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.nome}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.perfil === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                    {PERFIS[u.perfil] || u.perfil}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button
                      onClick={() => toggleAtivo(u)}
                      className={`p-1.5 rounded hover:bg-gray-100 ${u.ativo ? 'text-green-500' : 'text-gray-400'}`}
                      title={u.ativo ? 'Desativar' : 'Ativar'}
                    >
                      {u.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => abrirEditar(u)} className="p-1.5 rounded hover:bg-gray-100 text-blue-500">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => excluir(u)} className="p-1.5 rounded hover:bg-gray-100 text-red-400">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum usuário encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal} onClose={() => setModal(false)} title={editando ? 'Editar Usuário' : 'Novo Usuário'} size="sm">
        <UsuarioForm usuario={editando} onSave={salvar} onCancel={() => setModal(false)} />
      </Modal>
    </div>
  )
}

function UsuarioForm({ usuario, onSave, onCancel }) {
  const [form, setForm] = useState({
    nome: usuario?.nome || '',
    email: usuario?.email || '',
    senha: '',
    perfil: usuario?.perfil || 'advogado',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const dados = { ...form }
    if (!dados.senha) delete dados.senha
    await onSave(dados)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Nome completo *</label>
        <input className="input" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} required placeholder="Nome do usuário" />
      </div>
      <div>
        <label className="label">E-mail *</label>
        <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@exemplo.com" />
      </div>
      <div>
        <label className="label">{usuario ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label>
        <input className="input" type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} required={!usuario} placeholder="••••••••" minLength={6} />
      </div>
      <div>
        <label className="label">Perfil</label>
        <select className="input" value={form.perfil} onChange={e => setForm(f => ({ ...f, perfil: e.target.value }))}>
          <option value="advogado">Advogado</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? 'Salvando...' : usuario ? 'Atualizar' : 'Criar Usuário'}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  )
}
