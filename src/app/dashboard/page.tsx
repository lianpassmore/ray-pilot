'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Phone, LogOut, User, ClipboardList } from 'lucide-react'
import RayWidget from '@/components/RayWidget'
import FeedbackForm from '@/components/FeedbackForm'
import HeaderIcons from '@/components/HeaderIcons'
import MyContextForm from '@/components/MyContextForm'
import PilotUpdateBanner from '@/components/PilotUpdateBanner'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [progress, setProgress] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  const [showFeedback, setShowFeedback] = useState(false)
  const [showMyContext, setShowMyContext] = useState(false)
  const [currentConversationDbId, setCurrentConversationDbId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

      if (!data || !data.consent_agreed) { router.push('/onboarding/consent'); return }
      if (!data.display_name) { router.push('/onboarding/profile'); return }
      setProfile(data)
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
  }, [])

  useEffect(() => {
    const targetDate = new Date('2026-02-12T00:00:00+13:00').getTime()
    const endDate = new Date('2026-02-26T23:59:00+13:00').getTime()
    const timer = setInterval(() => {
      const now = new Date().getTime()
      if (now > endDate) { setTimeLeft('Pilot Closed'); setProgress(100); return }
      if (now > targetDate) {
        setTimeLeft('Pilot Active')
        const totalDuration = endDate - targetDate
        const elapsed = now - targetDate
        setProgress(Math.min(100, (elapsed / totalDuration) * 100))
        return
      }
      const distance = targetDate - now
      const days = Math.ceil(distance / (1000 * 60 * 60 * 24))
      setTimeLeft(`Starts in: ${days} days`)
      setProgress(0)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!profile) return null

  const firstName = profile.display_name.split(' ')[0];

  return (
    <div className="min-h-screen relative flex flex-col bg-linen selection:bg-clay selection:text-linen">

      {/* --- HEADER --- */}
      <header className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-20">
        <h1 className="text-2xl font-black tracking-[0.25em] text-charcoal">RAY</h1>
        <HeaderIcons onSettingsClick={() => setIsMenuOpen(true)} />
      </header>

      {/* --- MAIN STAGE --- */}
      <main className="flex-1 flex flex-col items-center justify-center relative z-10 w-full max-w-lg mx-auto px-6">

        {/* Greeting — Editorial Typography */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center mb-0"
        >
          <h2 className="text-3xl md:text-4xl tracking-tight text-charcoal">
            <span className="font-light">Kia ora,</span>{' '}
            <span className="font-bold">{firstName}.</span>
          </h2>
        </motion.div>

        {/* The Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="w-full flex justify-center"
        >
          <RayWidget
            userName={profile.display_name}
            userId={userId!}
            profile={profile}
            onSessionEnd={handleSessionEnd}
          />
        </motion.div>

      </main>

      {/* --- FOOTER --- */}
      <div className="absolute bottom-6 w-full text-center pb-safe pointer-events-none">
        {timeLeft && (
          <p className="text-[10px] text-warm-grey uppercase tracking-widest font-bold opacity-40 mb-1">
            {timeLeft}
          </p>
        )}
        <p className="text-[10px] text-warm-grey uppercase tracking-widest font-medium opacity-40">
          Conversations are private &amp; encrypted
        </p>
      </div>

      {/* --- PILOT UPDATES BANNER --- */}
      <PilotUpdateBanner />

      {/* --- FEEDBACK FORM --- */}
      <AnimatePresence>
        {showFeedback && currentConversationDbId && userId && (
          <FeedbackForm
            conversationDbId={currentConversationDbId}
            userId={userId}
            onComplete={handleFeedbackComplete}
          />
        )}
      </AnimatePresence>

      {/* --- MY CONTEXT FORM --- */}
      <AnimatePresence>
        {showMyContext && userId && (
          <MyContextForm
            userId={userId}
            onClose={() => {
              setShowMyContext(false)
              // Refresh profile to pick up changes for next session
              supabase.from('profiles').select('*').eq('id', userId).single().then(({ data }) => {
                if (data) setProfile(data)
              })
            }}
          />
        )}
      </AnimatePresence>

      {/* --- SLIDE-OUT MENU --- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-charcoal/20 backdrop-blur-[2px] transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="relative w-full max-w-xs h-full bg-linen/95 backdrop-blur-xl px-6 py-8 flex flex-col shadow-2xl animate-[slideIn_0.3s_ease-out] border-l border-charcoal/5 overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-warm-grey">Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="text-charcoal hover:text-clay transition-colors">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="space-y-10 flex-1 overflow-y-auto no-scrollbar">
              <button
                onClick={() => { setIsMenuOpen(false); setShowMyContext(true) }}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-white/50 border border-charcoal/10 hover:border-charcoal/20 transition-all text-left group"
              >
                <User size={16} strokeWidth={1.5} className="text-clay shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal">Help Ray know you</p>
                  <p className="text-[11px] text-warm-grey mt-0.5">Share context so Ray can get into it faster</p>
                </div>
              </button>

              <button
                onClick={() => { setIsMenuOpen(false); router.push('/final-review') }}
                className="w-full flex items-center gap-3 p-3 rounded-sm bg-clay/5 border border-clay/20 hover:border-clay/40 transition-all text-left group"
              >
                <ClipboardList size={16} strokeWidth={1.5} className="text-clay shrink-0" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-charcoal">Final Review</p>
                  <p className="text-[11px] text-warm-grey mt-0.5">Complete your final feedback to receive your koha</p>
                </div>
              </button>

              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-charcoal">
                  About Ray
                </h3>
                <p className="text-sm text-charcoal/80 leading-relaxed">
                  I'm a thinking partner. Not a therapist. Not a cheerleader. Conversations start fresh every time.
                </p>
                <a href="https://ray-research-info.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold underline text-clay">Read More</a>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-destructive uppercase tracking-wider flex items-center gap-2">
                  <Phone size={14} /> Crisis Support
                </h3>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center gap-3 text-sm border-b border-charcoal/5 pb-2">
                    <span className="truncate">1737 (Mental Health)</span>
                    <a href="tel:1737" className="shrink-0 text-xs font-bold uppercase tracking-wider bg-charcoal text-linen px-3 py-1 rounded-sm hover:bg-clay transition-colors">Call</a>
                  </li>
                  <li className="flex justify-between items-center gap-3 text-sm border-b border-charcoal/5 pb-2">
                    <span className="truncate">Women's Refuge</span>
                    <a href="tel:0800733843" className="shrink-0 text-xs font-bold uppercase tracking-wider border border-charcoal text-charcoal px-3 py-1 rounded-sm hover:bg-charcoal hover:text-linen transition-colors">Call</a>
                  </li>
                  <li className="flex justify-between items-center gap-3 text-sm border-b border-charcoal/5 pb-2">
                    <span className="truncate">Emergency (111)</span>
                    <a href="tel:111" className="shrink-0 text-xs font-bold uppercase tracking-wider bg-destructive text-white px-3 py-1 rounded-sm hover:bg-destructive/80 transition-colors">Call</a>
                  </li>
                </ul>
              </div>

              <div className="bg-white/50 p-4 rounded-sm border border-charcoal/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-warm-grey mb-2">Researcher</p>
                <p className="text-sm font-bold text-charcoal">Lian Passmore</p>
                <p className="text-xs text-warm-grey mt-1">lianpassmore@gmail.com</p>
                <p className="text-xs text-warm-grey mt-1"><a href="tel:0275668803" className="hover:text-charcoal transition-colors">027 566 8803</a></p>
              </div>
            </div>

            <button onClick={handleSignOut} className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-warm-grey hover:text-charcoal uppercase tracking-widest transition-colors py-4 border-t border-charcoal/10">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
