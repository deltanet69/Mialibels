// Server Component — baca session dari cookie langsung, tanpa fetch network
import { getSession } from '@/lib/session'
import { SidebarClient } from '@/components/portal/SidebarClient'

export async function Sidebar() {
  const user = await getSession()
  const role = user?.role ?? null

  return <SidebarClient role={role} userName={user?.name ?? ''} />
}
