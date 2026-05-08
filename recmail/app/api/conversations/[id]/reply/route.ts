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

  const { body } = await request.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Message body required' }, { status: 400 })

  // Verify user has access to this conversation
  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, client_id, customer_phone')
    .eq('id', id)
    .single()

  if (!userRow || !conversation || userRow.client_id !== conversation.client_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get the client's Twilio number
  const { data: client } = await serviceSupabase
    .from('clients')
    .select('twilio_number')
    .eq('id', conversation.client_id)
    .single()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  // Send SMS
  const twilioSid = await sendSms(conversation.customer_phone, client.twilio_number, body.trim())

  // Store message
  const { data: message, error } = await serviceSupabase
    .from('messages')
    .insert({
      conversation_id: id,
      direction: 'outbound',
      body: body.trim(),
      twilio_sid: twilioSid,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update conversation timestamp
  await serviceSupabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json(message)
}
