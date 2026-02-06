'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SetupPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      setLoading(false)
      return
    }

    // Update user password
    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    if (error) {
      setMessage('Failed to set password. Please try again.')
      setLoading(false)
    } else {
      // Redirect to onboarding or dashboard
      router.push('/onboarding/profile')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linen">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-charcoal">Set Your Password</h2>
          <p className="mt-2 text-warm-grey">
            Create a password to secure your account. You can always use a one-time code if you forget it.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSetupPassword}>
          <input
            type="password"
            placeholder="Password (min. 8 characters)"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
          <input
            type="password"
            placeholder="Confirm password"
            className="input-field"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
          <button
            type="submit"
            disabled={loading}
            className={loading ? "btn-disabled w-full" : "btn-primary w-full"}
          >
            {loading ? 'Setting password...' : 'Continue'}
          </button>
        </form>

        {message && (
          <div className="p-4 border rounded-[2px] text-sm bg-destructive/10 border-destructive/30 text-destructive">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
