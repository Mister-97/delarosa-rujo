import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'

export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()

  const { data: templates } = await serviceSupabase
    .from('reply_templates')
    .select('*')
    .or(`is_global.eq.true,client_id.eq.${userRow?.client_id ?? 'none'}`)
    .order('sort_order')

  return NextResponse.json(templates ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: userRow } = await supabase.from('users').select('client_id').eq('id', user.id).single()
  if (!userRow?.client_id) return NextResponse.json({ error: 'No client' }, { status: 403 })

  const { title, body } = await request.json()
  if (!title?.trim() || !body?.trim()) return NextResponse.json({ error: 'Title and body required' }, { status: 400 })

  const { data, error } = await serviceSupabase
    .from('reply_templates')
    .insert({ client_id: userRow.client_id, title: title.trim(), body: body.trim() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
