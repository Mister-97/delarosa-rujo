import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) return NextResponse.json({ error: 'No client' }, { status: 403 })

  const clientId = userRow.client_id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: conversations },
    { data: messages },
    { count: totalAppts },
  ] = await Promise.all([
    serviceSupabase.from('conversations').select('id, status, stage, turn_count, created_at, updated_at').eq('client_id', clientId).gte('created_at', thirtyDaysAgo).order('created_at'),
    serviceSupabase.from('messages').select('conversation_id, direction, created_at').in('conversation_id',
      (await serviceSupabase.from('conversations').select('id').eq('client_id', clientId).gte('created_at', thirtyDaysAgo)).data?.map(c => c.id) ?? []
    ),
    serviceSupabase.from('appointments').select('*', { count: 'exact', head: true }).eq('client_id', clientId),
  ])

  const convs = conversations ?? []
  const msgs = messages ?? []

  // Total stats
  const total = convs.length
  const responded = convs.filter(c => c.turn_count > 1).length
  const qualified = convs.filter(c => c.status === 'qualified').length
  const won = convs.filter(c => c.stage === 'won').length
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0
  const conversionRate = responded > 0 ? Math.round((qualified / responded) * 100) : 0

  // Volume by day (last 14 days)
  const dailyVolume: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    dailyVolume[d.toISOString().split('T')[0]] = 0
  }
  convs.forEach(c => {
    const day = c.created_at.split('T')[0]
    if (day in dailyVolume) dailyVolume[day]++
  })
  const volumeByDay = Object.entries(dailyVolume).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count,
  }))

  // Busiest hours
  const hourCounts = Array(24).fill(0)
  convs.forEach(c => { hourCounts[new Date(c.created_at).getHours()]++ })
  const busiestHours = hourCounts.map((count, hour) => ({
    hour: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
    count,
  }))

  // Messages per day
  const msgsPerDay: Record<string, number> = {}
  msgs.filter(m => m.direction === 'outbound').forEach(m => {
    const day = m.created_at.split('T')[0]
    msgsPerDay[day] = (msgsPerDay[day] || 0) + 1
  })

  // Stage breakdown
  const stages = ['new', 'contacted', 'quoted', 'booked', 'won', 'lost']
  const stageBreakdown = stages.map(stage => ({
    stage,
    count: convs.filter(c => c.stage === stage).length,
  }))

  return NextResponse.json({
    summary: { total, responded, qualified, won, responseRate, conversionRate, totalAppointments: totalAppts ?? 0 },
    volumeByDay,
    busiestHours,
    stageBreakdown,
  })
}
