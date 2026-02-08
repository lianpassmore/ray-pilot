'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface FeedbackFormProps {
  conversationDbId: string;
  userId: string;
  isReturning: boolean;
  onComplete: () => void;
}

function RatingScale({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="space-y-3">
      <label className="label-sm">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-sm border text-sm font-bold transition-all ${
              value === n
                ? 'bg-charcoal text-linen border-charcoal'
                : 'bg-white/60 text-charcoal border-charcoal/10 hover:border-charcoal/30'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-warm-grey uppercase tracking-wider">
        <span>Not at all</span>
        <span>Very much</span>
      </div>
    </div>
  );
}

export default function FeedbackForm({ conversationDbId, userId, isReturning, onComplete }: FeedbackFormProps) {
  const [ratings, setRatings] = useState({
    rating_helpful: 0,
    rating_safe: 0,
    rating_insight: 0,
    rating_trust: 0,
    rating_return_intent: 0,
  });

  const [openEnded, setOpenEnded] = useState({
    most_helpful: '',
    what_ray_missed: '',
    takeaway: '',
  });

  const [returning, setReturning] = useState({
    returning_changes_noticed: '',
    returning_changes_description: '',
    returning_tried_differently: '',
    returning_tried_description: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'returning' | 'ratings' | 'openended'>(isReturning ? 'returning' : 'ratings');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationDbId,
          user_id: userId,
          feedback_type: isReturning ? 'returning' : 'session',
          ...ratings,
          ...openEnded,
          ...(isReturning ? returning : {}),
        }),
      });
      onComplete();
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
    >
      <div className="absolute inset-0 bg-charcoal/40 backdrop-blur-[2px]" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md bg-linen border border-charcoal/10 shadow-2xl rounded-sm max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-linen/95 backdrop-blur-sm p-6 border-b border-charcoal/10 flex justify-between items-center z-10">
          <div>
            <h2 className="text-lg font-bold text-charcoal">Session Feedback</h2>
            <p className="text-xs text-warm-grey mt-1">
              {step === 'returning' ? 'Quick check-in' : step === 'ratings' ? 'Rate your experience' : 'Almost done'}
            </p>
          </div>
          <button onClick={onComplete} className="text-warm-grey hover:text-charcoal transition-colors">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Returning user check-in */}
          {step === 'returning' && (
            <div className="space-y-6">
              <p className="label-sm text-clay">Welcome Back</p>

              <div className="space-y-3">
                <label className="label-sm">Have you noticed any changes since your last session?</label>
                <div className="flex gap-3">
                  {['Yes', 'No', 'Not sure'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setReturning(r => ({ ...r, returning_changes_noticed: opt }))}
                      className={`px-4 py-2 text-sm font-bold border rounded-sm transition-all ${
                        returning.returning_changes_noticed === opt
                          ? 'bg-charcoal text-linen border-charcoal'
                          : 'bg-white/60 border-charcoal/10 hover:border-charcoal/30'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {returning.returning_changes_noticed === 'Yes' && (
                  <textarea
                    value={returning.returning_changes_description}
                    onChange={e => setReturning(r => ({ ...r, returning_changes_description: e.target.value }))}
                    placeholder="What changes have you noticed?"
                    className="input-field min-h-[80px] resize-none"
                  />
                )}
              </div>

              <div className="space-y-3">
                <label className="label-sm">Have you tried doing anything differently?</label>
                <div className="flex gap-3">
                  {['Yes', 'No', 'Not sure'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setReturning(r => ({ ...r, returning_tried_differently: opt }))}
                      className={`px-4 py-2 text-sm font-bold border rounded-sm transition-all ${
                        returning.returning_tried_differently === opt
                          ? 'bg-charcoal text-linen border-charcoal'
                          : 'bg-white/60 border-charcoal/10 hover:border-charcoal/30'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {returning.returning_tried_differently === 'Yes' && (
                  <textarea
                    value={returning.returning_tried_description}
                    onChange={e => setReturning(r => ({ ...r, returning_tried_description: e.target.value }))}
                    placeholder="What did you try?"
                    className="input-field min-h-[80px] resize-none"
                  />
                )}
              </div>

              <button onClick={() => setStep('ratings')} className="btn-primary">
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Ratings */}
          {step === 'ratings' && (
            <div className="space-y-6">
              <RatingScale
                label="How helpful was this session?"
                value={ratings.rating_helpful}
                onChange={v => setRatings(r => ({ ...r, rating_helpful: v }))}
              />
              <RatingScale
                label="How safe did you feel?"
                value={ratings.rating_safe}
                onChange={v => setRatings(r => ({ ...r, rating_safe: v }))}
              />
              <RatingScale
                label="Did you gain new insights?"
                value={ratings.rating_insight}
                onChange={v => setRatings(r => ({ ...r, rating_insight: v }))}
              />
              <RatingScale
                label="How much did you trust Ray?"
                value={ratings.rating_trust}
                onChange={v => setRatings(r => ({ ...r, rating_trust: v }))}
              />
              <RatingScale
                label="How likely are you to return?"
                value={ratings.rating_return_intent}
                onChange={v => setRatings(r => ({ ...r, rating_return_intent: v }))}
              />

              <button onClick={() => setStep('openended')} className="btn-primary">
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Open-ended */}
          {step === 'openended' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="label-sm">What was most helpful?</label>
                <textarea
                  value={openEnded.most_helpful}
                  onChange={e => setOpenEnded(o => ({ ...o, most_helpful: e.target.value }))}
                  placeholder="Optional"
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="label-sm">What did Ray miss or get wrong?</label>
                <textarea
                  value={openEnded.what_ray_missed}
                  onChange={e => setOpenEnded(o => ({ ...o, what_ray_missed: e.target.value }))}
                  placeholder="Optional"
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="label-sm">What is your main takeaway?</label>
                <textarea
                  value={openEnded.takeaway}
                  onChange={e => setOpenEnded(o => ({ ...o, takeaway: e.target.value }))}
                  placeholder="Optional"
                  className="input-field min-h-[80px] resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`btn-primary ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              <button
                onClick={onComplete}
                className="w-full text-center text-xs text-warm-grey hover:text-charcoal transition-colors uppercase tracking-widest font-bold py-2"
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
