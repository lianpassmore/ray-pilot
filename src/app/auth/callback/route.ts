import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)

    // Check if user has completed profile
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, consent_agreed, phone')
        .eq('id', user.id)
        .single()

      // Consent must come first, then profile setup
      if (!profile || !profile.consent_agreed) {
        return NextResponse.redirect(new URL('/onboarding/consent', requestUrl.origin))
      }
      if (!profile.display_name || !profile.phone) {
        return NextResponse.redirect(new URL('/onboarding/profile', requestUrl.origin))
      }
    }
  }

  // Redirect to final review (pilot credits exhausted)
  return NextResponse.redirect(new URL('/final-review', requestUrl.origin))
}
