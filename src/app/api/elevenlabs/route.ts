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

    // Determine session type and compute days since last session
    const FINAL_REVIEW_DATE = new Date('2026-02-26T00:00:00');
    const now = new Date();
    let sessionType = 'returning';
    let daysSinceLastSession: number | null = null;
    let lastSessionDate: string | null = null;

    if (sessionNumber === 1) {
      sessionType = 'first_time';
    } else if (now >= FINAL_REVIEW_DATE) {
      sessionType = 'final_review';
    }

    if (userId && sessionNumber > 1) {
      // Get last completed session
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
        lastSessionDate = lastDate.toISOString();
        daysSinceLastSession = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

        if (
          sessionType === 'returning' &&
          lastDate.getFullYear() === now.getFullYear() &&
          lastDate.getMonth() === now.getMonth() &&
          lastDate.getDate() === now.getDate()
        ) {
          sessionType = 'returning_same_day';
        }
      }
    }

    return NextResponse.json({ signedUrl: data.signed_url, conversationDbId, sessionNumber, sessionType, daysSinceLastSession, lastSessionDate });
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

    // 1. Tiered Crisis Detection
    // HARD triggers = explicit intent/methods → immediate escalation
    const hardTriggers = [
      // Direct suicidal intent
      'kill myself', 'kill her', 'kill him', 'kill them',
      'want to die', 'end it all', 'end my life', 'end it',
      'take my life', 'taking my life', 'taking my own life', 'take my own life',
      'suicide', 'suicidal',
      'going to end it', 'done with life',
      'looking up ways to die', 'researching methods', 'making plans to end',
      'written my goodbyes', 'written my will',
      // Direct harm to others
      'could kill them', 'think about killing', 'deserve to die',
      'going to make sure they suffer', 'going to snap',
      'imagining hurting them', 'thinking about how i\'d do it',
      // Methods / means
      'crash my car', 'drive off the road', 'stockpiling',
      'weapon', 'gun', 'knife',
      // Self-harm
      'cutting myself', 'burning myself', 'hurting myself',
      'hurt myself', 'harm myself', 'smash my head',
    ];

    // SOFT triggers = indirect/coded language → flag and monitor
    const softTriggers = [
      // Indirect suicidal ideation
      'better off dead', 'better off not here', 'better off without me',
      'do something stupid', 'not worth living',
      'don\'t want to be here', 'don\'t want to live',
      'can\'t do this anymore', 'can\'t keep doing this', 'can\'t go on',
      'no reason to live', 'nothing to live for', 'no point in living',
      'life isn\'t worth', 'not wake up', 'go to sleep forever',
      'want to disappear', 'wish i could vanish',
      'if i\'m not here tomorrow', 'won\'t have to worry about me',
      'last time i\'ll bother you', 'saying goodbye',
      'soon this won\'t be your problem',
      'not here tomorrow',
      // Burden / hopelessness
      'i\'m a burden', 'i ruin everything', 'broken beyond repair',
      'nobody would notice if i was gone', 'no one cares about me',
      'everyone would be happier without me', 'i\'m just in the way',
      'i don\'t deserve love', 'i don\'t deserve happiness',
      'i hate myself', 'i\'m useless', 'i\'m nothing', 'i\'m a failure',
      'i\'ve let everyone down',
      'don\'t care what happens to me',
      // Relationship-specific crisis
      'might as well die', 'rather die than live without',
      'if they leave me i\'ll kill', 'want to hurt them so they know',
      'don\'t care what happens to me if i hurt',
      'show them what they\'ve done',
      // Self-harm as coping
      'hurt myself to cope', 'need pain to feel', 'deserve to be punished',
      'scratched myself on purpose',
      // Violence / DV
      'hit me', 'beat me', 'beats me', 'hurt me', 'hurts me',
      'scared of him', 'scared of her',
      'he hits', 'she hits', 'choke', 'strangle',
      'want to hurt them', 'want to make them pay',
    ];

    // Planning/amplifier words — escalate soft → high when combined
    const planningWords = [
      'tonight', 'tomorrow', 'plan', 'planned', 'planning',
      'how to', 'method', 'pills', 'overdose', 'bridge',
      'rope', 'jump', 'bought', 'ready', 'decided', 'goodbye',
      'letter', 'will', 'final', 'last time',
    ];

    // Extract only user messages for scanning (ignore agent responses)
    const userMessages = transcript
      .filter((t: { role: string }) => t.role === 'user')
      .map((t: { message: string }) => t.message)
      .join(' ')
      .toLowerCase();

    // Find ALL matching triggers (not just the first)
    const matchedHard = hardTriggers.filter(k => userMessages.includes(k));
    const matchedSoft = softTriggers.filter(k => userMessages.includes(k));
    const matchedPlanning = planningWords.filter(k => userMessages.includes(k));

    // Scoring logic:
    // - Any hard trigger → HIGH
    // - Soft trigger + planning words → HIGH (escalated)
    // - ≥2 distinct soft triggers → MEDIUM
    // - 1 soft trigger alone → LOW (logged but no email)
    let riskLevel: 'high' | 'medium' | 'low' = 'low';
    const allMatched = [...matchedHard, ...matchedSoft];

    if (matchedHard.length > 0) {
      riskLevel = 'high';
    } else if (matchedSoft.length > 0 && matchedPlanning.length > 0) {
      riskLevel = 'high'; // soft + planning = escalated
    } else if (matchedSoft.length >= 2) {
      riskLevel = 'medium';
    } else if (matchedSoft.length === 1) {
      riskLevel = 'low';
    }

    const riskReasons = {
      hard_triggers: matchedHard,
      soft_triggers: matchedSoft,
      planning_words: matchedPlanning,
      escalated: matchedSoft.length > 0 && matchedPlanning.length > 0 && matchedHard.length === 0,
    };

    console.log(`Crisis scan: risk=${riskLevel}, matched=${JSON.stringify(riskReasons)}`);

    // 2. Look up conversation record
    let dbConversationId: string | null = null;
    let visibleUserId: string | null = null;
    if (conversationId) {
      const { data: convo } = await supabase
        .from('conversations')
        .select('id, user_id')
        .eq('conversation_id', conversationId)
        .single();
      if (convo) {
        dbConversationId = convo.id;
        visibleUserId = convo.user_id;
      }
    }

    // 3. Log every conversation with risk assessment
    let incidentId: string | null = null;
    if (riskLevel !== 'low' || allMatched.length > 0) {
      const { data: incident } = await supabase.from('crisis_incidents').insert({
        trigger_type: allMatched[0] || null,
        user_message: userMessages.substring(0, 2000),
        conversation_id: dbConversationId,
        user_id: visibleUserId,
        researcher_notified_at: null,
        status: 'pending',
        risk_level: riskLevel,
        risk_reasons: riskReasons,
      }).select('id').single();
      incidentId = incident?.id ?? null;
    }

    // 4. Email for medium and high only
    if (riskLevel === 'high' || riskLevel === 'medium') {
      const emailResult = await resend.emails.send({
        from: process.env.SAFETY_EMAIL_FROM || 'Ray Safety <onboarding@resend.dev>',
        to: process.env.RESEARCHER_EMAIL!,
        subject: riskLevel === 'high'
          ? `🚨 HIGH RISK — Crisis in Ray Session`
          : `⚠️ MEDIUM RISK — Concern in Ray Session`,
        html: `
          <h1 style="color: ${riskLevel === 'high' ? '#8B0000' : '#8B4513'}">
            ${riskLevel === 'high' ? '🚨 High-Risk Crisis Alert' : '⚠️ Medium-Risk Concern'}
          </h1>
          <p><strong>Risk Level:</strong> ${riskLevel.toUpperCase()}</p>
          ${riskReasons.escalated ? '<p><strong>⬆ Escalated:</strong> Soft trigger + planning language detected</p>' : ''}
          <p><strong>Hard Triggers:</strong> ${matchedHard.length > 0 ? matchedHard.map(t => `"${t}"`).join(', ') : 'None'}</p>
          <p><strong>Soft Triggers:</strong> ${matchedSoft.length > 0 ? matchedSoft.map(t => `"${t}"`).join(', ') : 'None'}</p>
          <p><strong>Planning Words:</strong> ${matchedPlanning.length > 0 ? matchedPlanning.map(t => `"${t}"`).join(', ') : 'None'}</p>
          <p><strong>Conversation ID:</strong> ${conversationId}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr />
          <h3>User Messages</h3>
          <p style="background:#f5f5f5;padding:12px;border-radius:4px;white-space:pre-wrap;">${userMessages.substring(0, 2000)}</p>
          <hr />
          <p><strong>Action:</strong> Review transcript in ElevenLabs dashboard immediately.</p>
        `
      });

      if (emailResult.error) {
        console.error(`CRITICAL: Crisis email FAILED for ${riskLevel} risk conversation ${conversationId}:`, JSON.stringify(emailResult.error));

        // Mark the incident so failed notifications are identifiable
        if (incidentId) {
          await supabase.from('crisis_incidents').update({
            status: 'email_failed',
          }).eq('id', incidentId);
        }

        return NextResponse.json(
          { error: 'Crisis detected but email notification failed', riskLevel },
          { status: 500 }
        );
      }

      // Email succeeded — update incident with notification timestamp
      console.log('Crisis email sent:', JSON.stringify(emailResult));
      if (incidentId) {
        await supabase.from('crisis_incidents').update({
          researcher_notified_at: new Date().toISOString(),
        }).eq('id', incidentId);
      }
    }

    return NextResponse.json({ status: 'processed' });
  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
