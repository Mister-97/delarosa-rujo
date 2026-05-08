import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { generateSummary } from '@/lib/gemini'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify the user belongs to the conversation's client
  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  const { data: conversation } = await supabase.from('conversations').select('client_id, id').eq('id', id).single()

  if (!userRow || !conversation || userRow.client_id !== conversation.client_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Fetch messages and client info
  const [{ data: messages }, { data: client }] = await Promise.all([
    serviceSupabase.from('messages').select('direction, body').eq('conversation_id', id).order('created_at'),
    serviceSupabase.from('clients').select('business_name').eq('id', conversation.client_id).single(),
  ])

  if (!messages || !client) {
    return NextResponse.json({ error: 'Data not found' }, { status: 404 })
  }

  const result = await generateSummary(
    messages as { direction: 'inbound' | 'outbound'; body: string }[],
    client.business_name
  )

  const { data: summary, error } = await serviceSupabase
    .from('summaries')
    .upsert(
      {
        conversation_id: id,
        summary_text: result.summary,
        lead_type: result.lead_type,
        urgency: result.urgency,
        extracted_data: result.extracted_data,
      },
      { onConflict: 'conversation_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(summary)
}
