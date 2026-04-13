import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Users, TrendingUp, DollarSign, AlertTriangle, Target, Clock } from 'lucide-react'
import api from '../utils/api'
import { formatMoeda, STATUS_LEAD, ORIGEM_LEAD } from '../utils/constants'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [meta, setMeta] = useState({ meta_fechamentos: '', meta_valor: '' })
  const [editandoMeta, setEditandoMeta] = useState(false)

  useEffect(() => {
    api.get('/dashboard').then(r => {
      setData(r.data)
      if (r.data.meta) {
        setMeta({ meta_fechamentos: r.data.meta.meta_fechamentos, meta_valor: r.data.meta.meta_valor })
      }
    }).finally(() => setLoading(false))
  }, [])

  async function salvarMeta() {
    const mes = new Date().getMonth() + 1
    const ano = new Date().getFullYear()
    await api.post('/dashboard/meta', { mes, ano, ...meta })
    setEditandoMeta(false)
    const r = await api.get('/dashboard')
    setData(r.data)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Carregando...</div>

  const statusData = data.porStatus.map(s => ({
    name: STATUS_LEAD[s.status]?.label || s.status,
    total: s.total,
    valor: s.valor_total || 0
  }))

  const origemData = data.porOrigem.map(o => ({
    name: ORIGEM_LEAD[o.origem]?.label || o.origem,
    total: o.total,
    fechados: o.fechados || 0
  }))

  const progresso = data.meta && data.meta.meta_fechamentos > 0
    ? Math.min((data.fechadosMes / data.meta.meta_fechamentos) * 100, 100)
    : 0
  const progressoValor = data.meta && data.meta.meta_valor > 0
    ? Math.min((data.receitaMes / data.meta.meta_valor) * 100, 100)
    : 0

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão geral comercial</p>
        </div>
        <Link to="/leads" className="btn-primary">+ Novo Lead</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Users size={22} className="text-blue-600" />} label="Leads hoje" value={data.leadsHoje} sub={`${data.leadsSemana} na semana`} bg="bg-blue-50" />
        <KpiCard icon={<TrendingUp size={22} className="text-green-600" />} label="Taxa de conversão" value={`${data.taxaConversao}%`} sub={`${data.totalLeads} leads total`} bg="bg-green-50" />
        <KpiCard icon={<DollarSign size={22} className="text-purple-600" />} label="Propostas abertas" value={formatMoeda(data.propostasAbertas?.valor_total)} sub={`${data.propostasAbertas?.total} propostas`} bg="bg-purple-50" />
        <KpiCard icon={<AlertTriangle size={22} className="text-orange-600" />} label="Follow-ups atrasados" value={data.followupsAtrasados} sub="Precisam de atenção" bg="bg-orange-50" href="/leads" />
      </div>

      {/* Meta Mensal */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-blue-600" />
            <h2 className="font-semibold">Meta Mensal — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
          </div>
          <button onClick={() => setEditandoMeta(!editandoMeta)} className="text-sm text-blue-600 hover:underline">
            {editandoMeta ? 'Cancelar' : 'Editar meta'}
          </button>
        </div>

        {editandoMeta && (
          <div className="flex gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="label">Meta de fechamentos</label>
              <input className="input w-40" type="number" value={meta.meta_fechamentos} onChange={e => setMeta(m => ({ ...m, meta_fechamentos: e.target.value }))} placeholder="Ex: 10" />
            </div>
            <div>
              <label className="label">Meta de receita (R$)</label>
              <input className="input w-48" type="number" value={meta.meta_valor} onChange={e => setMeta(m => ({ ...m, meta_valor: e.target.value }))} placeholder="Ex: 50000" />
            </div>
            <div className="flex items-end">
              <button onClick={salvarMeta} className="btn-primary">Salvar</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <MetaProgressBar label="Fechamentos" atual={data.fechadosMes} meta={data.meta?.meta_fechamentos} pct={progresso} suffix="contratos" />
          <MetaProgressBar label="Receita" atual={formatMoeda(data.receitaMes)} meta={data.meta?.meta_valor ? formatMoeda(data.meta.meta_valor) : null} pct={progressoValor} />
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Leads por Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => n === 'valor' ? formatMoeda(v) : v} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold mb-4">Origem dos Leads</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={origemData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {origemData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Leads por dia */}
      {data.leadsPorDia.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Leads nos últimos 30 dias</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.leadsPorDia}>
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} tickFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip labelFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')} />
              <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Propostas do mês */}
      <div className="card p-5">
        <h2 className="font-semibold mb-4">Propostas no mês</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{data.propostasMes?.total || 0}</div>
            <div className="text-xs text-gray-500 mt-1">Total</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-700">{data.propostasMes?.enviadas || 0}</div>
            <div className="text-xs text-blue-600 mt-1">Enviadas</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-700">{data.propostasMes?.aceitas || 0}</div>
            <div className="text-xs text-green-600 mt-1">Aceitas</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-700">{data.propostasMes?.recusadas || 0}</div>
            <div className="text-xs text-red-600 mt-1">Recusadas</div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-green-800">Receita fechada no mês</span>
          <span className="text-xl font-bold text-green-700">{formatMoeda(data.receitaMes)}</span>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ icon, label, value, sub, bg, href }) {
  const content = (
    <div className={`card p-5 flex items-start gap-4`}>
      <div className={`${bg} p-2.5 rounded-lg`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className="text-2xl font-bold text-gray-900 mt-0.5">{value}</div>
        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
      </div>
    </div>
  )
  return href ? <Link to={href}>{content}</Link> : content
}

function MetaProgressBar({ label, atual, meta, pct, suffix }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{meta ? `${atual} / ${meta}${suffix ? ' ' + suffix : ''}` : `${atual} (sem meta definida)`}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-blue-500' : 'bg-orange-400'}`} style={{ width: `${pct}%` }} />
      </div>
      {meta && <div className="text-xs text-gray-400 mt-1">{pct.toFixed(0)}% da meta atingida</div>}
    </div>
  )
}
