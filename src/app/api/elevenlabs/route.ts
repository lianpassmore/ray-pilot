import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const resend = new Resend(process.env.RESEND_API_KEY);

// Simple device detection from User-Agent
function parseDevice(userAgent: string) {
  const ua = userAgent.toLowerCase();

  let deviceType = 'desktop';
  if (/ipad|tablet/.test(ua)) deviceType = 'tablet';
  else if (/mobile|android|iphone|ipod/.test(ua)) deviceType = 'mobile';

  let browser = 'unknown';
  if (ua.includes('edg')) browser = 'edge';
  else if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('safari')) browser = 'safari';
  else if (ua.includes('firefox')) browser = 'firefox';

  return { deviceType, browser };
}

// Helper: verify authenticated user from Authorization header
async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user } } = await supabase.auth.getUser(token);
  return user;
}

// GET handler - Generate ElevenLabs signed URL and create conversation record
export async function GET(request: Request) {
  try {
    // Verify authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userName = searchParams.get('name') || 'User';
    const userId = searchParams.get('userId');

    // Verify the authenticated user matches the userId param
    if (userId && user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ElevenLabs agent ID and API key from environment
    const agentId = process.env.AGENT_ID;
    const apiKey = process.env.API_KEY;

    if (!agentId || !apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs credentials not configured' },
        { status: 500 }
      );
    }

    // Generate signed URL from ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Create a conversations row so the webhook can link back to this user
    let conversationDbId: string | null = null;
    let sessionNumber = 1;

    if (userId) {
      // Parse device info from User-Agent
      const userAgent = request.headers.get('user-agent') || '';
      const { deviceType, browser } = parseDevice(userAgent);

      // Count previous sessions for this user
      const { count } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      sessionNumber = (count ?? 0) + 1;

      const { data: convo } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          agent_id: agentId,
          session_number: sessionNumber,
          status: 'active',
          device_type: deviceType,
          browser: browser,
        })
        .select('id')
        .single();

      conversationDbId = convo?.id ?? null;
    }

    // Determine session type for agent opening protocol
    const FINAL_REVIEW_DATE = new Date('2026-02-26T00:00:00');
    const now = new Date();
    let sessionType = 'returning';

    if (sessionNumber === 1) {
      sessionType = 'first_time';
    } else if (now >= FINAL_REVIEW_DATE) {
      sessionType = 'final_review';
    } else if (userId) {
      // Check if user already had a session today
      const { data: lastConvo } = await supabase
        .from('conversations')
        .select('ended_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(1)
        .single();

      if (lastConvo?.ended_at) {
        const lastDate = new Date(lastConvo.ended_at);
        if (
          lastDate.getFullYear() === now.getFullYear() &&
          lastDate.getMonth() === now.getMonth() &&
          lastDate.getDate() === now.getDate()
        ) {
          sessionType = 'returning_same_day';
        }
      }
    }

    return NextResponse.json({ signedUrl: data.signed_url, conversationDbId, sessionNumber, sessionType });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}

// PATCH handler - Link ElevenLabs conversation_id to our DB row
export async function PATCH(request: Request) {
  try {
    // Verify authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationDbId, elevenLabsConversationId } = await request.json();

    if (!conversationDbId || !elevenLabsConversationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify the conversation belongs to the authenticated user
    const { data: convo } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversationDbId)
      .single();

    if (!convo || convo.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await supabase
      .from('conversations')
      .update({ conversation_id: elevenLabsConversationId })
      .eq('id', conversationDbId);

    return NextResponse.json({ status: 'linked' });
  } catch (error) {
    console.error('PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT handler - End session, record duration, increment total_sessions
export async function PUT(request: Request) {
  try {
    // Verify authenticated user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationDbId } = await request.json();

    if (!conversationDbId) {
      return NextResponse.json({ error: 'Missing conversationDbId' }, { status: 400 });
    }

    const { data: convo } = await supabase
      .from('conversations')
      .select('started_at, user_id')
      .eq('id', conversationDbId)
      .single();

    if (!convo) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify the conversation belongs to the authenticated user
    if (convo.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const endedAt = new Date();
    const startedAt = new Date(convo.started_at);
    const durationSeconds = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);

    // Mark conversation as completed
    await supabase
      .from('conversations')
      .update({
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
        status: 'completed',
      })
      .eq('id', conversationDbId);

    // Increment total_sessions and update last_active_at on profile
    if (convo.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_sessions')
        .eq('id', convo.user_id)
        .single();

      await supabase
        .from('profiles')
        .update({
          total_sessions: (profile?.total_sessions ?? 0) + 1,
          last_active_at: endedAt.toISOString(),
        })
        .eq('id', convo.user_id);
    }

    return NextResponse.json({ status: 'ended', durationSeconds });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler - Webhook for crisis detection (no user auth — uses signature verification)
export async function POST(request: Request) {
  try {
    // 0. Verify webhook signature
    const rawBody = await request.text();
    const sigHeader = request.headers.get('elevenlabs-signature');
    const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('ELEVENLABS_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!sigHeader) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const client = new ElevenLabsClient({ apiKey: process.env.API_KEY });
    let event;
    try {
      event = await client.webhooks.constructEvent(rawBody, sigHeader, webhookSecret);
    } catch {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = event.data ?? JSON.parse(rawBody);
    const transcript = body.transcript || [];
    const conversationId = body.conversation_id;

    // 1. Scan for Crisis Keywords (Simple heuristic for MVP)
    const crisisKeywords = [
      'suicide', 'kill myself', 'want to die', 'end it all',
      'hit me', 'beat me', 'hurt me', 'scared of him', 'scared of her',
      'weapon', 'gun', 'knife'
    ];

    // Convert transcript to string for scanning
    const fullText = JSON.stringify(transcript).toLowerCase();

    const detectedCrisis = crisisKeywords.find(keyword => fullText.includes(keyword));

    if (detectedCrisis) {
      console.log(`CRISIS DETECTED: ${detectedCrisis}`);

      // 2. Look up conversation record by ElevenLabs conversation_id
      let dbConversationId: string | null = null;
      let userId: string | null = null;
      if (conversationId) {
        const { data: convo } = await supabase
          .from('conversations')
          .select('id, user_id')
          .eq('conversation_id', conversationId)
          .single();
        if (convo) {
          dbConversationId = convo.id;
          userId = convo.user_id;
        }
      }

      // 3. Log to Supabase crisis_incidents
      await supabase.from('crisis_incidents').insert({
        trigger_type: detectedCrisis,
        user_message: fullText.substring(0, 1000),
        conversation_id: dbConversationId,
        user_id: userId,
        researcher_notified_at: new Date().toISOString(),
        status: 'pending'
      });

      // 3. Email Researcher (You)
      await resend.emails.send({
        from: process.env.SAFETY_EMAIL_FROM || 'Ray Safety <onboarding@resend.dev>',
        to: process.env.RESEARCHER_EMAIL!,
        subject: `⚠️ CRISIS DETECTED in Ray Session`,
        html: `
          <h1>Crisis Alert</h1>
          <p><strong>Keyword Detected:</strong> ${detectedCrisis}</p>
          <p><strong>Conversation ID:</strong> ${conversationId}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <p>Please review the transcript in ElevenLabs dashboard immediately.</p>
        `
      });
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
