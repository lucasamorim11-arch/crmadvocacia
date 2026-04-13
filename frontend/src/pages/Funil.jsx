import { useEffect, useState, useCallback } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, closestCenter, useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { STATUS_LEAD, FUNIL_COLUNAS, ORIGEM_LEAD, formatMoeda } from '../utils/constants'
import Modal from '../components/Modal'
import LeadForm from '../components/LeadForm'
import toast from 'react-hot-toast'

export default function Funil() {
  const [leads, setLeads] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [modalNovo, setModalNovo] = useState(false)
  const [modalPerda, setModalPerda] = useState({ open: false, lead: null })
  const [motivoPerda, setMotivoPerda] = useState('')
  const navigate = useNavigate()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const fetchLeads = useCallback(() => {
    api.get('/leads?limit=500').then(r => setLeads(r.data.leads))
  }, [])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const colunas = FUNIL_COLUNAS.map(status => ({
    status,
    ...STATUS_LEAD[status],
    leads: leads.filter(l => l.status === status)
  }))

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

    const leadId = active.id
    const novoStatus = over.id

    if (!FUNIL_COLUNAS.includes(novoStatus)) return
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.status === novoStatus) return

    if (novoStatus === 'perdido') {
      setModalPerda({ open: true, lead: { ...lead, novoStatus } })
      return
    }

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: novoStatus } : l))
    try {
      await api.patch(`/leads/${leadId}/status`, { status: novoStatus })
    } catch {
      fetchLeads()
      toast.error('Erro ao atualizar status')
    }
  }

  async function confirmarPerda() {
    const { lead } = modalPerda
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'perdido', motivo_perda: motivoPerda } : l))
    await api.patch(`/leads/${lead.id}/status`, { status: 'perdido', motivo_perda: motivoPerda })
    setModalPerda({ open: false, lead: null })
    setMotivoPerda('')
    toast.success('Lead marcado como perdido')
  }

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  return (
    <div className="h-full fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Funil de Vendas</h1>
          <p className="text-gray-500 text-sm mt-0.5">{leads.length} leads no total</p>
        </div>
        <button onClick={() => setModalNovo(true)} className="btn-primary">+ Novo Lead</button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 kanban-board">
          {colunas.map(col => (
            <Coluna key={col.status} col={col} onLeadClick={id => navigate(`/leads/${id}`)} />
          ))}
        </div>
        <DragOverlay>
          {activeLead && <LeadCardOverlay lead={activeLead} />}
        </DragOverlay>
      </DndContext>

      <Modal isOpen={modalNovo} onClose={() => setModalNovo(false)} title="Novo Lead">
        <LeadForm onSave={() => { setModalNovo(false); fetchLeads() }} onCancel={() => setModalNovo(false)} />
      </Modal>

      <Modal isOpen={modalPerda.open} onClose={() => setModalPerda({ open: false, lead: null })} title="Motivo da Perda" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Por que o lead <strong>{modalPerda.lead?.nome}</strong> foi perdido?</p>
          <input className="input" value={motivoPerda} onChange={e => setMotivoPerda(e.target.value)} placeholder="Ex: Preço, escolheu outro escritório..." autoFocus />
          <div className="flex gap-3">
            <button onClick={confirmarPerda} className="btn-danger flex-1">Confirmar Perda</button>
            <button onClick={() => setModalPerda({ open: false, lead: null })} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function Coluna({ col, onLeadClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.status })
  const total = col.leads.reduce((s, l) => s + (l.valor_estimado || 0), 0)

  return (
    <div className="shrink-0 w-64">
      <div className={`${col.kanban} rounded-xl p-3 min-h-96 transition-colors ${isOver ? 'ring-2 ring-blue-400' : ''}`}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-sm text-gray-700">{col.label}</div>
            <div className="text-xs text-gray-400">{col.leads.length} leads · {formatMoeda(total)}</div>
          </div>
          <span className="badge bg-white text-gray-600 shadow-sm">{col.leads.length}</span>
        </div>

        <div ref={setNodeRef} className="space-y-2 min-h-16">
          {col.leads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead.id)} />
          ))}
          {col.leads.length === 0 && (
            <div className="text-center py-8 text-gray-300 text-xs">Arraste leads aqui</div>
          )}
        </div>
      </div>
    </div>
  )
}

function LeadCard({ lead, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })
  const origem = ORIGEM_LEAD[lead.origem]

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="font-medium text-sm text-gray-800 truncate">{lead.nome}</div>
      {lead.valor_estimado > 0 && (
        <div className="text-xs font-semibold text-green-600 mt-1">{formatMoeda(lead.valor_estimado)}</div>
      )}
      <div className="flex items-center justify-between mt-2">
        {lead.area_direito && <span className="text-xs text-gray-400 truncate">{lead.area_direito}</span>}
        {origem && <span className="text-xs">{origem.icon}</span>}
      </div>
    </div>
  )
}

function LeadCardOverlay({ lead }) {
  return (
    <div className="bg-white rounded-lg p-3 shadow-xl border border-blue-200 w-64 rotate-2 cursor-grabbing">
      <div className="font-medium text-sm text-gray-800 truncate">{lead.nome}</div>
      {lead.valor_estimado > 0 && (
        <div className="text-xs font-semibold text-green-600 mt-1">{formatMoeda(lead.valor_estimado)}</div>
      )}
    </div>
  )
}
