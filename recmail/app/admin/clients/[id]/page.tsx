import { serviceSupabase } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params

  const [
    { data: client },
    { data: conversations, count: convCount },
  ] = await Promise.all([
    serviceSupabase.from('clients').select('*').eq('id', id).single(),
    serviceSupabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .eq('client_id', id)
      .order('updated_at', { ascending: false })
      .limit(20),
  ])

  if (!client) notFound()

  const statusColors: Record<string, string> = {
    open: 'bg-blue-100 text-blue-700',
    qualified: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a73e8] mb-6">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to admin
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#202124]">{client.business_name}</h1>
        <p className="text-sm text-gray-400 mt-1 font-mono">{client.twilio_number}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Client info card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Client Info</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-gray-400">Business Name</dt>
              <dd className="text-sm font-medium text-[#202124] mt-0.5">{client.business_name}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Twilio Number</dt>
              <dd className="text-sm font-mono text-[#202124] mt-0.5">{client.twilio_number}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Plan</dt>
              <dd className="mt-0.5">
                <Badge className="text-xs capitalize bg-blue-100 text-blue-700">{client.plan}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Client ID</dt>
              <dd className="text-xs font-mono text-gray-400 mt-0.5 break-all">{client.id}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Created</dt>
              <dd className="text-sm text-[#202124] mt-0.5">{new Date(client.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>

        {/* AI prompt card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">AI Prompt Override</h2>
          {client.gemini_prompt_override ? (
            <p className="text-xs text-[#202124] whitespace-pre-wrap leading-relaxed">
              {client.gemini_prompt_override}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">Using default system prompt</p>
          )}
        </div>
      </div>

      {/* Recent conversations */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-[#202124]">
            Recent Conversations
            <span className="text-gray-400 font-normal ml-2">({convCount ?? 0} total)</span>
          </h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Customer</th>
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Turns</th>
              <th className="text-left px-6 py-3 text-xs text-gray-400 font-medium uppercase tracking-wide">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(conversations ?? []).map((conv) => (
              <tr key={conv.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-mono text-xs text-[#202124]">
                  {conv.customer_name || conv.customer_phone}
                </td>
                <td className="px-6 py-3">
                  <Badge className={`text-xs capitalize ${statusColors[conv.status]}`}>
                    {conv.status}
                  </Badge>
                </td>
                <td className="px-6 py-3 text-gray-400 text-xs">{conv.turn_count}</td>
                <td className="px-6 py-3 text-gray-400 text-xs">
                  {new Date(conv.updated_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {(conversations ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">
                  No conversations yet for this client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
