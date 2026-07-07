// Server Component
import { getSession } from '@/lib/session'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const user = await getSession()
  return <NavbarClient user={user} />
}
