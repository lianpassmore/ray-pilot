'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface FinalReviewFormProps {
  userId: string;
  onComplete: () => void;
}

const STORAGE_KEY = 'ray_final_review_draft';

interface Question {
  key: string;
  label: string;
  followup?: {
    key: string;
    label: string;
  };
}

interface Section {
  title: string;
  number: number;
  questions: Question[];
  hasConsent?: boolean;
}

const SECTIONS: Section[] = [
  {
    title: 'Overall Experience',
    number: 1,
    questions: [
      {
        key: 'final_usage_return_behavior',
        label: 'What made you come back for multiple sessions — or if you only used Ray once, what made you decide not to return?',
      },
      {
        key: 'final_relationship_types',
        label: 'Did you tend to focus on one particular relationship, or did you explore different relationships with Ray?',
        followup: {
          key: 'final_relationship_types_followup',
          label: 'What was it like using Ray for those different types of relationships — did it work equally well, or better for some?',
        },
      },
    ],
  },
  {
    title: 'Impact & Insights',
    number: 2,
    questions: [
      {
        key: 'final_pattern_recognition',
        label: 'Did Ray help you recognise anything about how you show up in relationships?',
        followup: {
          key: 'final_pattern_example',
          label: 'Can you give a specific example? What pattern did you see that you hadn\'t seen before?',
        },
      },
      {
        key: 'final_behavior_change',
        label: 'Did you do anything differently in your relationships because of your conversations with Ray? Even small things count.',
        followup: {
          key: 'final_behavior_description',
          label: 'What did you try? What happened?',
        },
      },
      {
        key: 'final_aha_moments',
        label: 'Were there any moments where something Ray said landed in a way that shifted how you think about yourself or your relationships?',
        followup: {
          key: 'final_aha_description',
          label: 'What did Ray say, and what shifted for you?',
        },
      },
    ],
  },
  {
    title: 'Safety & Trust',
    number: 3,
    questions: [
      {
        key: 'final_emotional_safety',
        label: 'Relationship conversations can be vulnerable. Overall, did you feel safe being honest with Ray?',
        followup: {
          key: 'final_safety_explanation',
          label: 'What made it feel safe — or unsafe?',
        },
      },
      {
        key: 'final_ai_vs_human',
        label: 'You were talking to AI, not a human. How did that feel compared to talking to a person about your relationships?',
        followup: {
          key: 'final_ai_comparison_details',
          label: 'What was better about AI? What was worse?',
        },
      },
      {
        key: 'final_trust_responses',
        label: 'Did you trust Ray\'s responses? Why or why not?',
      },
    ],
  },
  {
    title: 'Voice & Accessibility',
    number: 4,
    questions: [
      {
        key: 'final_voice_vs_text',
        label: 'Ray is voice-based — you speak, Ray speaks back. If Ray had been text-based instead, would you have used it the same way?',
        followup: {
          key: 'final_voice_difference',
          label: 'What\'s different about speaking versus typing when you\'re talking about vulnerable relationship stuff?',
        },
      },
    ],
  },
  {
    title: 'Cultural Grounding',
    number: 5,
    questions: [
      {
        key: 'final_cultural_values',
        label: 'Ray is designed around Māori and Pasifika values like whanaungatanga — relationship as fundamental — and manaakitanga — care for your story. Did you notice this cultural grounding? If so, how did it feel?',
        followup: {
          key: 'final_cultural_values_details',
          label: 'Did it feel authentic and integrated, or surface-level?',
        },
      },
    ],
  },
  {
    title: 'Limitations & Failures',
    number: 6,
    questions: [
      {
        key: 'final_limitations',
        label: 'Let\'s talk about where Ray fell short. What did Ray misunderstand, miss entirely, or get wrong about your relationships?',
      },
      {
        key: 'final_frustrations',
        label: 'What frustrated you most about using Ray?',
      },
      {
        key: 'final_scope_limits',
        label: 'Are there relationship types or situations where Ray just doesn\'t work well?',
      },
    ],
  },
  {
    title: 'Comparison & Value',
    number: 7,
    questions: [
      {
        key: 'final_ray_vs_alternatives',
        label: 'If you were struggling with a relationship issue, you have options: therapy, talking to friends, journaling, forums, other apps. Where does Ray fit in that landscape? What does Ray offer that those don\'t — or what do they offer that Ray doesn\'t?',
      },
      {
        key: 'final_would_recommend',
        label: 'Would you recommend Ray to someone else navigating relationship challenges? Why or why not?',
      },
      {
        key: 'final_future_use',
        label: 'If you could change one thing about Ray to make it more helpful, what would it be?',
      },
    ],
  },
  {
    title: 'Closing & Consent',
    number: 8,
    questions: [
      {
        key: 'takeaway',
        label: 'Looking back on the pilot, what are you taking away from using Ray — if anything?',
      },
    ],
    hasConsent: true,
  },
];

interface ConsentState {
  quotes: boolean;
  findings: boolean;
  case_study: boolean;
}

