'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [useOtp, setUseOtp] = useState(true)
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // --- LOGIC ---

  const redirectAfterLogin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/dashboard'); return }
    const { data: profile } = await supabase.from('profiles').select('display_name, consent_agreed, phone').eq('id', user.id).single()
    if (!profile || !profile.consent_agreed) router.push('/onboarding/consent')
    else if (!profile.display_name) router.push('/onboarding/profile')
    else router.push('/dashboard')
  }

  const handleGoogleLogin = async () => {
    setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback` } })
    if (error) { setMessage('Failed to connect. Try again.'); setLoading(false) }
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage('Invalid email or password.'); setLoading(false) } else await redirectAfterLogin()
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
    if (error) { setMessage('Something went wrong.'); setLoading(false) } else { setMessage('Check your email for the code!'); setOtpSent(true); setLoading(false) }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage(null)
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    if (error) { setMessage('Invalid code.'); setLoading(false) } else await redirectAfterLogin()
  }

  // --- RENDER ---

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-linen relative p-6 pb-safe">
      
      {/* Back Button */}
      <Link href="/" className="absolute top-8 left-8 text-charcoal/40 hover:text-charcoal transition-colors p-2">
        <ArrowLeft size={24} strokeWidth={1.5} />
      </Link>

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10 animate-[fadeIn_0.6s_ease-out]">
        
        {/* Header */}
        <div className="mb-10 text-center space-y-2">
            <h1 className="text-4xl font-black tracking-tighter text-charcoal">
              Nau mai.
            </h1>
            <p className="text-sm font-medium text-warm-grey">
                {otpSent ? 'Enter the code from your email.' : 'Sign in to connect with Ray.'}
            </p>
        </div>

        {/* Glass Card */}
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl rounded-sm p-6 sm:p-8 md:p-10">
            
            {!otpSent ? (
            <div className="space-y-8">
                
                {/* Google Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full bg-white hover:bg-white/80 text-charcoal font-bold text-xs uppercase tracking-widest py-4 px-4 rounded-sm border border-charcoal/5 shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-charcoal/10"></div>
                    <span className="flex-shrink mx-4 text-[10px] text-charcoal/40 uppercase tracking-widest font-bold">Or</span>
                    <div className="flex-grow border-t border-charcoal/10"></div>
                </div>

                {/* Forms */}
                {!useOtp ? (
                    <form className="space-y-4" onSubmit={handlePasswordLogin}>
                        <div className="space-y-3">
                          <input
                              type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-white/50 border border-charcoal/10 focus:border-charcoal/30 focus:bg-white rounded-sm px-4 py-3 text-charcoal placeholder:text-charcoal/30 outline-none transition-all text-sm"
                          />
                          <input
                              type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)}
                              className="w-full bg-white/50 border border-charcoal/10 focus:border-charcoal/30 focus:bg-white rounded-sm px-4 py-3 text-charcoal placeholder:text-charcoal/30 outline-none transition-all text-sm"
                          />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-charcoal text-linen font-bold uppercase tracking-widest text-xs py-4 rounded-sm hover:bg-clay transition-colors shadow-lg shadow-charcoal/10 disabled:opacity-50">
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleSendOtp}>
                        <input
                            type="email" placeholder="name@example.com" required value={email} onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/50 border border-charcoal/10 focus:border-charcoal/30 focus:bg-white rounded-sm px-4 py-3 text-charcoal placeholder:text-charcoal/30 outline-none transition-all text-sm"
                        />
                        <button type="submit" disabled={loading} className="w-full bg-charcoal text-linen font-bold uppercase tracking-widest text-xs py-4 rounded-sm hover:bg-clay transition-colors shadow-lg shadow-charcoal/10 disabled:opacity-50">
                            {loading ? 'Sending Code...' : 'Continue with Email'}
                        </button>
                    </form>
                )}

                {/* Toggle Link */}
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => { setUseOtp(!useOtp); setMessage(null) }}
                        className="text-xs font-bold text-warm-grey hover:text-clay transition-colors uppercase tracking-wider underline underline-offset-4"
                    >
                        {useOtp ? 'Have a password?' : 'Need a code?'}
                    </button>
                </div>
            </div>
            ) : (
            // OTP Form
            <form className="space-y-8" onSubmit={handleVerifyOtp}>
                <div className="text-center space-y-1">
                     <p className="text-xs text-warm-grey uppercase tracking-wider">Code sent to</p>
                     <p className="font-bold text-charcoal">{email}</p>
                </div>
                
                <input
                    type="text" placeholder="000000" required value={token} onChange={(e) => setToken(e.target.value)}
                    className="w-full bg-transparent border-b-2 border-charcoal/20 focus:border-charcoal text-center text-4xl font-mono tracking-[0.3em] py-4 text-charcoal placeholder:text-charcoal/5 outline-none transition-all"
                    autoComplete="one-time-code" inputMode="numeric" maxLength={8} autoFocus
                />
                
                <div className="space-y-4">
                    <button type="submit" disabled={loading} className="w-full bg-charcoal text-linen font-bold uppercase tracking-widest text-xs py-4 rounded-sm hover:bg-clay transition-colors shadow-lg shadow-charcoal/10 disabled:opacity-50">
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                    <button type="button" onClick={() => { setOtpSent(false); setToken(''); setMessage(null) }} className="w-full text-xs text-warm-grey hover:text-charcoal uppercase tracking-wider">
                        Use different email
                    </button>
                </div>
            </form>
            )}

            {/* Error/Success Messages */}
            {message && (
            <div className={`mt-6 p-4 rounded-sm text-xs font-bold text-center border animate-[fadeIn_0.3s_ease-out] ${
                message.includes('Check') ? 'bg-forest/10 border-forest/20 text-forest' : 'bg-destructive/10 border-destructive/20 text-destructive'
            }`}>
                {message}
            </div>
            )}
        </div>
        
        {/* Footer info */}
        <div className="mt-12 text-center opacity-40">
            <p className="text-[10px] text-warm-grey uppercase tracking-widest font-bold">
                Research Pilot • 2026
            </p>
        </div>

      </div>
    </div>
  )
}