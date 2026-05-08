'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'

type Stage = 'new' | 'contacted' | 'quoted' | 'booked' | 'won' | 'lost'

type MockConv = {
  id: string
  customer_name: string | null
  customer_phone: string
  stage: Stage
  status: string
  updated_at: string
  preview: string
}

const STAGE_CONFIG: Record<Stage, { label: string; color: string; headerColor: string; count?: number }> = {
  new:       { label: 'New',       color: 'border-gray-300',  headerColor: 'bg-gray-100 text-gray-600' },
  contacted: { label: 'Contacted', color: 'border-blue-300',  headerColor: 'bg-blue-50 text-blue-700' },
  quoted:    { label: 'Quoted',    color: 'border-yellow-300',headerColor: 'bg-yellow-50 text-yellow-700' },
  booked:    { label: 'Booked',    color: 'border-purple-300',headerColor: 'bg-purple-50 text-purple-700' },
  won:       { label: 'Won ✓',     color: 'border-green-300', headerColor: 'bg-green-50 text-green-700' },
  lost:      { label: 'Lost',      color: 'border-red-200',   headerColor: 'bg-red-50 text-red-500' },
}

const STAGES: Stage[] = ['new', 'contacted', 'quoted', 'booked', 'won', 'lost']

const MOCK: MockConv[] = [
  { id: 'mock-5', customer_name: 'Maria Rodriguez', customer_phone: '+18175550488', stage: 'new', status: 'open', updated_at: new Date(Date.now() - 1000*60*60*5).toISOString(), preview: 'Emergency leak — water through ceiling' },
  { id: 'mock-1', customer_name: 'James Martinez', customer_phone: '+18175550101', stage: 'contacted', status: 'open', updated_at: new Date(Date.now() - 1000*60*5).toISOString(), preview: 'AC stopped working with kids at home' },
  { id: 'mock-3', customer_name: null, customer_phone: '+18175550247', stage: 'contacted', status: 'open', updated_at: new Date(Date.now() - 1000*60*60).toISOString(), preview: 'Storm damage on roof' },
  { id: 'mock-6', customer_name: 'Tony Reyes', customer_phone: '+18175550532', stage: 'quoted', status: 'open', updated_at: new Date(Date.now() - 1000*60*60*2).toISOString(), preview: 'Full HVAC system replacement' },
  { id: 'mock-2', customer_name: 'Sarah Collins', customer_phone: '+18175550182', stage: 'booked', status: 'qualified', updated_at: new Date(Date.now() - 1000*60*32).toISOString(), preview: 'Heating tune-up — Thu 8–10am' },
  { id: 'mock-7', customer_name: 'Linda Park', customer_phone: '+18175550671', stage: 'won', status: 'qualified', updated_at: new Date(Date.now() - 1000*60*60*8).toISOString(), preview: 'New AC unit installed' },
  { id: 'mock-4', customer_name: 'David Kim', customer_phone: '+18175550319', stage: 'won', status: 'qualified', updated_at: new Date(Date.now() - 1000*60*60*3).toISOString(), preview: 'Plumbing repair complete' },
]

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
  return phone
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function PipelinePage() {
  const [convs, setConvs] = useState(MOCK)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Stage | null>(null)
  const router = useRouter()

  const byStage = (stage: Stage) => convs.filter(c => c.stage === stage)

  function handleDrop(stage: Stage) {
    if (!dragging) return
    setConvs(prev => prev.map(c => c.id === dragging ? { ...c, stage } : c))
    setDragging(null)
    setDragOver(null)

    // In production, also PATCH /api/conversations/[id]/stage
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-base font-medium text-[#202124]">Pipeline</h1>
        <span className="text-sm text-gray-400">{convs.length} leads</span>
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 h-full min-w-max">
          {STAGES.map(stage => {
            const cards = byStage(stage)
            const cfg = STAGE_CONFIG[stage]
            const isDragTarget = dragOver === stage

            return (
              <div
                key={stage}
                className={cn(
                  'flex flex-col w-64 rounded-xl border-2 transition-colors',
                  isDragTarget ? 'border-[#1a73e8] bg-blue-50' : 'border-transparent bg-[#f1f3f4]'
                )}
                onDragOver={e => { e.preventDefault(); setDragOver(stage) }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', cfg.headerColor)}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{cards.length}</span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-2">
                  {cards.map(conv => (
                    <div
                      key={conv.id}
                      draggable
                      onDragStart={() => setDragging(conv.id)}
                      onDragEnd={() => { setDragging(null); setDragOver(null) }}
                      onClick={() => router.push(`/dashboard/${conv.id}`)}
                      className={cn(
                        'bg-white rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm border border-gray-100 hover:shadow-md transition-shadow',
                        dragging === conv.id && 'opacity-40'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-sm font-medium text-[#202124] leading-tight">
                          {conv.customer_name || formatPhone(conv.customer_phone)}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0 mt-0.5">{timeAgo(conv.updated_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{conv.preview}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-gray-300">{formatPhone(conv.customer_phone)}</span>
                        <Badge className={cn(
                          'text-[10px] px-1.5 py-0',
                          conv.status === 'qualified' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        )}>
                          {conv.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {cards.length === 0 && (
                    <div className={cn(
                      'border-2 border-dashed rounded-lg h-16 flex items-center justify-center transition-colors',
                      isDragTarget ? 'border-[#1a73e8]' : 'border-gray-200'
                    )}>
                      <span className="text-xs text-gray-300">Drop here</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
