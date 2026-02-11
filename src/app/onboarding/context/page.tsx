'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ContextPage() {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    relationship_status: '',
    partner_name: '',
    children_info: '',
    occupation: '',
    living_situation: '',
    additional_context: '',
  })

  const showPartnerName = formData.relationship_status && formData.relationship_status !== 'Single'

  const handleSubmit = async () => {
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          relationship_status: formData.relationship_status || null,
          partner_name: formData.partner_name || null,
          children_info: formData.children_info || null,
          occupation: formData.occupation || null,
          living_situation: formData.living_situation || null,
          additional_context: formData.additional_context || null,
          onboarding_context_completed: true,
        })
        .eq('id', user.id)

      router.push('/dashboard')
    }

    setSaving(false)
  }

  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({ onboarding_context_completed: true })
        .eq('id', user.id)
    }
    router.push('/dashboard')
  }

  return (
    <div className="page-container justify-center">

      {/* HEADER */}
      <div className="mb-10 animate-[fadeIn_0.6s_ease-out]">
        <p className="label-sm mb-2 text-forest">Almost there</p>
        <h1 className="heading-xl">Help Ray know you.</h1>
        <p className="body-text mt-4 text-warm-grey">
          This context is shared with Ray at the start of each session. You can update it anytime from the menu.
        </p>
      </div>

      <div className="space-y-6 animate-[fadeIn_0.8s_ease-out_0.2s_both]">

        <div>
          <label className="label-sm mb-2 block">Relationship status</label>
          <select
            className="input-field appearance-none"
            value={formData.relationship_status}
            onChange={e => setFormData({ ...formData, relationship_status: e.target.value })}
          >
            <option value="">Not specified</option>
            <option value="Single">Single</option>
            <option value="In a relationship">In a relationship</option>
            <option value="Married">Married</option>
            <option value="Engaged">Engaged</option>
            <option value="Separated">Separated</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
            <option value="It's complicated">It&apos;s complicated</option>
          </select>
        </div>

        {showPartnerName && (
          <div>
            <label className="label-sm mb-2 block">Partner&apos;s name</label>
            <input
              type="text"
              className="input-field"
              placeholder="So Ray can reference them naturally"
              value={formData.partner_name}
              onChange={e => setFormData({ ...formData, partner_name: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="label-sm mb-2 block">Children</label>
          <input
            type="text"
            className="input-field"
            placeholder='e.g. "Two kids, ages 4 and 7"'
            value={formData.children_info}
            onChange={e => setFormData({ ...formData, children_info: e.target.value })}
          />
        </div>

        <div>
          <label className="label-sm mb-2 block">What do you do?</label>
          <input
            type="text"
            className="input-field"
            placeholder="Job, study, or day-to-day"
            value={formData.occupation}
            onChange={e => setFormData({ ...formData, occupation: e.target.value })}
          />
        </div>

        <div>
          <label className="label-sm mb-2 block">Living situation</label>
          <input
            type="text"
            className="input-field"
            placeholder='e.g. "Live with partner in Auckland"'
            value={formData.living_situation}
            onChange={e => setFormData({ ...formData, living_situation: e.target.value })}
          />
        </div>

        <div>
          <label className="label-sm mb-2 block">Anything else for Ray?</label>
          <textarea
            className="input-field min-h-[80px] resize-none"
            placeholder="Anything that would help Ray understand your world faster"
            value={formData.additional_context}
            onChange={e => setFormData({ ...formData, additional_context: e.target.value })}
            maxLength={500}
          />
          <p className="text-[10px] text-warm-grey/60 mt-1 text-right">{formData.additional_context.length}/500</p>
        </div>

        {/* ACTIONS */}
        <div className="pt-8 pb-12 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className={saving ? 'btn-disabled w-full' : 'btn-primary'}
          >
            {saving ? 'Saving...' : 'Meet Ray'}
          </button>
          <button
            onClick={handleSkip}
            className="btn-secondary"
          >
            Skip for now
          </button>
        </div>

      </div>
    </div>
  )
}
