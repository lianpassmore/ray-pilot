'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    ageRange: '',
    location: '',
    gender: '',
    genderOther: '',
    ethnicity: [] as string[],
    identityFactors: [] as string[]
  })

  const ethnicities = [
    'European / Pākehā', 'Māori', 'Indian', 'Chinese', 'Filipino', 
    'Samoan', 'Tongan', 'Cook Islands Māori', 'Niuean', 'Fijian', 
    'Sri Lankan', 'MELAA', 'British', 'Irish', 'South African', 
    'Korean', 'Bangladesh', 'Japanese', 'Dutch', 'Australian', 
    'Other Asian', 'Other European', 'Other Pacific Peoples', 'Prefer not to say'
  ]

  const identityOptions = [
    'Digitally Excluded',
    'Disabled/Tāngata Whaikaha',
    'Neurodivergent/Kanorau ā-roro',
    'None of these apply',
    'Other'
  ]

  const toggleSelection = (field: 'ethnicity' | 'identityFactors', value: string) => {
    setFormData(prev => {
      const current = prev[field]
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value]
      return { ...prev, [field]: updated }
    })
  }

  const handleSubmit = async () => {
    if (!formData.displayName || !formData.phone) return
    setLoading(true)

    try {
      const finalGender = formData.gender === 'Other' ? formData.genderOther : formData.gender
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          display_name: formData.displayName,
          phone: formData.phone,
          age_range: formData.ageRange,
          location: formData.location,
          gender: finalGender,
          ethnicity: formData.ethnicity,
          identity_factors: formData.identityFactors,
          last_login: new Date().toISOString()
        })

        if (error) {
          alert(`Failed to save profile: ${error.message}`)
          setLoading(false)
          return
        }
        router.push('/dashboard')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="page-container justify-center">
      
      {/* HEADER */}
      <div className="mb-10 animate-[fadeIn_0.6s_ease-out]">
        <h1 className="heading-xl">About you.</h1>
        <p className="body-text mt-4 text-warm-grey">
          This data is for research analysis only. Only your name is shared with Ray.
        </p>
      </div>

      <div className="space-y-8 animate-[fadeIn_0.8s_ease-out_0.2s_both]">

        {/* SECTION 1: BASICS */}
        <section className="space-y-6">
          <div>
            <label className="label-sm mb-2 block">What should Ray call you?</label>
            <input
              type="text"
              className="input-field"
              placeholder="Name"
              value={formData.displayName}
              onChange={e => setFormData({...formData, displayName: e.target.value})}
            />
          </div>

          <div>
            <label className="label-sm mb-2 block">Phone</label>
            <input
              type="tel"
              className="input-field"
              placeholder="For researcher contact only"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
        </section>

        <hr className="border-charcoal/10" />

        {/* SECTION 2: DEMOGRAPHICS */}
        <section className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-sm mb-2 block">Age Range</label>
            <select
              className="input-field appearance-none"
              value={formData.ageRange}
              onChange={e => setFormData({...formData, ageRange: e.target.value})}
            >
              <option value="">Select...</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65+">65+</option>
            </select>
          </div>

          <div>
            <label className="label-sm mb-2 block">Location</label>
            <select
              className="input-field appearance-none"
              value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
            >
              <option value="">Select...</option>
              <option value="Northland">Northland</option>
              <option value="Auckland">Auckland</option>
              <option value="Wellington">Wellington</option>
              <option value="Christchurch">Christchurch</option>
              <option value="Other NZ">Other NZ</option>
              <option value="International">International</option>
            </select>
          </div>

          <div>
            <label className="label-sm mb-2 block">Gender</label>
            <select
              className="input-field appearance-none"
              value={formData.gender}
              onChange={e => setFormData({...formData, gender: e.target.value})}
            >
              <option value="">Select...</option>
              <option value="Woman">Woman</option>
              <option value="Man">Man</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Gender diverse">Gender diverse</option>
              <option value="Prefer not to say">Prefer not to say</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.gender === 'Other' && (
            <div>
              <label className="label-sm mb-2 block">Please specify</label>
              <input
                type="text"
                className="input-field"
                placeholder="Gender identity"
                value={formData.genderOther}
                onChange={e => setFormData({...formData, genderOther: e.target.value})}
              />
            </div>
          )}
        </section>

        {/* SECTION 3: IDENTITY (Custom Checkboxes) */}
        <section>
          <label className="label-sm mb-3 block">Cultural Identity</label>
          <div className="bg-white/50 border border-charcoal/10 rounded-sm p-4 h-48 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              {ethnicities.map(eth => (
                <label key={eth} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.ethnicity.includes(eth)}
                      onChange={() => toggleSelection('ethnicity', eth)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border border-charcoal/30 rounded-[2px] peer-checked:bg-forest-green peer-checked:border-forest-green transition-all"></div>
                    <svg className="absolute w-3 h-3 text-linen opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm text-charcoal/80 group-hover:text-charcoal transition-colors">{eth}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section>
          <label className="label-sm mb-3 block">Identity Factors</label>
          <div className="bg-white/50 border border-charcoal/10 rounded-sm p-4">
            <div className="space-y-3">
              {identityOptions.map(opt => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.identityFactors.includes(opt)}
                      onChange={() => toggleSelection('identityFactors', opt)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 border border-charcoal/30 rounded-[2px] peer-checked:bg-forest-green peer-checked:border-forest-green transition-all"></div>
                    <svg className="absolute w-3 h-3 text-linen opacity-0 peer-checked:opacity-100 left-1 top-1 transition-opacity pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <span className="text-sm text-charcoal/80 group-hover:text-charcoal transition-colors">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </section>

        {/* SUBMIT */}
        <div className="pt-8 pb-12">
          <button
            onClick={handleSubmit}
            disabled={!formData.displayName || !formData.phone || loading}
            className={(!formData.displayName || !formData.phone || loading) ? 'btn-disabled w-full' : 'btn-primary'}
          >
            {loading ? 'Saving...' : 'Meet Ray'}
          </button>
        </div>

      </div>
    </div>
  )
}