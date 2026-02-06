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
    ageRange: '',
    location: '',
    gender: '',
    genderOther: '',
    ethnicity: [] as string[],
    identityFactors: [] as string[]
  })

  // Options
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
    if (!formData.displayName) return
    setLoading(true)

    try {
      const finalGender = formData.gender === 'Other' ? formData.genderOther : formData.gender

      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error } = await supabase.from('profiles').upsert({
          id: user.id,
          display_name: formData.displayName,
          age_range: formData.ageRange,
          location: formData.location,
          gender: finalGender,
          ethnicity: formData.ethnicity,
          identity_factors: formData.identityFactors,
          last_login: new Date().toISOString()
        })

        if (error) {
          console.error('Error saving profile:', error)
          alert(`Failed to save profile: ${error.message}\n\nDetails: ${error.details || 'No additional details'}`)
          setLoading(false)
          return
        }

        // Redirect to Dashboard
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-md mx-auto py-12 bg-linen">
      <h1 className="text-2xl font-bold text-charcoal mb-2">A little more about you</h1>
      <p className="text-warm-grey text-sm mb-8">These questions help me identify patterns across all participants for research purposes. Ray won't use this information in your conversations—each session starts fresh with no memory of you.</p>

      <div className="space-y-6">

        {/* Name */}
        <div>
          <label className="block text-charcoal text-sm font-medium mb-2">What should Ray call you?</label>
          <input
            type="text"
            className="input-field"
            placeholder="Your name"
            value={formData.displayName}
            onChange={e => setFormData({...formData, displayName: e.target.value})}
          />
        </div>

        {/* Age Range */}
        <div>
          <label className="block text-charcoal text-sm font-medium mb-2">
            Age Range <span className="text-warm-grey text-xs">(Optional)</span>
          </label>
          <select
            className="input-field"
            value={formData.ageRange}
            onChange={e => setFormData({...formData, ageRange: e.target.value})}
          >
            <option value="">Select age...</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55-64">55-64</option>
            <option value="65+">65+</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-charcoal text-sm font-medium mb-2">
            Where do you live? <span className="text-warm-grey text-xs">(Optional)</span>
          </label>
          <select
            className="input-field"
            value={formData.location}
            onChange={e => setFormData({...formData, location: e.target.value})}
          >
            <option value="">Select location...</option>
            <option value="Northland">Northland</option>
            <option value="Auckland">Auckland</option>
            <option value="Waikato">Waikato</option>
            <option value="Wellington">Wellington</option>
            <option value="Christchurch">Christchurch</option>
            <option value="Dunedin">Dunedin</option>
            <option value="Other NZ">Other NZ</option>
            <option value="International">International</option>
          </select>
        </div>

        {/* Ethnicity Multi-Select */}
        <div>
          <label className="block text-charcoal text-sm font-medium mb-2">Cultural Identity (Select all that apply)</label>
          <div className="space-y-2 max-h-48 overflow-y-auto bg-white p-4 rounded-[2px] border border-charcoal/10">
            {ethnicities.map(eth => (
              <label key={eth} className="flex items-center space-x-3 cursor-pointer hover:bg-linen/50 p-1 rounded-[2px] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.ethnicity.includes(eth)}
                  onChange={() => toggleSelection('ethnicity', eth)}
                  className="accent-forest-green w-4 h-4 rounded-[2px]"
                />
                <span className="text-sm text-charcoal">{eth}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Identity Factors */}
        <div>
          <label className="block text-charcoal text-sm font-medium mb-2">Identity Factors (Select all that apply)</label>
          <div className="space-y-2 bg-white p-4 rounded-[2px] border border-charcoal/10">
            {identityOptions.map(opt => (
              <label key={opt} className="flex items-center space-x-3 cursor-pointer hover:bg-linen/50 p-1 rounded-[2px] transition-colors">
                <input
                  type="checkbox"
                  checked={formData.identityFactors.includes(opt)}
                  onChange={() => toggleSelection('identityFactors', opt)}
                  className="accent-forest-green w-4 h-4 rounded-[2px]"
                />
                <span className="text-sm text-charcoal">{opt}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!formData.displayName || loading}
          className={(!formData.displayName || loading) ? 'btn-disabled w-full mt-8' : 'btn-primary w-full mt-8'}
        >
          {loading ? 'Saving...' : 'Meet Ray'}
        </button>

      </div>
    </div>
  )
}