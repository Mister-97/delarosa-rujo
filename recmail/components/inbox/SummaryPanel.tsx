'use client'

import { useState } from 'react'
import { Summary } from '@/types/database'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Calendar, CheckCircle2, Clock, PhoneCall, ChevronDown, ChevronUp } from 'lucide-react'

type PastConversation = {
  id: string
  created_at: string
  turn_count: number
  status: string
  stage: string
}

type Props = {
  conversationId: string
  initialSummary: Summary | null
  pastConversations?: PastConversation[]
  customerName?: string | null
  customerPhone?: string
}

const leadTypeColors: Record<string, string> = {
  hvac: 'bg-orange-100 text-orange-700', plumbing: 'bg-blue-100 text-blue-700',
  roofing: 'bg-yellow-100 text-yellow-700', electrical: 'bg-purple-100 text-purple-700',
  cleaning: 'bg-teal-100 text-teal-700', landscaping: 'bg-green-100 text-green-700',
  auto: 'bg-gray-100 text-gray-700', medspa: 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-600', other: 'bg-gray-100 text-gray-600',
}

const MOCK_PAST: Record<string, PastConversation[]> = {
  'mock-1': [
    { id: 'past-1', created_at: new Date(Date.now() - 1000*60*60*24*45).toISOString(), turn_count: 4, status: 'closed', stage: 'won' },
    { id: 'past-2', created_at: new Date(Date.now() - 1000*60*60*24*90).toISOString(), turn_count: 2, status: 'closed', stage: 'contacted' },
  ],
  'mock-2': [
    { id: 'past-3', created_at: new Date(Date.now() - 1000*60*60*24*30).toISOString(), turn_count: 5, status: 'closed', stage: 'won' },
  ],
}

function UrgencyDots({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <div key={i} className={cn('w-2 h-2 rounded-full',
          i <= level
            ? level >= 4 ? 'bg-red-500' : level >= 3 ? 'bg-yellow-500' : 'bg-green-500'
            : 'bg-gray-200'
        )} />
      ))}
      <span className="text-[11px] text-gray-400 ml-1">{level}/5</span>
    </div>
  )
}

