'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // We redirect to the callback route we just made
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage('Something went wrong. Try again.')
    } else {
      setMessage('Check your email for the login link!')
    }
    setLoading(false)
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linen">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-charcoal">Nau mai.</h2>
          <p className="mt-2 text-warm-grey">Sign in to connect with Ray.</p>
        </div>

        {/* Google Button */}
        <button
          onClick={handleGoogleLogin}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-charcoal/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-linen text-warm-grey">Or with email</span>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
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
            {loading ? 'Sending link...' : 'Send Magic Link'}
          </button>
        </form>

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