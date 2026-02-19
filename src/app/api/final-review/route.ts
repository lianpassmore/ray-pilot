import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// All valid final_* text columns in the feedback table
const FINAL_TEXT_FIELDS = [
  'final_usage_return_behavior',
  'final_relationship_types',
  'final_relationship_types_followup',
  'final_pattern_recognition',
  'final_pattern_example',
  'final_behavior_change',
  'final_behavior_description',
  'final_aha_moments',
  'final_aha_description',
  'final_emotional_safety',
  'final_safety_explanation',
  'final_ai_vs_human',
  'final_ai_comparison_details',
  'final_trust_responses',
  'final_voice_vs_text',
  'final_voice_difference',
  'final_cultural_values',
  'final_cultural_values_details',
  'final_limitations',
  'final_frustrations',
  'final_scope_limits',
  'final_ray_vs_alternatives',
  'final_would_recommend',
  'final_future_use',
  'final_consent_anonymized',
  'takeaway',
];

export async function POST(request: Request) {
  try {
    // 1. Authenticate
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // 2. Verify user matches
    if (user.id !== user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Validate text fields (max 2000 chars each)
    for (const field of FINAL_TEXT_FIELDS) {
      if (body[field] && typeof body[field] === 'string' && body[field].length > 2000) {
        return NextResponse.json({ error: `${field} too long (max 2000 chars)` }, { status: 400 });
      }
    }

    // 4. Build the record from allowed fields only
    const record: Record<string, string | null> = {
      user_id,
      feedback_type: 'final_review',
    };
    for (const field of FINAL_TEXT_FIELDS) {
      record[field] = body[field] || null;
    }
    record['submitted_at'] = new Date().toISOString();

    // 5. Check for existing final review (allow updating)
    const { data: existing } = await supabase
      .from('feedback')
      .select('id')
      .eq('user_id', user_id)
      .eq('feedback_type', 'final_review')
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('feedback')
        .update(record)
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('feedback')
        .insert(record));
    }

    if (error) {
      console.error('Final review save error:', error);
      return NextResponse.json({ error: 'Failed to save final review' }, { status: 500 });
    }

    return NextResponse.json({ status: 'saved' });
  } catch (error) {
    console.error('Final review API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
