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
      
    if (staff && staff.image) {
      user.image = staff.image
    }
  }

  return <NavbarClient user={user} />
}
