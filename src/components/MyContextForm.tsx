'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'

interface MyContextFormProps {
  userId: string
  onClose: () => void
}

export default function MyContextForm({ userId, onClose }: MyContextFormProps) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    relationship_status: '',
    partner_name: '',
    children_info: '',
    occupation: '',
    living_situation: '',
    additional_context: '',
  })

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('profiles')
        .select('relationship_status, partner_name, children_info, occupation, living_situation, additional_context')
        .eq('id', userId)
        .single()
      if (data) {
        setFormData({
          relationship_status: data.relationship_status || '',
          partner_name: data.partner_name || '',
          children_info: data.children_info || '',
          occupation: data.occupation || '',
          living_situation: data.living_situation || '',
          additional_context: data.additional_context || '',
        })
      }
    }
    load()
  }, [userId])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        relationship_status: formData.relationship_status || null,
        partner_name: formData.partner_name || null,
        children_info: formData.children_info || null,
        occupation: formData.occupation || null,
        living_situation: formData.living_situation || null,
        additional_context: formData.additional_context || null,
      })
      .eq('id', userId)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => onClose(), 800)
    }
  }

  const showPartnerName = formData.relationship_status && formData.relationship_status !== 'Single'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div className="absolute inset-0 bg-charcoal/20 backdrop-blur-[2px]" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="relative w-full max-w-sm mx-4 max-h-[85vh] bg-linen border border-charcoal/10 rounded-sm shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-charcoal/10 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-charcoal">Help Ray know you</h2>
            <p className="text-[11px] text-warm-grey mt-1">This context is shared with Ray at the start of each session.</p>
          </div>
          <button onClick={onClose} className="text-charcoal/50 hover:text-charcoal transition-colors">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

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
              <option value="It's complicated">It's complicated</option>
            </select>
          </div>

          {showPartnerName && (
            <div>
              <label className="label-sm mb-2 block">Partner's name</label>
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

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-charcoal/10 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={saved ? 'btn-primary flex items-center justify-center gap-2 !bg-forest-green' : 'btn-primary'}
          >
            {saved ? <><Check size={16} /> Saved</> : saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
