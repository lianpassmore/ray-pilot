'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ConsentPage() {
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleContinue = async () => {
    if (!agreed) return

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Update DB to mark consent as true
      await supabase.from('profiles').upsert({
        id: user.id,
        consent_agreed: true,
        consent_date: new Date().toISOString(),
        email: user.email
      })
      router.push('/onboarding/profile')
    }
  }

  return (
    <div className="page-container max-w-lg">
      
      {/* HEADER */}
      <div className="mb-8 animate-[fadeIn_0.6s_ease-out]">
        <p className="label-sm mb-2 text-forest">Research Pilot</p>
        <h1 className="heading-xl">Kia ora.</h1>
        <p className="body-text mt-4 text-warm-grey">
          Before we begin, we need to agree on how this works.
        </p>
      </div>

      {/* THE MANIFESTO (Scrollable Area) */}
      <div className="border-t-2 border-b-2 border-charcoal/10 py-6 mb-8 h-96 overflow-y-auto no-scrollbar animate-[fadeIn_0.8s_ease-out_0.2s_both]">
        <div className="space-y-8 pr-2">
          
          <section>
            <h3 className="font-bold text-charcoal uppercase tracking-wider text-sm mb-3">What you're joining</h3>
            <p className="body-text text-sm">
              I'm an AI relationship coach designed to help you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself.
            </p>
          </section>

          <section>
            <h3 className="font-bold text-charcoal uppercase tracking-wider text-sm mb-3">The Ask</h3>
            <ul className="space-y-3 text-sm text-charcoal/80 list-disc pl-4 marker:text-clay">
              <li>Try Ray between <span className="font-bold text-charcoal">Feb 12–26, 2026</span>.</li>
              <li>After each session: Ray asks for quick feedback (~3 minutes).</li>
              <li>At the end: A 15-minute reflection with Ray about your overall experience.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-charcoal uppercase tracking-wider text-sm mb-3">Privacy & Data</h3>
            <ul className="space-y-3 text-sm text-charcoal/80 list-disc pl-4 marker:text-clay">
              <li><strong>Conversations stay private:</strong> I analyze broad themes, but I do not read your specific transcripts unless you flag an issue.</li>
              <li><strong>Control:</strong> You can delete individual sessions or your entire account anytime.</li>
              <li><strong>Withdrawal:</strong> You can withdraw completely before March 1, 2026.</li>
              <li><strong>Anonymity:</strong> Data is stored with participant codes, not names.</li>
              <li><strong>Deletion:</strong> All data is destroyed 2 years after the project ends.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-charcoal uppercase tracking-wider text-sm mb-3">Important Limits</h3>
            <div className="bg-charcoal/5 p-4 rounded-sm border-l-4 border-forest">
              <ul className="space-y-2 text-sm text-charcoal font-medium">
                <li>• I'm coaching, not therapy.</li>
                <li>• I'm not crisis intervention.</li>
                <li>• Sessions are capped at 1 hour.</li>
                <li>• I have no memory of previous sessions (Fresh start every time).</li>
              </ul>
            </div>
          </section>

          <p className="text-sm italic text-warm-grey pt-4">
            "Your feedback will help shape whether ethical AI can work in vulnerable conversations."
          </p>

        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="space-y-6 animate-[fadeIn_1s_ease-out_0.4s_both]">
        <label className="flex items-start gap-4 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-6 h-6 border-2 border-charcoal/30 rounded-[2px] peer-checked:bg-forest-green peer-checked:border-forest-green transition-all group-hover:border-charcoal"></div>
            <svg 
              className="absolute w-4 h-4 text-linen opacity-0 peer-checked:opacity-100 left-1 top-1 pointer-events-none transition-opacity" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="text-sm text-charcoal/80 leading-relaxed select-none">
            I consent to participate. I understand my participation is voluntary, private, and I can withdraw anytime.
          </span>
        </label>

        <button
          onClick={handleContinue}
          disabled={!agreed}
          className={!agreed ? 'btn-disabled w-full' : 'btn-primary'}
        >
          Begin
        </button>
      </div>

    </div>
  )
}