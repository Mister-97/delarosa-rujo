import { NextRequest, NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { sendSms } from '@/lib/twilio'

// Protected by CRON_SECRET — only Vercel cron can call this
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()

  // Find all pending follow-ups due now
  const { data: due } = await serviceSupabase
    .from('follow_ups')
    .select('*, conversations(customer_phone, client_id, status, clients(twilio_number, business_name))')
    .eq('status', 'pending')
    .lte('scheduled_at', now)

  if (!due || due.length === 0) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const followUp of due) {
    const conv = followUp.conversations as { customer_phone: string; client_id: string; status: string; clients: { twilio_number: string; business_name: string } } | null
    if (!conv || conv.status !== 'open') {
      // Cancel if conversation is no longer open
      await serviceSupabase.from('follow_ups').update({ status: 'cancelled' }).eq('id', followUp.id)
      continue
    }

    try {
      const sid = await sendSms(conv.customer_phone, conv.clients.twilio_number, followUp.message)

      await serviceSupabase.from('messages').insert({
        conversation_id: followUp.conversation_id,
        direction: 'outbound',
        body: followUp.message,
        twilio_sid: sid,
      })

      await serviceSupabase.from('follow_ups').update({ status: 'sent', sent_at: now }).eq('id', followUp.id)
      await serviceSupabase.from('conversations').update({ updated_at: now }).eq('id', followUp.conversation_id)
      sent++
    } catch (err) {
      console.error('Follow-up send failed:', followUp.id, err)
    }
  }

  return NextResponse.json({ sent })
}
