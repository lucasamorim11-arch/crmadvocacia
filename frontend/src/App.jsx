import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Funil from './pages/Funil'
import Leads from './pages/Leads'
import LeadDetalhe from './pages/LeadDetalhe'
import Propostas from './pages/Propostas'
import Whatsapp from './pages/Whatsapp'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="funil" element={<Funil />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetalhe />} />
          <Route path="propostas" element={<Propostas />} />
          <Route path="whatsapp" element={<Whatsapp />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </>
  )
}
