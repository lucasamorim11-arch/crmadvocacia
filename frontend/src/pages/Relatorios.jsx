import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import api from '../utils/api'
import { formatMoeda, STATUS_LEAD, ORIGEM_LEAD } from '../utils/constants'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Relatorios() {
  const hoje = new Date()
  const [inicio, setInicio] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0])
  const [fim, setFim] = useState(hoje.toISOString().split('T')[0])
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(false)

  async function buscar() {
    setLoading(true)
    try {
      const r = await api.get(`/dashboard/relatorio?inicio=${inicio}&fim=${fim}`)
      setDados(r.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { buscar() }, [])

  const leadsOrigemData = dados?.leads
    ? Object.entries(
        dados.leads.reduce((acc, l) => {
          const key = ORIGEM_LEAD[l.origem]?.label || l.origem
          acc[key] = (acc[key] || 0) + l.total
          return acc
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : []

  const leadsStatusData = dados?.leads
    ? Object.entries(
        dados.leads.reduce((acc, l) => {
          const key = STATUS_LEAD[l.status]?.label || l.status
          acc[key] = (acc[key] || 0) + l.total
          return acc
        }, {})
      ).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-0.5">Análise de performance comercial</p>
      </div>

      {/* Filtro de período */}
      <div className="card p-4 mb-6 flex items-center gap-4">
        <div>
          <label className="label">De</label>
          <input className="input w-40" type="date" value={inicio} onChange={e => setInicio(e.target.value)} />
        </div>
        <div>
          <label className="label">Até</label>
          <input className="input w-40" type="date" value={fim} onChange={e => setFim(e.target.value)} />
        </div>
        <div className="flex items-end">
          <button onClick={buscar} disabled={loading} className="btn-primary">
            {loading ? 'Buscando...' : 'Gerar relatório'}
          </button>
        </div>
        <div className="flex items-end gap-2">
          {[
            { label: 'Este mês', i: new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0], f: hoje.toISOString().split('T')[0] },
            { label: 'Mês passado', i: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().split('T')[0], f: new Date(hoje.getFullYear(), hoje.getMonth(), 0).toISOString().split('T')[0] },
            { label: 'Este ano', i: new Date(hoje.getFullYear(), 0, 1).toISOString().split('T')[0], f: hoje.toISOString().split('T')[0] },
          ].map(p => (
            <button key={p.label} onClick={() => { setInicio(p.i); setFim(p.f) }} className="btn-secondary text-xs px-3">{p.label}</button>
          ))}
        </div>
      </div>

      {!dados ? (
        <div className="text-center py-12 text-gray-400">Configure o período e gere o relatório</div>
      ) : (
        <div className="space-y-6">
          {/* Receita */}
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Resultado do Período</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-xl">
                <div className="text-3xl font-bold text-green-600">{formatMoeda(dados.receitaTotal)}</div>
                <div className="text-sm text-green-700 mt-1">Receita fechada</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600">
                  {dados.leads?.reduce((s, l) => s + l.total, 0) || 0}
                </div>
                <div className="text-sm text-blue-700 mt-1">Leads no período</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-xl">
                <div className="text-3xl font-bold text-purple-600">
                  {dados.propostas?.reduce((s, p) => s + p.total, 0) || 0}
                </div>
                <div className="text-sm text-purple-700 mt-1">Propostas geradas</div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-2 gap-6">
            {leadsOrigemData.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Leads por Origem</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={leadsOrigemData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                      {leadsOrigemData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {leadsStatusData.length > 0 && (
              <div className="card p-5">
                <h2 className="font-semibold mb-4">Leads por Status</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={leadsStatusData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                      {leadsStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Tabela propostas */}
          {dados.propostas?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Propostas por Área e Status</h2>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Área</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dados.propostas.map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{p.area_direito || 'Não informado'}</td>
                      <td className="px-3 py-2 capitalize">{p.status}</td>
                      <td className="px-3 py-2 text-right">{p.total}</td>
                      <td className="px-3 py-2 text-right font-medium text-green-600">{formatMoeda(p.valor_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
