'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [useOtp, setUseOtp] = useState(true) // Default to OTP for new users
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage('Invalid email or password.')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
      },
    })

    if (error) {
      setMessage('Something went wrong. Try again.')
      setLoading(false)
    } else {
      setMessage('Check your email for your one-time code!')
      setOtpSent(true)
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      setMessage('Invalid code. Please try again.')
      setLoading(false)
    } else {
      // Check if this is a new user (first sign-in)
      const { data: { user } } = await supabase.auth.getUser()

      // If user was created recently (within last 5 minutes), they're new
      if (user?.created_at) {
        const createdAt = new Date(user.created_at).getTime()
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (now - createdAt < fiveMinutes) {
          // New user - redirect to password setup
          router.push('/setup-password')
          return
        }
      }

      // Existing user - go to dashboard
      router.push('/dashboard')
    }
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linen">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-charcoal">Nau mai.</h2>
          <p className="mt-2 text-warm-grey">
            {useOtp ? 'Create account or sign in with Ray.' : 'Sign in to connect with Ray.'}
          </p>
        </div>

        {!otpSent ? (
          <>
            {!useOtp ? (
              // Password Login Form
              <form className="space-y-6" onSubmit={handlePasswordLogin}>
                <input
                  type="email"
                  placeholder="Email address"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={loading ? "btn-disabled w-full" : "btn-primary w-full"}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              // OTP Login Form
              <form className="space-y-6" onSubmit={handleSendOtp}>
                <input
                  type="email"
                  placeholder="Email address"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className={loading ? "btn-disabled w-full" : "btn-primary w-full"}
                >
                  {loading ? 'Sending code...' : 'Continue with Email'}
                </button>
                <p className="text-xs text-warm-grey">
                  New users will be prompted to create a password after verifying their email.
                </p>
              </form>
            )}

            {/* Toggle between password and OTP */}
            <button
              type="button"
              onClick={() => {
                setUseOtp(!useOtp)
                setMessage(null)
              }}
              className="text-sm text-warm-grey hover:text-charcoal underline"
            >
              {useOtp ? 'Already have a password? Sign in here' : 'New user or forgot password? Use email code'}
            </button>
          </>
        ) : (
          // OTP Verification Form
          <form className="space-y-6" onSubmit={handleVerifyOtp}>
            <div className="text-sm text-warm-grey mb-4">
              Code sent to <span className="font-semibold text-charcoal">{email}</span>
            </div>
            <input
              type="text"
              placeholder="Enter your code"
              className="input-field text-center text-2xl tracking-widest"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={8}
            />
            <button
              type="submit"
              disabled={loading}
              className={loading ? "btn-disabled w-full" : "btn-primary w-full"}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpSent(false)
                setToken('')
                setMessage(null)
              }}
              className="text-sm text-warm-grey hover:text-charcoal underline"
            >
              Use a different email
            </button>
          </form>
        )}

        {message && (
          <div className={`p-4 border rounded-[2px] text-sm ${
            message.includes('Check your email')
              ? 'bg-forest-green/10 border-forest-green/30 text-forest-green'
              : 'bg-destructive/10 border-destructive/30 text-destructive'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}