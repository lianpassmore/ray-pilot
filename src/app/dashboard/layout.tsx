'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkUser() {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/login')
        return
      }

      // Check if profile exists and has display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, consent_agreed')
        .eq('id', user.id)
        .single()

      if (!profile?.consent_agreed) {
        router.push('/onboarding/consent')
      } else if (!profile?.display_name) {
        router.push('/onboarding/profile')
      }
      
      setLoading(false)
    }
    
    checkUser()
  }, [router, supabase])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-linen text-warm-grey">Loading...</div>
  }

  return <>{children}</>
}