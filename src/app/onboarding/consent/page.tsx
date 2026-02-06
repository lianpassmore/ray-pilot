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
      <h1 className="text-2xl font-bold text-charcoal mb-6">Your participation matters</h1>

      <div className="bg-white border border-charcoal/10 rounded-[2px] p-6 h-96 overflow-y-auto mb-6 text-sm text-warm-grey space-y-4">
        <p><strong className="text-charcoal">The Project Rise Digital Survey is:</strong></p>
        <ul className="list-disc pl-4 space-y-2">
          <li><strong>Completely anonymous:</strong> Only a Session ID is allocated to you.</li>
          <li><strong>Optional:</strong> Most questions are optional (except consent). Share only what feels safe for you.</li>
          <li><strong>Transparent:</strong> If you choose to share your email to stay connected, your contact details are stored apart from your survey responses.</li>
          <li><strong>Focused on collective voices:</strong> Looking for community patterns, not individual tracking.</li>
          <li><strong>In Your Control:</strong> You can withdraw before survey closes on the 8th of October by emailing support@trurivu.com.</li>
          <li><strong>Age Restricted:</strong> For people aged 18 and above.</li>
        </ul>
        <p>What you share helps shape something that could genuinely serve our communities better.</p>
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
          I consent to participate in this research. I understand my participation is voluntary, my responses are anonymous, and I can withdraw at any time.
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