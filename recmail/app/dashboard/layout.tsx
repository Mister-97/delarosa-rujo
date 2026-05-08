import { createServerSupabase } from '@/lib/supabase/server'
import Link from 'next/link'
import { Mail, Star, Clock, Send, FileText, ChevronDown, Tag, Settings, HelpCircle, Grid3x3, PenSquare, Inbox, CheckCircle2, XCircle, Kanban, BarChart2 } from 'lucide-react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const userRow = user ? (await supabase
    .from('users')
    .select('client_id, role, full_name, email')
    .eq('id', user.id)
    .single()).data : null

  const client = userRow?.client_id
    ? (await supabase.from('clients').select('business_name').eq('id', userRow.client_id).single()).data
    : null

  const displayName = userRow?.full_name || userRow?.email || 'Demo'
  const initials = displayName[0].toUpperCase()

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden" style={{ fontFamily: "'Google Sans', Inter, sans-serif" }}>

      {/* ─── Top bar ─── */}
      <header className="flex items-center gap-2 px-4 h-16 flex-shrink-0 border-b border-gray-100">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-1 w-64 flex-shrink-0">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <Link href="/dashboard" className="flex items-center gap-2 ml-1">
            <div className="w-8 h-8 bg-[#1a73e8] rounded-lg flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl text-gray-700 font-normal tracking-tight">RecMail</span>
          </Link>
        </div>

        {/* Center: search bar */}
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="flex items-center bg-[#eaf1fb] hover:bg-[#e2ebf8] rounded-full h-11 px-4 gap-3 transition-colors cursor-text group">
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-sm text-gray-400">Search conversations</span>
            <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
        </div>

        {/* Right: icons + avatar */}
        <div className="flex items-center gap-1 ml-auto">
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" title="Help">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" title="Settings">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors" title="Apps">
            <Grid3x3 className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-8 h-8 ml-1 bg-[#1a73e8] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0" title={displayName}>
            <span className="text-sm text-white font-medium">{initials}</span>
          </div>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div className="flex flex-1 min-h-0">

        {/* ─── Left sidebar ─── */}
        <aside className="w-64 flex-shrink-0 flex flex-col pt-3 pb-4 overflow-y-auto">

          {/* Compose */}
          <div className="px-3 mb-4">
            <button className="flex items-center gap-3 bg-[#c2e7ff] hover:bg-[#a8d8f5] transition-colors rounded-2xl px-5 py-3.5 shadow-sm w-full text-left">
              <PenSquare className="w-5 h-5 text-[#001d35]" />
              <span className="text-sm font-medium text-[#001d35]">Compose</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 pr-3">
            <SidebarItem href="/dashboard" icon={<Inbox className="w-5 h-5" />} label="Inbox" count={3} active />
            <SidebarItem href="/dashboard?status=qualified" icon={<CheckCircle2 className="w-5 h-5" />} label="Qualified" />
            <SidebarItem href="/dashboard?status=closed" icon={<XCircle className="w-5 h-5" />} label="Closed" />
            <SidebarItem href="/dashboard/pipeline" icon={<Kanban className="w-5 h-5" />} label="Pipeline" />
            <SidebarItem href="/dashboard/analytics" icon={<BarChart2 className="w-5 h-5" />} label="Analytics" />
            <SidebarItem href="#" icon={<Star className="w-5 h-5" />} label="Starred" />
            <SidebarItem href="#" icon={<Clock className="w-5 h-5" />} label="Snoozed" />
            <SidebarItem href="#" icon={<Send className="w-5 h-5" />} label="Sent" />
            <SidebarItem href="#" icon={<FileText className="w-5 h-5" />} label="Drafts" />
            <SidebarItem href="#" icon={<ChevronDown className="w-5 h-5" />} label="More" />
          </nav>

          {/* Labels */}
          <div className="px-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">Labels</span>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 px-1 py-1.5 rounded-r-full hover:bg-gray-100 cursor-pointer -ml-2 pl-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">{client?.business_name || 'My Business'}</span>
            </div>
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <main className="flex-1 flex flex-col min-w-0 border-l border-gray-200">
          {children}
        </main>

      </div>
    </div>
  )
}

function SidebarItem({
  href,
  icon,
  label,
  count,
  active,
}: {
  href: string
  icon: React.ReactNode
  label: string
  count?: number
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 pl-6 pr-3 py-1 rounded-r-full text-sm transition-colors ${
        active
          ? 'bg-[#d3e3fd] text-[#001d35] font-semibold'
          : 'text-gray-700 hover:bg-gray-100 font-normal'
      }`}
    >
      <span className={active ? 'text-[#001d35]' : 'text-gray-500'}>{icon}</span>
      <span className="flex-1">{label}</span>
      {count ? (
        <span className={`text-xs font-semibold ${active ? 'text-[#001d35]' : 'text-gray-700'}`}>{count}</span>
      ) : null}
    </Link>
  )
}
