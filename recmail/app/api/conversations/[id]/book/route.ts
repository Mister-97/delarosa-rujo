import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { sendSms } from '@/lib/twilio'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { scheduled_at, notes } = await request.json()
  if (!scheduled_at) return NextResponse.json({ error: 'scheduled_at required' }, { status: 400 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  const { data: conv } = await supabase.from('conversations').select('*').eq('id', id).single()
  if (!userRow || !conv || userRow.client_id !== conv.client_id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: client } = await serviceSupabase.from('clients').select('*').eq('id', conv.client_id).single()

  // Create appointment
  const { data: appointment, error } = await serviceSupabase
    .from('appointments')
    .insert({
      conversation_id: id,
      client_id: conv.client_id,
      customer_phone: conv.customer_phone,
      customer_name: conv.customer_name,
      scheduled_at,
      notes: notes?.trim() || null,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update conversation stage to booked
  await serviceSupabase.from('conversations').update({ stage: 'booked', status: 'qualified', updated_at: new Date().toISOString() }).eq('id', id)

  // Send confirmation SMS to customer
  if (client) {
    const apptDate = new Date(scheduled_at)
    const dateStr = apptDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const timeStr = apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const confirmMsg = `Your appointment with ${client.business_name} is confirmed for ${dateStr} at ${timeStr}. See you then!`

    try {
      const sid = await sendSms(conv.customer_phone, client.twilio_number, confirmMsg)
      await serviceSupabase.from('messages').insert({ conversation_id: id, direction: 'outbound', body: confirmMsg, twilio_sid: sid })
    } catch (err) {
      console.error('Failed to send booking confirmation SMS:', err)
    }
  }

  return NextResponse.json(appointment)
}
