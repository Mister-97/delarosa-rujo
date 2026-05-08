import { serviceSupabase } from '@/lib/supabase/service'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ExternalLink } from 'lucide-react'

export default async function AdminPage() {
  const [
    { data: clients, count: clientCount },
    { count: convCount },
    { count: msgCount },
  ] = await Promise.all([
    serviceSupabase.from('clients').select('*', { count: 'exact' }).order('created_at', { ascending: false }),
    serviceSupabase.from('conversations').select('*', { count: 'exact', head: true }),
    serviceSupabase.from('messages').select('*', { count: 'exact', head: true }),
  ])

  const planColors: Record<string, string> = {
    starter: 'bg-gray-100 text-gray-600',
    growth: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#202124]">Admin Overview</h1>
        <p className="text-sm text-gray-500 mt-1">RecMail internal dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Clients', value: clientCount ?? 0 },
          { label: 'Total Conversations', value: convCount ?? 0 },
          { label: 'Total Messages Sent', value: msgCount ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
            <p className="text-3xl font-semibold text-[#202124] mt-1">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Clients table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#202124]">Clients</h2>
          <Link
            href="/admin/clients/new"
            className="text-xs bg-[#1a73e8] text-white px-3 py-1.5 rounded-lg hover:bg-[#1557b0] transition-colors"
          >
            + Add Client
          </Link>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Business</th>
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Twilio Number</th>
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Plan</th>
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Joined</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(clients ?? []).map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3 font-medium text-[#202124]">{client.business_name}</td>
                <td className="px-6 py-3 text-gray-500 font-mono text-xs">{client.twilio_number}</td>
                <td className="px-6 py-3">
                  <Badge className={`text-xs capitalize ${planColors[client.plan] || planColors.starter}`}>
                    {client.plan}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">
                  {new Date(client.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-3 text-right">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="text-[#1a73e8] hover:underline text-xs inline-flex items-center gap-1"
                  >
                    Manage <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
            {(clients ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No clients yet. Add your first client to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
