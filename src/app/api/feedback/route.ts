import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Verify authenticated user via Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id, user_id, feedback_type } = body;

    if (!user_id || !feedback_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 2. Verify the authenticated user matches the user_id in the request
    if (user.id !== user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 3. Validate ratings (must be 1-5 if provided)
    const ratingFields = ['rating_helpful', 'rating_safe', 'rating_insight', 'rating_trust', 'rating_return_intent'];
    for (const field of ratingFields) {
      if (body[field] != null) {
        const val = Number(body[field]);
        if (!Number.isInteger(val) || val < 1 || val > 5) {
          return NextResponse.json({ error: `Invalid ${field}: must be 1-5` }, { status: 400 });
        }
      }
    }

    // 4. Validate text fields (max 2000 chars)
    const textFields = ['most_helpful', 'what_ray_missed', 'takeaway', 'returning_changes_description', 'returning_tried_description'];
    for (const field of textFields) {
      if (body[field] && typeof body[field] === 'string' && body[field].length > 2000) {
        return NextResponse.json({ error: `${field} too long (max 2000 chars)` }, { status: 400 });
      }
    }

    // 5. Insert using admin client (bypasses RLS for service operations)
    const { error } = await supabase.from('feedback').insert({
      conversation_id: conversation_id || null,
      user_id,
      feedback_type,
      rating_helpful: body.rating_helpful || null,
      rating_safe: body.rating_safe || null,
      rating_insight: body.rating_insight || null,
      rating_trust: body.rating_trust || null,
      rating_return_intent: body.rating_return_intent || null,
      most_helpful: body.most_helpful || null,
      what_ray_missed: body.what_ray_missed || null,
      takeaway: body.takeaway || null,
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