export default function SummaryPanel({ conversationId, initialSummary, customerPhone }: Props) {
  const [summary, setSummary] = useState<Summary | null>(initialSummary)
  const [generating, setGenerating] = useState(false)
  const [showBooking, setShowBooking] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingTime, setBookingTime] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [schedulingFollowUp, setSchedulingFollowUp] = useState(false)
  const [followUpScheduled, setFollowUpScheduled] = useState(false)

  const pastConvs = MOCK_PAST[conversationId] || []
  const extracted = summary?.extracted_data as Record<string, string | boolean | null> | null

  async function regenerate() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/summary`, { method: 'POST' })
      if (res.ok) setSummary(await res.json())
    } finally { setGenerating(false) }
  }

  async function handleBook() {
    if (!bookingDate || !bookingTime) return
    setBooking(true)
    try {
      const scheduled_at = new Date(`${bookingDate}T${bookingTime}`).toISOString()
      await fetch(`/api/conversations/${conversationId}/book`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduled_at, notes: bookingNotes }),
      })
      setBooked(true)
      setShowBooking(false)
    } finally { setBooking(false) }
  }

  async function handleFollowUp() {
    setSchedulingFollowUp(true)
    try {
      await fetch(`/api/conversations/${conversationId}/follow-up`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delay_hours: 24 }),
      })
      setFollowUpScheduled(true)
    } finally { setSchedulingFollowUp(false) }
  }

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-[#f8f9fa] flex flex-col overflow-y-auto">

      {/* AI Summary section */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Summary</span>
          <button onClick={regenerate} disabled={generating}
            className="text-gray-400 hover:text-[#1a73e8] transition-colors p-1 rounded">
            <RefreshCw className={cn('w-3.5 h-3.5', generating && 'animate-spin')} />
          </button>
        </div>

        <div className="px-4 pb-4 space-y-3">
          {!summary ? (
            <div className="text-center py-4">
              <p className="text-xs text-gray-400 mb-2">Generates after a few exchanges</p>
              <Button variant="outline" size="sm" onClick={regenerate} disabled={generating}
                className="text-xs h-7 border-gray-200">
                {generating ? 'Generating...' : 'Generate now'}
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-[#202124] leading-relaxed">{summary.summary_text}</p>
              <div className="flex items-center gap-2 flex-wrap">
                {summary.lead_type && (
                  <Badge className={cn('text-xs capitalize', leadTypeColors[summary.lead_type] || leadTypeColors.other)}>
                    {summary.lead_type}
                  </Badge>
                )}
                {summary.urgency != null && <UrgencyDots level={summary.urgency} />}
              </div>
              {extracted && Object.keys(extracted).length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {Object.entries(extracted).map(([key, value]) => {
                    if (!value) return null
                    return (
                      <div key={key}>
                        <span className="text-[10px] uppercase text-gray-400">{key.replace(/_/g,' ')}</span>
                        <p className="text-xs text-[#202124]">{value === true ? 'Yes' : String(value)}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</p>
        <div className="space-y-2">

          {/* Book appointment */}
          {booked ? (
            <div className="flex items-center gap-2 text-green-600 text-xs py-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Appointment booked! Confirmation sent.</span>
            </div>
          ) : (
            <>
              <button onClick={() => setShowBooking(s => !s)}
                className="w-full flex items-center gap-2 text-sm text-[#202124] border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
                <Calendar className="w-4 h-4 text-[#1a73e8]" />
                <span className="flex-1 text-left">Book Appointment</span>
                {showBooking ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
              </button>
              {showBooking && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white" />
                  <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white" />
                  <input placeholder="Notes (optional)" value={bookingNotes} onChange={e => setBookingNotes(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white" />
                  <Button onClick={handleBook} disabled={!bookingDate || !bookingTime || booking}
                    className="w-full h-8 text-xs bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-lg">
                    {booking ? 'Booking...' : 'Confirm & Send SMS'}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Follow-up */}
          {followUpScheduled ? (
            <div className="flex items-center gap-2 text-blue-600 text-xs py-1">
              <Clock className="w-4 h-4" />
              <span>Follow-up scheduled for 24h</span>
            </div>
          ) : (
            <button onClick={handleFollowUp} disabled={schedulingFollowUp}
              className="w-full flex items-center gap-2 text-sm text-[#202124] border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="flex-1 text-left">{schedulingFollowUp ? 'Scheduling...' : 'Schedule Follow-up'}</span>
              <span className="text-xs text-gray-400">24h</span>
            </button>
          )}

          {/* Mark as Won */}
          <button onClick={async () => {
            await fetch(`/api/conversations/${conversationId}/stage`, {
              method: 'PATCH', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stage: 'won' }),
            })
          }}
            className="w-full flex items-center gap-2 text-sm text-[#202124] border border-gray-200 rounded-lg px-3 py-2 hover:bg-green-50 hover:border-green-200 transition-colors">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="flex-1 text-left">Mark as Won</span>
          </button>

          {/* Call customer */}
          {customerPhone && (
            <a href={`tel:${customerPhone}`}
              className="w-full flex items-center gap-2 text-sm text-[#202124] border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
              <PhoneCall className="w-4 h-4 text-green-600" />
              <span className="flex-1 text-left">Call Customer</span>
            </a>
          )}
        </div>
      </div>

      {/* Customer history */}
      {pastConvs.length > 0 && (
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <button onClick={() => setShowHistory(s => !s)}
            className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer History</span>
            <div className="flex items-center gap-1">
              <span className="text-xs bg-[#1a73e8] text-white rounded-full w-4 h-4 flex items-center justify-center">{pastConvs.length}</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
            </div>
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-gray-400">Returning customer — {pastConvs.length} previous {pastConvs.length === 1 ? 'conversation' : 'conversations'}</p>
              {pastConvs.map(pc => (
                <div key={pc.id} className="flex items-center justify-between py-1.5 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-[#202124]">{new Date(pc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[11px] text-gray-400">{pc.turn_count} messages · {pc.stage}</p>
                  </div>
                  <Badge className={cn('text-[10px]', pc.stage === 'won' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                    {pc.stage}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No history state */}
      {pastConvs.length === 0 && (
        <div className="px-4 py-3 bg-white border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Customer History</p>
          <p className="text-xs text-gray-400">First time contacting this business</p>
        </div>
      )}
    </div>
  )
}
