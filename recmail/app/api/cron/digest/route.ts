import { NextRequest, NextResponse } from 'next/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  // Get all clients with owner emails
  const { data: clients } = await serviceSupabase
    .from('clients')
    .select('id, business_name, owner_id, users!clients_owner_id_fkey(email)')

  if (!clients) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const client of clients) {
    const ownerEmail = (client.users as { email: string } | null)?.email
    if (!ownerEmail) continue

    const [
      { count: missedCalls },
      { count: responded },
      { count: qualified },
      { count: appointments },
    ] = await Promise.all([
      serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', client.id).gte('created_at', yesterday),
      serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', client.id).gte('created_at', yesterday).gt('turn_count', 1),
      serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }).eq('client_id', client.id).gte('created_at', yesterday).eq('status', 'qualified'),
      serviceSupabase.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', client.id).gte('created_at', yesterday),
    ])

    const responseRate = missedCalls ? Math.round(((responded ?? 0) / missedCalls) * 100) : 0

    await resend.emails.send({
      from: 'RecMail <digest@recmail.app>',
      to: ownerEmail,
      subject: `RecMail Daily Digest — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a73e8; margin-bottom: 4px;">RecMail Daily Digest</h2>
          <p style="color: #666; margin-top: 0;">${client.business_name} · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 36px; font-weight: bold; color: #202124;">${missedCalls ?? 0}</div>
              <div style="color: #666; font-size: 14px;">Missed Calls</div>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 36px; font-weight: bold; color: #1a73e8;">${responseRate}%</div>
              <div style="color: #666; font-size: 14px;">Response Rate</div>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 36px; font-weight: bold; color: #34a853;">${qualified ?? 0}</div>
              <div style="color: #666; font-size: 14px;">Qualified Leads</div>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center;">
              <div style="font-size: 36px; font-weight: bold; color: #fbbc04;">${appointments ?? 0}</div>
              <div style="color: #666; font-size: 14px;">Appointments Booked</div>
            </div>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 24px; text-decoration: none; font-weight: 500;">
            View Inbox →
          </a>
        </div>
      `,
    })
    sent++
  }

  return NextResponse.json({ sent })
}
