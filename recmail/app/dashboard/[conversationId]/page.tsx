import { createServerSupabase } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ConversationList from '@/components/inbox/ConversationList'
import MessageThread from '@/components/inbox/MessageThread'
import SummaryPanel from '@/components/inbox/SummaryPanel'
import { Conversation } from '@/types/database'

const MOCK_CONVERSATIONS = [
  {
    id: 'mock-1',
    client_id: 'mock-client',
    customer_phone: '+18175550101',
    customer_name: 'James Martinez',
    status: 'open' as const,
    turn_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    last_message: 'AC stopped working last night - Yes my unit stopped cooling around 11pm',
  },
  {
    id: 'mock-2',
    client_id: 'mock-client',
    customer_phone: '+18175550182',
    customer_name: 'Sarah Collins',
    status: 'qualified' as const,
    turn_count: 6,
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    last_message: 'Heating tune-up booked - Perfect, see you Thursday morning between 8–10am!',
  },
  {
    id: 'mock-3',
    client_id: 'mock-client',
    customer_phone: '+18175550247',
    customer_name: null,
    status: 'open' as const,
    turn_count: 1,
    created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    last_message: 'Roof repair quote needed - I need someone to come look at storm damage',
  },
  {
    id: 'mock-4',
    client_id: 'mock-client',
    customer_phone: '+18175550319',
    customer_name: 'David Kim',
    status: 'closed' as const,
    turn_count: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    last_message: 'Plumbing repair complete - Thanks David, our team will be there Monday at 9am',
  },
  {
    id: 'mock-5',
    client_id: 'mock-client',
    customer_phone: '+18175550488',
    customer_name: 'Maria Rodriguez',
    status: 'open' as const,
    turn_count: 0,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    last_message: 'Emergency leak - Water is coming through my ceiling right now',
  },
]

const MOCK_MESSAGES: Record<string, Array<{ id: string; conversation_id: string; direction: 'inbound' | 'outbound'; body: string; twilio_sid: null; created_at: string }>> = {
  'mock-1': [
    { id: 'm1', conversation_id: 'mock-1', direction: 'outbound', body: "Hi! You just called ProAir HVAC and we missed you. We'd love to help — what can we do for you today?", twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString() },
    { id: 'm2', conversation_id: 'mock-1', direction: 'inbound', body: 'Yes my unit stopped cooling around 11pm last night. I have kids at home, pretty urgent.', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 6).toISOString() },
    { id: 'm3', conversation_id: 'mock-1', direction: 'outbound', body: "Oh no, that's tough especially with kids! We'll make this a priority. Can you share your address so we can get a tech out to you today?", twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
    { id: 'm4', conversation_id: 'mock-1', direction: 'inbound', body: '1842 Oak Ridge Drive, Fort Worth. Thank you so much', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  ],
  'mock-2': [
    { id: 'm5', conversation_id: 'mock-2', direction: 'outbound', body: "Hi! You just called ProAir HVAC and we missed you. We'd love to help — what can we do for you today?", twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
    { id: 'm6', conversation_id: 'mock-2', direction: 'inbound', body: 'I need my heating system serviced before winter', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 39).toISOString() },
    { id: 'm7', conversation_id: 'mock-2', direction: 'outbound', body: 'Great timing! We can schedule a full heating tune-up. Do mornings or afternoons work better for you?', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString() },
    { id: 'm8', conversation_id: 'mock-2', direction: 'inbound', body: 'Mornings are better. How about Thursday?', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 35).toISOString() },
    { id: 'm9', conversation_id: 'mock-2', direction: 'outbound', body: 'Thursday morning works! Our tech will be there between 8–10am. Can I confirm your address?', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 34).toISOString() },
    { id: 'm10', conversation_id: 'mock-2', direction: 'inbound', body: '423 Maple Ave. Perfect, see you Thursday morning!', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString() },
  ],
  'mock-3': [
    { id: 'm11', conversation_id: 'mock-3', direction: 'outbound', body: "Hi! You just called ProAir HVAC and we missed you. We'd love to help — what can we do for you today?", twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 62).toISOString() },
    { id: 'm12', conversation_id: 'mock-3', direction: 'inbound', body: 'I need someone to come look at storm damage on my roof. There are a few missing shingles.', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  ],
  'mock-5': [
    { id: 'm13', conversation_id: 'mock-5', direction: 'outbound', body: "Hi! You just called ProAir HVAC and we missed you. We'd love to help — what can we do for you today?", twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5 + 1000 * 60).toISOString() },
    { id: 'm14', conversation_id: 'mock-5', direction: 'inbound', body: 'Water is coming through my ceiling right now!! This is an emergency', twilio_sid: null, created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() },
  ],
}

