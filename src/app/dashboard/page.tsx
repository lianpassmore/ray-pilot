'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Info, Phone, LogOut } from 'lucide-react'
import RayWidget from '@/components/RayWidget'
import FeedbackForm from '@/components/FeedbackForm'
import HeaderIcons from '@/components/HeaderIcons'
import TimeMeter from '@/components/TimeMeter' // Assuming this exists
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [progress, setProgress] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  // Session feedback state
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentConversationDbId, setCurrentConversationDbId] = useState<string | null>(null)
  const [isReturning, setIsReturning] = useState(false)

  // 1. Fetch Profile
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      // Redirect to onboarding if consent or profile incomplete
      if (!data || !data.consent_agreed) {
        router.push('/onboarding/consent')
        return
      }
      if (!data.display_name || !data.phone) {
        router.push('/onboarding/profile')
        return
      }

      setProfile(data)
      setIsReturning((data?.total_sessions ?? 0) > 0)
    }
    getProfile()
  }, [])

  const handleSessionEnd = useCallback((conversationDbId: string) => {
    setCurrentConversationDbId(conversationDbId)
    setShowFeedback(true)
  }, [])

  const handleFeedbackComplete = useCallback(() => {
    setShowFeedback(false)
    setCurrentConversationDbId(null)
    // Refresh profile to get updated total_sessions
    if (userId) {
      supabase.from('profiles').select('*').eq('id', userId).single()
        .then(({ data }) => {
          if (data) {
            setProfile(data)
            setIsReturning((data.total_sessions ?? 0) > 0)
          }
        })
    }
  }, [userId, supabase])

  // 2. Countdown Logic
  useEffect(() => {
    const targetDate = new Date('2026-02-12T09:00:00+13:00').getTime()
    const endDate = new Date('2026-02-26T23:59:00+13:00').getTime()

    const timer = setInterval(() => {
      const now = new Date().getTime()
      if (now > endDate) {
        setTimeLeft('Pilot Closed')
        setProgress(100)
        return
      }
      if (now > targetDate) {
        setTimeLeft('Pilot Active')
        const totalDuration = endDate - targetDate
        const elapsed = now - targetDate
        setProgress(Math.min(100, (elapsed / totalDuration) * 100))
        return
      }
      const distance = targetDate - now
      const days = Math.floor(distance / (1000 * 60 * 60 * 24))
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      setTimeLeft(`Starts in: ${days}d ${hours}h`)
      setProgress(0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return null

  return (
    <div className="min-h-screen relative flex flex-col">

      {/* --- HEADER --- */}
<header className="absolute top-0 left-0 w-full p-6 md:p-8 flex justify-between items-start z-20">
  <div>
    <h1 className="text-2xl font-black tracking-widest text-charcoal">RAY</h1>
    {/* ... time meter ... */}
  </div>

  <div className="flex items-center gap-2">
    <HeaderIcons
      onSettingsClick={() => setIsMenuOpen(true)}
    />
  </div>
</header>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 relative z-10">

        {/* The "Greeting" - Dynamic for returning users */}
        <div className="text-center mb-6 opacity-40">
          <p className="text-lg font-medium text-charcoal">
            {isReturning
              ? `Welcome back, ${profile.display_name.split(' ')[0]}.`
              : `Kia ora, ${profile.display_name.split(' ')[0]}.`
            }
          </p>
        </div>

        {/* The Widget Wrapper */}
        <div className="w-full max-w-md flex items-center justify-center">
          <RayWidget userName={profile.display_name} userId={userId!} onSessionEnd={handleSessionEnd} />
        </div>

      </main>

      {/* --- FOOTER / GROUNDING --- */}
      <div className="absolute bottom-6 w-full text-center pb-safe">
        <p className="text-[10px] text-warm-grey uppercase tracking-widest opacity-60">
          Clarity over comfort
        </p>
      </div>

      {/* --- FEEDBACK FORM OVERLAY --- */}
      <AnimatePresence>
        {showFeedback && currentConversationDbId && userId && (
          <FeedbackForm
            conversationDbId={currentConversationDbId}
            userId={userId}
            onComplete={handleFeedbackComplete}
          />
        )}
      </AnimatePresence>

      {/* --- HIGH END SLIDE-OUT MENU --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dark Backdrop */}
          <div 
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px] transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          />

          {/* The Drawer */}
          <div className="relative w-full max-w-sm h-full glass-panel p-8 md:p-12 flex flex-col shadow-2xl animate-[slideIn_0.3s_ease-out]">
            
            {/* Close Button */}
            <div className="flex justify-between items-center mb-12">
              <span className="label-sm">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-charcoal hover:rotate-90 transition-transform duration-300">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-12 flex-1 overflow-y-auto no-scrollbar">
              
              {/* Block 1: About */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-forest flex items-center gap-2">
                  <Info size={16} />
                  About Ray
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed font-medium">
                  Ray holds space for honest conversations about relationships.<br/>
                  Not therapy. Not a cheerleader. Just a thinking partner.<br/>
                  Private. Fresh start every time.
                </p>
              </div>

              {/* Block 2: Support */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-destructive flex items-center gap-2">
                  <Phone size={16} />
                  Crisis Support
                </h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center border-b border-charcoal/10 pb-2">
                    <span className="text-sm font-medium">Mental Health (1737)</span>
                    <a href="tel:1737" className="text-xs bg-charcoal text-linen px-3 py-1 rounded-sm uppercase tracking-wider font-bold">Call</a>
                  </li>
                  <li className="flex justify-between items-center border-b border-charcoal/10 pb-2">
                    <span className="text-sm font-medium">Women's Refuge</span>
                    <a href="tel:0800733843" className="text-xs border border-charcoal text-charcoal px-3 py-1 rounded-sm uppercase tracking-wider font-bold hover:bg-charcoal hover:text-linen transition-colors">Call</a>
                  </li>
                  <li className="flex justify-between items-center border-b border-charcoal/10 pb-2">
                    <span className="text-sm font-medium">Emergency (111)</span>
                    <a href="tel:111" className="text-xs bg-destructive text-white px-3 py-1 rounded-sm uppercase tracking-wider font-bold">Call</a>
                  </li>
                </ul>
              </div>

              {/* Block 3: Research Info */}
              <div className="pt-8">
                <p className="label-sm mb-2">Researcher</p>
                <div className="bg-white/50 p-4 rounded-sm border border-charcoal/5">
                  <p className="text-sm font-bold text-charcoal">Lian Passmore</p>
                  <p className="text-xs text-warm-grey mt-1">lianpassmore@gmail.com</p>
                  <p className="text-xs text-warm-grey mt-1"><a href="tel:0275668803" className="hover:text-charcoal transition-colors">027 566 8803</a></p>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="mt-8 border-t border-charcoal/10 pt-6">
              <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold text-warm-grey hover:text-charcoal transition-colors uppercase tracking-widest"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}