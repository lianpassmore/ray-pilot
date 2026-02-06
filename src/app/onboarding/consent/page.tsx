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
    <div className="min-h-screen p-6 max-w-md mx-auto flex flex-col justify-center bg-linen">
      <h1 className="text-2xl font-bold text-charcoal mb-6">Kia ora, welcome to Ray</h1>

      <div className="bg-white border border-charcoal/10 rounded-[2px] p-6 h-96 overflow-y-auto mb-6 text-sm text-warm-grey space-y-4">
        <p className="text-charcoal"><strong>What you're joining:</strong></p>
        <p>Ray is an AI relationship coach designed to help you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself.</p>

        <p className="text-charcoal"><strong>What I'm asking you to do:</strong></p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Try Ray between February 12–26, 2026 (use it whenever suits you)</li>
          <li>After each session: Ray asks for quick feedback (~3 minutes)</li>
          <li>At the end: A 15-minute reflection with Ray about your overall experience</li>
        </ul>

        <p className="text-charcoal"><strong>Your privacy matters:</strong></p>
        <ul className="list-disc pl-4 space-y-2">
          <li><strong>Your conversations stay private:</strong> I may identify broad themes across all participants, but your specific conversations remain private. I'm the only person with access to transcripts.</li>
          <li><strong>You're in control:</strong> Delete individual sessions or your entire account anytime during the pilot</li>
          <li><strong>Withdraw anytime:</strong> You can withdraw from the research completely before March 1, 2026</li>
          <li><strong>Data is anonymised:</strong> Participant codes only, no names</li>
          <li><strong>Everything is deleted:</strong> 2 years after the project ends</li>
        </ul>

        <p className="text-charcoal"><strong>Important:</strong></p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Ray is coaching, not therapy or mental health treatment</li>
          <li>Ray is not crisis intervention</li>
          <li>Sessions are capped at 1 hour</li>
          <li>Each session starts fresh—Ray has no memory of previous conversations</li>
        </ul>

        <p className="text-charcoal">Your feedback will help shape whether ethical AI can work in vulnerable conversations.</p>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <input
          type="checkbox"
          id="consent"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-1 w-5 h-5 accent-forest-green rounded-[2px]"
        />
        <label htmlFor="consent" className="text-sm text-charcoal">
          I consent to participate in this pilot. I understand my participation is voluntary, my conversations remain private, and I can withdraw at any time before March 1, 2026.
        </label>
      </div>

      <button
        onClick={handleContinue}
        disabled={!agreed}
        className={!agreed ? 'btn-disabled w-full' : 'btn-primary w-full'}
      >
        Continue
      </button>
    </div>
  )
}