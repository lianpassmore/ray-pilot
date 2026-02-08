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

  const handleGoogleLogin = async () => {
    setLoading(true)
    setMessage(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage('Failed to sign in with Google. Try again.')
      setLoading(false)
    }
  }

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

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (error) {
      setMessage('Invalid code. Please try again.')
      setLoading(false)
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.created_at) {
        const createdAt = new Date(user.created_at).getTime()
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (now - createdAt < fiveMinutes) {
          router.push('/setup-password')
          return
        }
      }
      router.push('/dashboard')
    }
  }

  return (
    <div className="page-container justify-center">
      
      <div className="w-full max-w-sm space-y-8 animate-[fadeIn_0.6s_ease-out]">
        
        {/* HEADER */}
        <div className="text-center space-y-2">
          <h2 className="heading-xl text-center">Nau mai.</h2>
          <p className="body-text text-warm-grey">
            {useOtp ? 'Create account or sign in with Ray.' : 'Sign in to connect with Ray.'}
          </p>
        </div>

        {!otpSent ? (
          <div className="space-y-6">
            
            {/* Google Sign-In */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className={loading ? "btn-disabled w-full" : "btn-secondary"}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Connecting...' : 'CONTINUE WITH GOOGLE'}
              </div>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-charcoal/10"></div>
              <span className="caption text-charcoal/40">Or</span>
              <div className="flex-1 h-px bg-charcoal/10"></div>
            </div>

            {!useOtp ? (
              // Password Login Form
              <form className="space-y-6" onSubmit={handlePasswordLogin}>
                <div className="space-y-4">
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
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={loading ? "btn-disabled w-full" : "btn-primary"}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            ) : (
              // OTP Login Form
              <form className="space-y-6" onSubmit={handleSendOtp}>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="Email address"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <p className="text-[12px] text-warm-grey leading-tight pl-1">
                    New users will be prompted to create a password after verifying their email.
                  </p>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className={loading ? "btn-disabled w-full" : "btn-primary"}
                >
                  {loading ? 'Sending code...' : 'Continue with Email'}
                </button>
              </form>
            )}

            {/* Toggle */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setUseOtp(!useOtp)
                  setMessage(null)
                }}
                className="text-sm font-medium text-warm-grey hover:text-charcoal underline underline-offset-4 transition-colors"
              >
                {useOtp ? 'Already have a password? Sign in here' : 'New user? Use email code'}
              </button>
            </div>
          </div>
        ) : (
          // OTP Verification Form
          <form className="space-y-6 animate-[fadeIn_0.4s_ease-out]" onSubmit={handleVerifyOtp}>
            <div className="text-sm text-warm-grey text-center mb-6">
              Code sent to <span className="font-bold text-charcoal">{email}</span>
            </div>
            
            <input
              type="text"
              placeholder="000000"
              className="input-field text-center text-3xl tracking-[0.5em] font-mono py-6"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={8}
            />
            
            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={loading ? "btn-disabled w-full" : "btn-primary"}
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
                className="w-full text-sm text-warm-grey hover:text-charcoal underline underline-offset-4"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        {/* MESSAGES */}
        {message && (
          <div className={`p-4 border rounded-sm text-sm font-medium text-center animate-[fadeIn_0.3s_ease-out] ${
            message.includes('Check your email')
              ? 'bg-forest-green/5 border-forest-green/20 text-forest-green'
              : 'bg-destructive/5 border-destructive/20 text-destructive'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  )
}