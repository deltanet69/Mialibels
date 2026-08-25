// Server Component
import { getSession } from '@/lib/session'
import { supabase } from '@/lib/supabase'
import { NavbarClient } from './NavbarClient'

export async function Navbar() {
  const user = await getSession()
  
  if (user && user.email) {
    const { data: staff } = await supabase
      .from('staffs')
      .select('image')
      .eq('email', user.email)
      .single()
      
    if (staff && (staff as any).image) {
      (user as any).image = (staff as any).image
    }
  }

  return <NavbarClient user={user} />
}
