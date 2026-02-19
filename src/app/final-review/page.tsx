'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import FinalReviewForm from '@/components/FinalReviewForm';

export default function FinalReviewPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.id);

      // Check if they've already submitted a final review
      const { data: existing } = await supabase
        .from('feedback')
        .select('id')
        .eq('user_id', user.id)
        .eq('feedback_type', 'final_review')
        .maybeSingle();

      if (existing) {
        setAlreadySubmitted(true);
      }

      setLoading(false);
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="page-container items-center justify-center">
        <p className="caption">Loading...</p>
      </div>
    );
  }

  if (!userId) return null;

  if (alreadySubmitted) {
    return (
      <div className="page-container items-center justify-center text-center">
        <div className="space-y-6 max-w-sm">
          <h2 className="heading-lg">Already Submitted</h2>
          <p className="body-text text-warm-grey">
            You&apos;ve already submitted your final review. If you&apos;d like to update your responses, you can submit again below.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setAlreadySubmitted(false)}
              className="btn-primary"
            >
              Update My Responses
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <FinalReviewForm
      userId={userId}
      onComplete={() => router.push('/dashboard')}
    />
  );
}