const MOCK_SUMMARIES: Record<string, { id: string; conversation_id: string; summary_text: string; lead_type: string; urgency: number; extracted_data: Record<string, unknown>; created_at: string }> = {
  'mock-2': {
    id: 'sum-1',
    conversation_id: 'mock-2',
    summary_text: 'Sarah needs her heating system serviced before winter. Appointment booked for Thursday 8–10am at 423 Maple Ave.',
    lead_type: 'hvac',
    urgency: 2,
    extracted_data: { customer_name: 'Sarah Collins', service_requested: 'Heating tune-up', preferred_time: 'Thursday 8–10am', address: '423 Maple Ave', phone_confirmed: true },
    created_at: new Date().toISOString(),
  },
  'mock-1': {
    id: 'sum-2',
    conversation_id: 'mock-1',
    summary_text: 'James has kids at home with no AC. Urgent same-day repair needed at 1842 Oak Ridge Drive, Fort Worth.',
    lead_type: 'hvac',
    urgency: 5,
    extracted_data: { customer_name: 'James Martinez', service_requested: 'Emergency AC repair', address: '1842 Oak Ridge Drive, Fort Worth', phone_confirmed: true },
    created_at: new Date().toISOString(),
  },
  'mock-5': {
    id: 'sum-3',
    conversation_id: 'mock-5',
    summary_text: 'Maria has an active water leak coming through her ceiling. Emergency response needed immediately.',
    lead_type: 'plumbing',
    urgency: 5,
    extracted_data: { customer_name: 'Maria Rodriguez', service_requested: 'Emergency water leak', phone_confirmed: true },
    created_at: new Date().toISOString(),
  },
}

type Props = {
  params: Promise<{ conversationId: string }>
}

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const conversation = MOCK_CONVERSATIONS.find(c => c.id === conversationId)
    if (!conversation) notFound()
    const messages = MOCK_MESSAGES[conversationId] ?? []
    const summary = MOCK_SUMMARIES[conversationId] ?? null

    return (
      <div className="flex h-full min-h-0">
        {/* Left: conversation list (narrower when thread is open) */}
        <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col min-h-0">
          <ConversationList initialConversations={MOCK_CONVERSATIONS} clientId="mock-client" activeTab="open" />
        </div>
        {/* Center: message thread */}
        <div className="flex-1 flex min-w-0 min-h-0">
          <MessageThread conversation={conversation} initialMessages={messages} />
          <SummaryPanel conversationId={conversationId} initialSummary={summary} />
        </div>
      </div>
    )
  }

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) notFound()

  const { data: conversation } = await supabase
    .from('conversations').select('*')
    .eq('id', conversationId).eq('client_id', userRow.client_id).single()
  if (!conversation) notFound()

  const { data: allConversations } = await supabase
    .from('conversations').select('*')
    .eq('client_id', userRow.client_id)
    .order('updated_at', { ascending: false })

  const { data: messages } = await supabase
    .from('messages').select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  const { data: summary } = await supabase
    .from('summaries').select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(1).single()

  const conversationsWithPreview = await Promise.all(
    (allConversations ?? []).map(async (conv: Conversation) => {
      const { data: lastMsg } = await supabase
        .from('messages').select('body, direction')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1).single()
      return {
        ...conv,
        last_message: lastMsg ? `${lastMsg.direction === 'outbound' ? 'You: ' : ''}${lastMsg.body}` : undefined,
      }
    })
  )

  return (
    <div className="flex h-full min-h-0">
      <div className="w-80 flex-shrink-0 border-r border-gray-200 flex flex-col min-h-0">
        <ConversationList initialConversations={conversationsWithPreview} clientId={userRow.client_id} activeTab="open" />
      </div>
      <div className="flex-1 flex min-w-0 min-h-0">
        <MessageThread conversation={conversation} initialMessages={messages ?? []} />
        <SummaryPanel conversationId={conversationId} initialSummary={summary ?? null} />
      </div>
    </div>
  )
}
