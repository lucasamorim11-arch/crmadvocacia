import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Kanban, Users, FileText,
  MessageSquare, BarChart2, Settings, Scale
} from 'lucide-react'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/funil', label: 'Funil de Vendas', icon: Kanban },
  { to: '/leads', label: 'Leads & Clientes', icon: Users },
  { to: '/propostas', label: 'Propostas', icon: FileText },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

export default function Sidebar() {
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
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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

      <div className="px-6 py-4 border-t border-slate-700">
        <div className="text-xs text-slate-500">v1.0.0</div>
      </div>
    </aside>
  )
}
