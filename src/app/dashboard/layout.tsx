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
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile?.consent_agreed) {
        router.push('/onboarding/consent')
      } else if (!profile?.display_name) {
        router.push('/onboarding/profile')
      } else if (!profile?.onboarding_context_completed) {
        router.push('/onboarding/context')
      }
      
      setLoading(false)
    }
    
    checkUser()
  }, [router, supabase])

  // THE NEW HIGH-END LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-linen">
        {/* A subtle breathing dot to represent the AI thinking */}
        <div className="relative flex items-center justify-center mb-8">
          <div className="absolute w-4 h-4 bg-charcoal rounded-full opacity-20 animate-ping" />
          <div className="relative w-2 h-2 bg-charcoal rounded-full" />
        </div>
        
        {/* Editorial Typography */}
        <p className="text-[10px] font-bold text-warm-grey uppercase tracking-[0.25em] animate-pulse">
          Initializing
        </p>
      </div>
    )
  }

  return <>{children}</>
}