import { createServerSupabase } from '@/lib/supabase/server'
import ConversationList from '@/components/inbox/ConversationList'
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

type SearchParams = Promise<{ status?: string }>

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const { status } = await searchParams
  const activeTab = (status && ['open', 'qualified', 'closed'].includes(status)) ? status : 'open'
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const filtered = activeTab === 'open'
      ? MOCK_CONVERSATIONS
      : MOCK_CONVERSATIONS.filter(c => c.status === activeTab)

    return (
      <ConversationList
        initialConversations={filtered}
        clientId="mock-client"
        activeTab={activeTab}
      />
    )
  }

  const { data: userRow } = await supabase
    .from('users').select('client_id').eq('id', user.id).single()

  if (!userRow?.client_id) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500">No business linked to this account. Contact your admin.</p>
      </div>
    )
  }

  let query = supabase
    .from('conversations').select('*')
    .eq('client_id', userRow.client_id)
    .order('updated_at', { ascending: false })

  if (activeTab !== 'open') query = query.eq('status', activeTab)

  const { data: conversations } = await query

  const conversationsWithPreview = await Promise.all(
    (conversations ?? []).map(async (conv: Conversation) => {
      const { data: lastMsg } = await supabase
        .from('messages').select('body, direction')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1).single()

      return {
        ...conv,
        last_message: lastMsg
          ? `${lastMsg.direction === 'outbound' ? 'You: ' : ''}${lastMsg.body}`
          : undefined,
      }
    })
  )

  return (
    <ConversationList
      initialConversations={conversationsWithPreview}
      clientId={userRow.client_id}
      activeTab={activeTab}
    />
  )
}
