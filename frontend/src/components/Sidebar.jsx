import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Kanban, Users, FileText,
  MessageSquare, BarChart2, Settings, Scale,
  MessageCircle, Shield, LogOut
} from 'lucide-react'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
    toast.success('Até logo!')
  }

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/funil', label: 'Funil de Vendas', icon: Kanban },
    { to: '/leads', label: 'Leads & Clientes', icon: Users },
    { to: '/propostas', label: 'Propostas', icon: FileText },
    { to: '/chat', label: 'Chat', icon: MessageCircle },
    { to: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { to: '/relatorios', label: 'Relatórios', icon: BarChart2 },
    { to: '/configuracoes', label: 'Configurações', icon: Settings },
    ...(isAdmin ? [{ to: '/usuarios', label: 'Usuários', icon: Shield }] : []),
  ]

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Scale size={20} />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">CRM Advocacia</div>
            <div className="text-xs text-slate-400">Gestão Comercial</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Usuário + logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user?.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">{user?.nome}</div>
            <div className="text-xs text-slate-400 truncate">{user?.perfil}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  )
}