export default function FinalReviewForm({ userId, onComplete }: FinalReviewFormProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState<ConsentState>({ quotes: false, findings: false, case_study: false });
  const [consentNotes, setConsentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Load saved progress from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.responses) setResponses(parsed.responses);
        if (parsed.consent) setConsent(parsed.consent);
        if (parsed.consentNotes) setConsentNotes(parsed.consentNotes);
        if (typeof parsed.section === 'number') setCurrentSection(parsed.section);
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save progress on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      responses,
      consent,
      consentNotes,
      section: currentSection,
    }));
  }, [responses, consent, consentNotes, currentSection]);

  const section = SECTIONS[currentSection];
  const isLast = currentSection === SECTIONS.length - 1;
  const progress = ((currentSection + 1) / SECTIONS.length) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('Your session has expired. Please sign in again.');
        return;
      }

      const consentText = JSON.stringify({
        anonymised_quotes: consent.quotes,
        overall_findings: consent.findings,
        case_study: consent.case_study,
        notes: consentNotes || null,
      });

      const res = await fetch('/api/final-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          ...responses,
          final_consent_anonymized: consentText,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to submit. Please try again.');
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
    } catch (err) {
      console.error('Final review submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Success screen
  if (submitted) {
    return (
      <div className="page-container items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="w-16 h-16 bg-clay/10 rounded-full flex items-center justify-center mx-auto">
            <Check size={32} className="text-clay" />
          </div>
          <h2 className="heading-lg">Ngā mihi nui</h2>
          <p className="body-text text-warm-grey max-w-sm mx-auto">
            Your final review has been submitted. Thank you for being part of the Ray pilot — your reflections are invaluable to this research.
          </p>
          <p className="text-sm text-warm-grey">
            Your koha credits will be processed shortly.
          </p>
          <button onClick={onComplete} className="btn-primary mt-8">
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="caption">Section {section.number} of {SECTIONS.length}</span>
          <span className="caption">{Math.round(progress)}%</span>
        </div>
        <div className="h-[2px] bg-charcoal/10 w-full">
          <motion.div
            className="h-full bg-clay"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Section content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="flex-1"
        >
          <h2 className="heading-lg mb-2">{section.title}</h2>
          <p className="text-xs text-warm-grey uppercase tracking-widest font-bold mb-8">
            Final Review
          </p>

          <div className="space-y-8">
            {section.questions.map((q) => (
              <div key={q.key} className="space-y-4">
                {/* Main question */}
                <div className="space-y-2">
                  <label className="body-text font-medium block">{q.label}</label>
                  <textarea
                    value={responses[q.key] || ''}
                    onChange={e => setResponses(r => ({ ...r, [q.key]: e.target.value }))}
                    placeholder="Share your thoughts..."
                    className="input-field min-h-[100px] resize-none"
                    maxLength={2000}
                  />
                </div>

                {/* Follow-up question */}
                {q.followup && (() => {
                  const fu = q.followup;
                  return (
                    <div className="space-y-2 pl-4 border-l-2 border-clay/20">
                      <label className="text-sm text-warm-grey block">{fu.label}</label>
                      <textarea
                        value={responses[fu.key] || ''}
                        onChange={e => setResponses(r => ({ ...r, [fu.key]: e.target.value }))}
                        placeholder="Optional — add more detail"
                        className="input-field min-h-[80px] resize-none text-sm"
                        maxLength={2000}
                      />
                    </div>
                  );
                })()}
              </div>
            ))}

            {/* Consent section — only on Section 8 */}
            {section.hasConsent && (
              <div className="space-y-4 pt-4 border-t border-charcoal/10">
                <div>
                  <label className="body-text font-medium block">Research Consent</label>
                  <p className="text-sm text-warm-grey mt-1">
                    The researcher will be writing about this pilot in their thesis. Everything will be anonymised. Are you comfortable with:
                  </p>
                </div>

                <div className="space-y-3">
                  {([
                    { key: 'quotes' as const, label: 'Anonymised quotes from your reflections being used' },
                    { key: 'findings' as const, label: 'Your experience being shared as part of the overall findings' },
                    { key: 'case_study' as const, label: 'Your experience being described as a case study — without identifying you' },
                  ]).map(item => (
                    <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                      <div className={`mt-0.5 w-5 h-5 border rounded-sm flex items-center justify-center shrink-0 transition-all ${
                        consent[item.key]
                          ? 'bg-clay border-clay'
                          : 'border-charcoal/20 group-hover:border-charcoal/40'
                      }`}>
                        {consent[item.key] && <Check size={14} className="text-linen" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={consent[item.key]}
                        onChange={e => setConsent(c => ({ ...c, [item.key]: e.target.checked }))}
                        className="sr-only"
                      />
                      <span className="text-sm text-charcoal/80">{item.label}</span>
                    </label>
                  ))}
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-clay/20">
                  <label className="text-sm text-warm-grey block">
                    Is there anything specific you&apos;d want changed or removed? Or anything you&apos;d like to review before submission?
                  </label>
                  <textarea
                    value={consentNotes}
                    onChange={e => setConsentNotes(e.target.value)}
                    placeholder="Optional"
                    className="input-field min-h-[80px] resize-none text-sm"
                    maxLength={2000}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm mt-4 text-center">{error}</p>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-10 pt-6 border-t border-charcoal/10">
        {currentSection > 0 && (
          <button
            onClick={() => { setCurrentSection(s => s - 1); setError(''); }}
            className="btn-secondary flex-1"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </button>
        )}
        {isLast ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`btn-primary flex-1 ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Submitting...' : 'Submit Final Review'}
          </button>
        ) : (
          <button
            onClick={() => { setCurrentSection(s => s + 1); setError(''); }}
            className="btn-primary flex-1"
          >
            Continue <ArrowRight size={16} className="ml-2" />
          </button>
        )}
      </div>
    </div>
  );
}
