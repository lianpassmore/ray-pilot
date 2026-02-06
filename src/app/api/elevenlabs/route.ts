import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

// Initialize Admin Client (Bypasses RLS to log incidents)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // You need to add this to .env.local
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // ElevenLabs sends the full transcript in the body
    // Structure depends on their webhook format, usually body.transcript or similar
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

      // 2. Log to Supabase
      // Note: In a real app, you'd map conversation_id to user_id via a lookup table
      // For this pilot, we might just log the raw incident
      await supabase.from('crisis_incidents').insert({
        transcript_snippet: fullText.substring(0, 1000), // Limit size
        crisis_type: detectedCrisis,
        researcher_notified: true
      });

      // 3. Email Researcher (You)
      await resend.emails.send({
        from: 'Ray Safety <safety@yourdomain.com>', // Use default Resend domain if needed
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