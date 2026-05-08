import { createServerSupabase } from '@/lib/supabase/server'
import { serviceSupabase } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Mail, Users, Settings, BarChart2 } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check admin status
  const { data: adminRow } = await serviceSupabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!adminRow) redirect('/dashboard')

  return (
    <div className="flex h-screen bg-[#f1f3f4] overflow-hidden">
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#f1f3f4] pt-4 pb-4">
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a73e8] rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-[#202124]">RecMail</span>
          </div>
          <p className="text-xs text-[#1a73e8] font-medium mt-1 pl-10">Admin</p>
        </div>

        <nav className="flex-1 px-2 space-y-0.5">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-[#202124] hover:bg-gray-200 transition-colors">
            <BarChart2 className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link href="/admin/clients" className="flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-[#202124] hover:bg-gray-200 transition-colors">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="font-medium">Clients</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-2xl text-sm text-[#202124] hover:bg-gray-200 transition-colors">
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="font-medium">My Inbox</span>
          </Link>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
