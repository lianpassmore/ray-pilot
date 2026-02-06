'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { X, Info, Phone, LogOut } from 'lucide-react'
import RayWidget from '@/components/RayWidget'
import TimeMeter from '@/components/TimeMeter'
import HeaderIcons from '@/components/HeaderIcons'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')
  const [progress, setProgress] = useState(0)
  const supabase = createClient()
  const router = useRouter()

  // 1. Fetch Profile on Load
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
    }
    getProfile()
  }, [])

  // 2. Countdown Logic (Feb 12 NZT) + Progress Meter
  useEffect(() => {
    const targetDate = new Date('2026-02-12T09:00:00+13:00').getTime() // Feb 12, 9AM NZT
    const endDate = new Date('2026-02-26T23:59:00+13:00').getTime()   // Feb 26, Midnight NZT

    const timer = setInterval(() => {
      const now = new Date().getTime()

      if (now > endDate) {
        setTimeLeft('Pilot Closed')
        setProgress(100)
        return
      }

      if (now > targetDate) {
        setTimeLeft('Pilot Active')
        // Calculate progress through pilot period
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
    <div className="min-h-screen bg-linen relative overflow-hidden flex flex-col">

      {/* HEADER */}
      <header className="p-6 flex justify-between items-center z-20 border-b border-charcoal/10">
        <div className="flex items-center gap-4">
          <h1 className="brand-title text-charcoal">RAY</h1>
          <TimeMeter progress={progress} />
        </div>
        <div className="flex items-center gap-2">
          <HeaderIcons
            onSettingsClick={() => setIsMenuOpen(true)}
          />
        </div>
      </header>

      {/* User Greeting */}
      <div className="px-6 pt-4 text-center">
        <p className="text-sm text-warm-grey">
          Kia ora, <span className="font-medium text-charcoal">{profile.display_name.split(' ')[0]}</span>
        </p>
        <p className="text-xs text-clay font-medium tracking-wide mt-1 uppercase">
          {timeLeft}
        </p>
      </div>

      {/* MAIN CONTENT - RAY WIDGET */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <RayWidget userName={profile.display_name} />
      </main>

      {/* FOOTER CRISIS LINE (Always Visible) */}
      <div className="p-4 bg-charcoal/5 border-t border-charcoal/10 text-center">
        <p className="text-xs text-warm-grey mb-1">Need immediate support?</p>
        <a href="tel:1737" className="text-sm font-bold text-clay hover:text-clay/80 transition-colors">
          Call or Text 1737 (24/7)
        </a>
      </div>

      {/* SLIDE-OUT MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Drawer */}
          <div className="relative w-80 bg-linen h-full shadow-2xl p-6 flex flex-col border-l border-charcoal/10">
            <div className="flex justify-end mb-8">
              <button onClick={() => setIsMenuOpen(false)} className="text-charcoal hover:text-clay transition-colors">
                <X size={28} />
              </button>
            </div>

            <div className="space-y-8 flex-1 overflow-y-auto">
              {/* Section 1: About */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-clay">
                  <Info size={20} />
                  <span className="font-bold uppercase text-sm tracking-widest">About Ray</span>
                </div>
                <p className="text-sm text-warm-grey leading-relaxed">
                  Ray is an AI relationship coach—like a thinking partner helping you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself.
                </p>
                <p className="text-sm text-warm-grey leading-relaxed">
                  Your conversations are private. Each session starts fresh—Ray has no memory of previous sessions.
                </p>
                <p className="text-sm text-warm-grey leading-relaxed">
                  Ray is coaching, not therapy. Ray can't treat mental health conditions or provide crisis intervention.
                </p>
              </div>

              {/* Section 2: Crisis Resources */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-destructive">
                  <Phone size={20} />
                  <span className="font-bold uppercase text-sm tracking-widest">Support</span>
                </div>
                <ul className="text-sm text-warm-grey space-y-3">
                  <li className="flex justify-between">
                    <span>Mental Health (1737)</span>
                    <a href="tel:1737" className="text-clay hover:text-clay/80 underline">Call</a>
                  </li>
                  <li className="flex justify-between">
                    <span>Lifeline</span>
                    <a href="tel:0800543354" className="text-clay hover:text-clay/80 underline">0800 543 354</a>
                  </li>
                  <li className="flex justify-between">
                    <span>Women's Refuge</span>
                    <a href="tel:0800733843" className="text-clay hover:text-clay/80 underline">0800 733 843</a>
                  </li>
                  <li className="flex justify-between">
                    <span>Emergency</span>
                    <a href="tel:111" className="text-clay hover:text-clay/80 underline">111</a>
                  </li>
                </ul>
              </div>

              {/* Section 3: Researcher */}
              <div className="pt-8 border-t border-charcoal/10">
                <p className="text-xs text-warm-grey mb-2 uppercase tracking-wide">Researcher Contact</p>
                <p className="text-sm text-charcoal font-medium">Lian Passmore</p>
                <p className="text-sm text-warm-grey">lianpassmore@gmail.com</p>
                <p className="text-sm text-warm-grey">027 566 8803</p>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="mt-auto flex items-center gap-3 text-destructive hover:text-destructive/80 transition-colors font-medium"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}