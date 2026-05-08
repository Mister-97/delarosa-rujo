'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Message, Conversation } from '@/types/database'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, ChevronDown, Archive, Trash2, MoreHorizontal, ArrowLeft, Zap, X } from 'lucide-react'
import Link from 'next/link'

type Props = {
  conversation: Conversation
  initialMessages: Message[]
}

const GLOBAL_TEMPLATES = [
  { id: 't1', title: 'On our way', body: 'Great news — our technician is on the way and should arrive within 30–60 minutes!' },
  { id: 't2', title: 'Call back soon', body: 'Thanks for reaching out! One of our team members will give you a call back within the hour.' },
  { id: 't3', title: 'Schedule tomorrow', body: "We'd love to help! Can we schedule you for tomorrow morning between 8–10am?" },
  { id: 't4', title: 'Need more info', body: 'Thanks for contacting us! Could you share a bit more about the issue so we can send the right technician?' },
  { id: 't5', title: 'Request address', body: 'Perfect! Could you share your address so we can get someone out to you?' },
  { id: 't6', title: 'Appointment confirmed', body: 'Your appointment is confirmed! Our tech will be there at the time we discussed. See you soon!' },
]

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

export default function MessageThread({ conversation, initialMessages }: Props) {
  const [messages, setMessages] = useState(initialMessages)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (conversation.id.startsWith('mock')) return
    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversation.id, supabase])

  async function handleSend() {
    if (!replyText.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyText.trim() }),
      })
      if (res.ok) { setReplyText(''); setReplyOpen(false) }
    } finally { setSending(false) }
  }

  async function updateStatus(status: string) {
    await fetch(`/api/conversations/${conversation.id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  function useTemplate(body: string) {
    setReplyText(body)
    setShowTemplates(false)
    setReplyOpen(true)
  }

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '')
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
    return phone
  }

  const displayName = conversation.customer_name || formatPhone(conversation.customer_phone)

  return (
    <div className="flex flex-col h-full bg-white min-h-0 flex-1">
      {/* Thread toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Archive" onClick={() => updateStatus('closed')}>
          <Archive className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <Badge className={cn('text-xs', statusColors[conversation.status])}>{conversation.status}</Badge>
        <div className="relative group ml-1">
          <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded px-2 py-1 hover:bg-gray-50 transition-colors">
            Move <ChevronDown className="w-3 h-3" />
          </button>
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-10 min-w-28">
            {['open', 'qualified', 'closed'].map(s => (
              <button key={s} onClick={() => updateStatus(s)} className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 capitalize">{s}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Thread title */}
      <div className="px-6 pt-4 pb-2 flex-shrink-0 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-normal text-[#202124]">{displayName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatPhone(conversation.customer_phone)} · {conversation.turn_count} messages
            </p>
          </div>
          {/* Stage badge */}
          <div className="text-xs text-gray-400 text-right">
            <div className="font-medium text-[#202124] capitalize">{(conversation as Record<string, unknown>).stage as string || 'new'}</div>
            <div>pipeline stage</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 min-h-0">
        {messages.map((msg, i) => {
          const isOutbound = msg.direction === 'outbound'
          const showSender = i === 0 || messages[i-1]?.direction !== msg.direction
          return (
            <div key={msg.id}>
              {showSender && (
                <div className={cn('flex items-center gap-2 mb-1', isOutbound ? 'justify-end' : 'justify-start')}>
                  {!isOutbound && (
                    <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-semibold text-gray-600">{displayName[0]}</span>
                    </div>
                  )}
                  <span className="text-[11px] text-gray-400">
                    {isOutbound ? 'RecMail AI' : displayName} · {format(new Date(msg.created_at), 'h:mm a')}
                  </span>
                </div>
              )}
              <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start pl-7')}>
                <div className={cn(
                  'max-w-[72%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed',
                  isOutbound ? 'bg-[#1a73e8] text-white rounded-br-sm' : 'bg-[#f1f3f4] text-[#202124] rounded-bl-sm'
                )}>
                  {msg.body}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Reply area */}
      <div className="px-6 pb-5 pt-2 flex-shrink-0">
        {/* Quick templates row */}
        {showTemplates && (
          <div className="mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span className="text-xs font-medium text-[#202124]">Quick replies</span>
              </div>
              <button onClick={() => setShowTemplates(false)}>
                <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {GLOBAL_TEMPLATES.map(t => (
                <button key={t.id} onClick={() => useTemplate(t.body)}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors">
                  <div className="text-xs font-medium text-[#202124]">{t.title}</div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{t.body}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {!replyOpen ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setReplyOpen(true)}
              className="flex-1 flex items-center gap-3 border border-gray-200 rounded-2xl px-5 py-3 text-sm text-gray-400 hover:bg-gray-50 transition-colors shadow-sm text-left">
              <div className="w-6 h-6 rounded-full bg-[#1a73e8] flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-white font-medium">R</span>
              </div>
              Reply to {displayName}...
            </button>
            <button onClick={() => { setShowTemplates(s => !s) }}
              className="flex items-center gap-1.5 text-xs text-[#1a73e8] border border-[#1a73e8] rounded-full px-3 py-2 hover:bg-blue-50 transition-colors">
              <Zap className="w-3.5 h-3.5" />
              Templates
            </button>
          </div>
        ) : (
          <div className="border border-gray-300 rounded-2xl shadow-md overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100">
              <span className="text-xs text-gray-500">To</span>
              <span className="text-xs font-medium text-[#202124]">{formatPhone(conversation.customer_phone)}</span>
              <span className="text-xs text-gray-300 ml-auto">SMS</span>
            </div>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your reply..."
              className="border-0 resize-none focus-visible:ring-0 text-sm min-h-[90px] px-4 py-3"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend()
                if (e.key === 'Escape') setReplyOpen(false)
              }}
            />
            <div className="flex items-center gap-3 px-4 py-3 bg-white">
              <Button onClick={handleSend} disabled={!replyText.trim() || sending}
                className="h-9 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm gap-2 rounded-full px-5 font-medium">
                <Send className="w-3.5 h-3.5" />
                {sending ? 'Sending...' : 'Send'}
              </Button>
              <button onClick={() => setShowTemplates(s => !s)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1a73e8] transition-colors">
                <Zap className="w-3.5 h-3.5" />
                Templates
              </button>
              <span className="text-xs text-gray-300">⌘↩</span>
              <div className="flex-1" />
              <button onClick={() => { setReplyOpen(false); setReplyText('') }} className="text-xs text-gray-400 hover:text-gray-600">Discard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
