import { redirect } from 'next/navigation'

// Redirect /admin/clients to /admin (clients are shown on the overview page)
export default function AdminClientsPage() {
  redirect('/admin')
}
