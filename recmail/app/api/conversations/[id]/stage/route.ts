import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

const VALID_STAGES = ['new', 'contacted', 'quoted', 'booked', 'won', 'lost']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stage } = await request.json()
  if (!VALID_STAGES.includes(stage)) return NextResponse.json({ error: 'Invalid stage' }, { status: 400 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  const { data: conv } = await supabase.from('conversations').select('client_id').eq('id', id).single()
  if (!userRow || !conv || userRow.client_id !== conv.client_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Auto-update status when moving to won/lost
  const statusUpdate: Record<string, string> = { won: 'qualified', lost: 'closed' }
  const updateData: Record<string, string> = { stage, updated_at: new Date().toISOString() }
  if (statusUpdate[stage]) updateData.status = statusUpdate[stage]

  await serviceSupabase.from('conversations').update(updateData).eq('id', id)
  return NextResponse.json({ success: true, stage })
}
