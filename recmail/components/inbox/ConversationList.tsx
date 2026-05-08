'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Conversation } from '@/types/database'
import { formatDistanceToNow, isToday, format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

type ConversationWithPreview = Conversation & {
  last_message?: string
}

type Props = {
  initialConversations: ConversationWithPreview[]
  clientId: string
  activeTab?: string
}

export default function ConversationList({ initialConversations, clientId, activeTab = 'open' }: Props) {
  const [conversations, setConversations] = useState(initialConversations)
  const [starred, setStarred] = useState<Set<string>>(new Set())
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    if (clientId === 'mock-client') return
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `client_id=eq.${clientId}` }, () => {
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [clientId, router, supabase])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'h:mm a')
    return formatDistanceToNow(date, { addSuffix: false })
  }

  const formatPhone = (phone: string) => {
    const d = phone.replace(/\D/g, '')
    if (d.length === 11 && d[0] === '1') return `(${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`
    return phone
  }

  const tabs = [
    { id: 'open', label: 'Open' },
    { id: 'qualified', label: 'Qualified' },
    { id: 'closed', label: 'Closed' },
  ]

  const currentTab = pathname.includes('?') ? (new URLSearchParams(pathname.split('?')[1])).get('status') || 'open' : 'open'

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar row */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#1a73e8] cursor-pointer" />
        <button className="p-1 rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-500">
          1–{conversations.length} of {conversations.length}
        </span>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-30" disabled>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400 transition-colors disabled:opacity-30" disabled>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const count = conversations.filter(c => c.status === tab.id).length
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.id === 'open' ? '/dashboard' : `/dashboard?status=${tab.id}`)}
              className={cn(
                'flex items-center gap-2 px-6 py-3 text-sm border-b-2 transition-colors',
                isActive
                  ? 'border-[#1a73e8] text-[#1a73e8] font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  isActive ? 'bg-[#1a73e8] text-white' : 'bg-gray-200 text-gray-600'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Conversation rows */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-500">No conversations here</p>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = pathname === `/dashboard/${conv.id}`
            const isUnread = conv.status === 'open' && conv.turn_count < 2
            const isStarred = starred.has(conv.id)
            const displayName = conv.customer_name || formatPhone(conv.customer_phone)
            const preview = conv.last_message || 'No messages yet'

            // Split preview into subject-like part and snippet
            const previewParts = preview.split(' - ')
            const subject = previewParts[0]
            const snippet = previewParts.slice(1).join(' - ')

            return (
              <div
                key={conv.id}
                onClick={() => router.push(`/dashboard/${conv.id}`)}
                className={cn(
                  'flex items-center gap-0 h-[52px] border-b border-gray-100 cursor-pointer group relative',
                  isSelected
                    ? 'bg-[#c2dbff]'
                    : isUnread
                    ? 'bg-white hover:bg-[#f2f6fc]'
                    : 'bg-[#f2f6fc] hover:bg-[#e8eaed]',
                  isSelected && 'shadow-[inset_3px_0_0_#1a73e8]'
                )}
              >
                {/* Checkbox */}
                <div className="w-10 flex items-center justify-center flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-[#1a73e8] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  />
                </div>

                {/* Star */}
                <div className="w-8 flex items-center justify-center flex-shrink-0"
                  onClick={(e) => { e.stopPropagation(); setStarred(s => { const n = new Set(s); n.has(conv.id) ? n.delete(conv.id) : n.add(conv.id); return n }) }}>
                  <Star className={cn(
                    'w-4 h-4 transition-colors',
                    isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-gray-400 opacity-0 group-hover:opacity-100'
                  )} />
                </div>

                {/* Sender name */}
                <div className="w-44 flex-shrink-0 px-2">
                  <span className={cn(
                    'text-sm truncate block',
                    isUnread ? 'font-semibold text-[#202124]' : 'font-normal text-gray-600'
                  )}>
                    {displayName}
                  </span>
                </div>

                {/* Subject + snippet */}
                <div className="flex-1 min-w-0 flex items-center gap-1 pr-2">
                  <span className={cn(
                    'text-sm truncate',
                    isUnread ? 'font-semibold text-[#202124]' : 'font-normal text-gray-700'
                  )}>
                    {subject}
                  </span>
                  {snippet && (
                    <>
                      <span className="text-gray-400 text-sm flex-shrink-0"> - </span>
                      <span className="text-sm text-gray-400 truncate">{snippet}</span>
                    </>
                  )}
                </div>

                {/* Time */}
                <div className="w-20 flex-shrink-0 text-right pr-4">
                  <span className={cn(
                    'text-xs',
                    isUnread ? 'font-semibold text-[#202124]' : 'text-gray-500'
                  )}>
                    {formatTime(conv.updated_at)}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
