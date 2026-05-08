import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { delay_hours = 24 } = await request.json().catch(() => ({}))

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  const { data: conv } = await supabase.from('conversations').select('client_id').eq('id', id).single()
  if (!userRow || !conv || userRow.client_id !== conv.client_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const scheduled_at = new Date(Date.now() + delay_hours * 60 * 60 * 1000).toISOString()
  const message = "Hi! Just checking in — we'd still love to help. Is there anything we can do for you?"

  const { data, error } = await serviceSupabase
    .from('follow_ups')
    .insert({ conversation_id: id, scheduled_at, message })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
