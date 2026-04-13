import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './utils/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Funil from './pages/Funil'
import Leads from './pages/Leads'
import LeadDetalhe from './pages/LeadDetalhe'
import Propostas from './pages/Propostas'
import Whatsapp from './pages/Whatsapp'
import Chat from './pages/Chat'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Usuarios from './pages/Usuarios'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="funil" element={<Funil />} />
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetalhe />} />
        <Route path="propostas" element={<Propostas />} />
        <Route path="whatsapp" element={<Whatsapp />} />
        <Route path="chat" element={<Chat />} />
        <Route path="relatorios" element={<Relatorios />} />
        <Route path="configuracoes" element={<Configuracoes />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  )
}
