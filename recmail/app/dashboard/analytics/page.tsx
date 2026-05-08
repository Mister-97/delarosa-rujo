'use client'

import { cn } from '@/lib/utils'

// Mock analytics data — replaced by real /api/analytics data when Supabase is connected
const MOCK = {
  summary: { total: 47, responded: 38, qualified: 19, won: 11, responseRate: 81, conversionRate: 50, totalAppointments: 14 },
  volumeByDay: [
    { date: 'Apr 25', count: 2 }, { date: 'Apr 26', count: 4 }, { date: 'Apr 27', count: 1 },
    { date: 'Apr 28', count: 3 }, { date: 'Apr 29', count: 5 }, { date: 'Apr 30', count: 6 },
    { date: 'May 1', count: 2 },  { date: 'May 2', count: 4 },  { date: 'May 3', count: 3 },
    { date: 'May 4', count: 1 },  { date: 'May 5', count: 5 },  { date: 'May 6', count: 4 },
    { date: 'May 7', count: 3 },  { date: 'May 8', count: 4 },
  ],
  busiestHours: Array.from({ length: 24 }, (_, i) => ({
    hour: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i-12}pm`,
    count: [0,0,0,0,0,0,1,3,6,8,7,5,4,3,5,6,7,8,5,3,2,1,0,0][i],
  })),
  stageBreakdown: [
    { stage: 'new', count: 9 }, { stage: 'contacted', count: 8 }, { stage: 'quoted', count: 7 },
    { stage: 'booked', count: 6 }, { stage: 'won', count: 11 }, { stage: 'lost', count: 6 },
  ],
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={cn('text-3xl font-semibold mt-1', color || 'text-[#202124]')}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function BarChart({ data, valueKey, labelKey, color = '#1a73e8', maxHeight = 120 }: {
  data: Record<string, string | number>[]
  valueKey: string
  labelKey: string
  color?: string
  maxHeight?: number
}) {
  const max = Math.max(...data.map(d => d[valueKey] as number), 1)
  return (
    <div className="flex items-end gap-1 h-32">
      {data.map((d, i) => {
        const height = Math.round(((d[valueKey] as number) / max) * maxHeight)
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div
              className="w-full rounded-t transition-all"
              style={{ height: `${height}px`, backgroundColor: color, minHeight: d[valueKey] ? 2 : 0 }}
              title={`${d[labelKey]}: ${d[valueKey]}`}
            />
            {data.length <= 16 && (
              <span className="text-[9px] text-gray-300 truncate w-full text-center">{d[labelKey]}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

const STAGE_COLORS: Record<string, string> = {
  new: '#9ca3af', contacted: '#1a73e8', quoted: '#f59e0b',
  booked: '#8b5cf6', won: '#22c55e', lost: '#ef4444',
}

export default function AnalyticsPage() {
  const data = MOCK

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-base font-medium text-[#202124]">Analytics</h1>
        <span className="text-sm text-gray-400">Last 30 days</span>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* KPI cards */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Missed Calls" value={data.summary.total} sub="last 30 days" />
          <StatCard label="Response Rate" value={`${data.summary.responseRate}%`} sub={`${data.summary.responded} responded`} color="text-[#1a73e8]" />
          <StatCard label="Qualified Leads" value={data.summary.qualified} sub={`${data.summary.conversionRate}% conversion`} color="text-[#34a853]" />
          <StatCard label="Appointments" value={data.summary.totalAppointments} sub={`${data.summary.won} won`} color="text-[#8b5cf6]" />
        </div>

        {/* Volume by day */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-medium text-[#202124] mb-4">Missed Call Volume — Last 14 Days</h2>
          <BarChart data={data.volumeByDay} valueKey="count" labelKey="date" color="#1a73e8" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Busiest hours */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-[#202124] mb-1">Busiest Hours</h2>
            <p className="text-xs text-gray-400 mb-4">When customers call most</p>
            <BarChart
              data={data.busiestHours.filter((_, i) => i >= 6 && i <= 20)}
              valueKey="count"
              labelKey="hour"
              color="#34a853"
              maxHeight={100}
            />
          </div>

          {/* Pipeline breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-medium text-[#202124] mb-4">Pipeline Breakdown</h2>
            <div className="space-y-2.5">
              {data.stageBreakdown.map(({ stage, count }) => {
                const total = data.stageBreakdown.reduce((s, d) => s + d.count, 0)
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 capitalize w-16 flex-shrink-0">{stage}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: STAGE_COLORS[stage] }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#202124] w-6 text-right">{count}</span>
                  </div>
                )
              })}
            </div>

            {/* Win rate callout */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">Win rate</p>
              <p className="text-2xl font-semibold text-[#22c55e] mt-0.5">
                {Math.round((data.summary.won / data.summary.total) * 100)}%
              </p>
              <p className="text-xs text-gray-400">{data.summary.won} won of {data.summary.total} total leads</p>
            </div>
          </div>
        </div>

        {/* Response rate trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#202124]">Lead Funnel</h2>
          </div>
          <div className="flex items-end gap-4">
            {[
              { label: 'Missed Calls', value: data.summary.total, color: '#9ca3af' },
              { label: 'Responded', value: data.summary.responded, color: '#1a73e8' },
              { label: 'Qualified', value: data.summary.qualified, color: '#f59e0b' },
              { label: 'Booked', value: data.summary.totalAppointments, color: '#8b5cf6' },
              { label: 'Won', value: data.summary.won, color: '#22c55e' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex-1 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl font-semibold" style={{ color }}>{value}</span>
                  <div className="w-full rounded" style={{ height: `${Math.round((value / data.summary.total) * 80) + 4}px`, backgroundColor: color, opacity: 0.15 }} />
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-medium" style={{ color }}>
                    {Math.round((value / data.summary.total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
