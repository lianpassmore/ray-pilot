import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { conversation_id, user_id, feedback_type } = body;

    if (!user_id || !feedback_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { error } = await supabase.from('feedback').insert({
      conversation_id: conversation_id || null,
      user_id,
      feedback_type,
      // Ratings
      rating_helpful: body.rating_helpful || null,
      rating_safe: body.rating_safe || null,
      rating_insight: body.rating_insight || null,
      rating_trust: body.rating_trust || null,
      rating_return_intent: body.rating_return_intent || null,
      // Open-ended
      most_helpful: body.most_helpful || null,
      what_ray_missed: body.what_ray_missed || null,
      takeaway: body.takeaway || null,
      // Returning user check-in
      returning_changes_noticed: body.returning_changes_noticed || null,
      returning_changes_description: body.returning_changes_description || null,
      returning_tried_differently: body.returning_tried_differently || null,
      returning_tried_description: body.returning_tried_description || null,
      submitted_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Feedback insert error:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ status: 'saved' });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
