import { Outlet, useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../utils/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
    toast.success('Até logo!')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-end gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800">{user?.nome}</div>
              <div className="text-xs text-gray-400 capitalize">{user?.perfil}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {user?.nome?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
