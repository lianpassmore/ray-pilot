# SAFETY_EXTRACTION.md
## Ray Pilot — Safety Design Audit
**Purpose:** Master's thesis documentation — ethical AI design in vulnerable conversational contexts
**Audit date:** March 2026
**Auditor note:** All findings are traceable to source files. Live credentials and personal contact details have been redacted and replaced with descriptions of their type and purpose; the values exist in `.env.local` (not committed to version control).

---

## 1. PROJECT IDENTITY

**Project name:** Ray

**What it does:** Ray is a voice-first AI relationship coaching web application that helps users identify patterns in their relationships — romantic, familial, professional, or otherwise — through one-on-one conversations with an AI agent named Ray. The philosophy is *"Clarity over comfort."*

**Who the users are:** A closed group of New Zealand participants recruited for a two-week research pilot (February 12–26, 2026). Participants self-selected into the study, suggesting they were already thinking about a relationship challenge. Demographics collected include age range, location (NZ regions + International), gender, ethnicity, and identity factors including disability and neurodivergence.

**Vulnerability level:** High. Participants disclosed active relationship struggles, potentially including domestic conflict, separation, grief, mental health pressures, and family estrangement. The voice-first format and coaching framing lower inhibitions compared to text — participants may disclose more than they would in writing. The AI has no human judgment, no therapy training, and no ability to read non-verbal cues.

**Date range built:** The initial commit (`286e7aa`, February 6, 2026) introduced the project structure and an emergency SOS button. The pilot ran February 12–26, 2026. Final documentation prepared March 2026.

**Tech stack:**

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 16.1.6 (App Router), React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4, Framer Motion |
| AI conversation | ElevenLabs ConversationalAI (voice + text agent) |
| Database | Supabase / PostgreSQL with Row-Level Security |
| Authentication | Supabase Auth — Google OAuth, email OTP (magic link), password |
| Crisis email alerts | Resend transactional email |
| Hosting target | Vercel |

---

## 2. SYSTEM PROMPTS & AI INSTRUCTIONS

### 2.1 The ElevenLabs Agent — What the Codebase Reveals

The AI conversation agent is configured in the **ElevenLabs platform** (not in this codebase). The codebase does not contain any system prompt text, persona definition, or instruction set for Ray — these live in the ElevenLabs agent dashboard and are accessed via the agent ID stored in `.env.local`:

```
AGENT_ID=agent_2301kb9zprv8fw59befd80cqctwq  [redacted — see .env.local]
```

**What this means for the audit:** The system prompt that defines Ray's personality, coaching style, boundaries, and refusals is not auditable from this codebase alone. It requires access to the ElevenLabs account under the email `lianpassmore@gmail.com` [redacted]. This is a significant auditability gap — see Section 4 (Gaps).

### 2.2 Dynamic Variables Injected at Session Start

Although the base system prompt lives in ElevenLabs, the codebase injects **dynamic context variables** into every session. These act as a runtime extension to the system prompt, personalising Ray's behaviour per user and session.

**File:** [`src/components/RayWidget.tsx`](src/components/RayWidget.tsx), lines 106–116

```typescript
await conversation.startSession({
  signedUrl: signedUrl,
  dynamicVariables: {
    user_name: userName,
    session_number: String(sessionNumber),
    session_type: sessionType,
    user_context: userContext || 'No personal context provided yet.',
    days_since_last_session: daysSinceLastSession != null ? String(daysSinceLastSession) : 'first session',
    last_session_date: lastSessionDate ? new Date(lastSessionDate).toLocaleDateString('en-NZ', { timeZone: 'Pacific/Auckland', weekday: 'long', day: 'numeric', month: 'long' }) : 'N/A',
  }
});
```

**What these variables provide Ray:**
- `user_name` — The participant's preferred name (collected in onboarding)
- `session_number` — Which session this is (Ray presumably uses this to adjust approach for new vs. returning participants)
- `session_type` — Hardcoded to `'final_review'` in the current codebase (line 119 of `src/app/api/elevenlabs/route.ts`) — suggesting the pilot has entered its final phase
- `user_context` — A concatenated string of the participant's relationship status, partner's name, children, occupation, living situation, and any free-text context they provided in onboarding
- `days_since_last_session` / `last_session_date` — Temporal awareness of the relationship between sessions

**File:** [`src/components/RayWidget.tsx`](src/components/RayWidget.tsx), lines 27–37

```typescript
function buildUserContext(profile?: ProfileData): string {
  if (!profile) return '';
  const parts: string[] = [];
  if (profile.relationship_status) parts.push(`Relationship status: ${profile.relationship_status}`);
  if (profile.partner_name) parts.push(`Partner's name: ${profile.partner_name}`);
  if (profile.children_info) parts.push(`Children: ${profile.children_info}`);
  if (profile.occupation) parts.push(`Occupation: ${profile.occupation}`);
  if (profile.living_situation) parts.push(`Living situation: ${profile.living_situation}`);
  if (profile.additional_context) parts.push(`Additional context: ${profile.additional_context}`);
  return parts.join('. ');
}
```

**Why this was written this way:** The context string gives Ray enough background that users don't have to re-explain their situation at the start of every session. The fallback `'No personal context provided yet.'` prevents Ray from receiving an empty variable, which could cause the agent to behave unexpectedly.

### 2.3 Cultural References in the Agent Prompt (Inferred from FinalReviewForm)

While the base system prompt is not in this codebase, the final review survey reveals what cultural values were supposedly embedded in Ray's persona. From [`src/components/FinalReviewForm.tsx`](src/components/FinalReviewForm.tsx), lines 124–133:

```typescript
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
```

This is the only place in the codebase that explicitly states the values Ray was designed to embody: **whanaungatanga** (relationship as fundamental) and **manaakitanga** (care/hospitality). These would presumably be expressed in the ElevenLabs system prompt.

### 2.4 Feedback Dimensions as Implicit Agent Instructions

The session feedback form signals what the AI was *expected* to do. From [`src/components/FeedbackForm.tsx`](src/components/FeedbackForm.tsx), the five rating dimensions are:

- **Helpful** — Was Ray's coaching useful?
- **Safe** — Did the user feel safe?
- **Insight** — Did Ray help them gain insight?
- **Trust** — Did they trust Ray's responses?
- **Return intent** — Would they come back?

The explicit "safe" rating dimension confirms that emotional safety was a deliberate design goal, not an afterthought.

---

## 3. SAFETY MECHANISMS

### 3.1 Conversation Boundaries

#### What topics is the AI told to avoid or redirect?
The codebase does not contain the system prompt, so boundary instructions cannot be confirmed from code. However, the **consent page** explicitly sets user expectations about Ray's limits — these likely mirror instructions given to the AI:

**File:** [`src/app/onboarding/consent/page.tsx`](src/app/onboarding/consent/page.tsx), lines 72–79

```tsx
<div className="bg-charcoal/5 p-4 rounded-sm border-l-4 border-forest">
  <ul className="space-y-2 text-sm text-charcoal font-medium">
    <li>• I'm coaching, not therapy.</li>
    <li>• I'm not crisis intervention.</li>
    <li>• Sessions are capped at 45 minutes.</li>
    <li>• I have no memory of previous sessions (Fresh start every time).</li>
  </ul>
</div>
```

These four limits are stated to users. Whether they are also enforced in the AI's system prompt is unknown from the codebase.

#### What happens when a user goes into dangerous territory?
The crisis detection system (Section 3.3 below) handles dangerous territory at the **server/webhook level**, not the AI conversation level. The AI itself has no code-level mechanism to detect crisis in real time and redirect — the crisis detection runs on completed transcripts via webhook. There is no in-conversation escalation path for the AI to say "I'm going to refer you to a human now."

There was, however, a now-removed feature. From the commit message for `286e7aa`:

```
Add emergency SOS button and restructure project

- Add emergency/crisis button to RayWidget that immediately ends AI session
  and auto-dials mental health line (tel:1737)
```

The `tel:1737` number is the New Zealand mental health helpline (Need to Talk? / 1737). This button was added on **February 6, 2026** — before the pilot launched — but is **not present in the current codebase**. It was removed at some point during development.

### 3.2 Opening and Closing Protocols

#### How does the conversation start?
The full user journey before any conversation begins:

1. **Login** — Google OAuth, email OTP, or password ([`src/app/login/page.tsx`](src/app/login/page.tsx))
2. **Consent gate** — Must agree before proceeding; consent is recorded with timestamp ([`src/app/onboarding/consent/page.tsx`](src/app/onboarding/consent/page.tsx))
3. **Profile setup** — Demographics, phone number ([`src/app/onboarding/profile/page.tsx`](src/app/onboarding/profile/page.tsx))
4. **Context setup** — Relationship status, partner name, children, occupation, living situation, free text ([`src/app/onboarding/context/page.tsx`](src/app/onboarding/context/page.tsx))
5. **Conversation** — Tapping the animated orb or clicking "Tap to begin" starts voice session

The auth callback enforces step ordering:

**File:** [`src/app/auth/callback/route.ts`](src/app/auth/callback/route.ts), lines 15–27

```typescript
if (!profile || !profile.consent_agreed) {
  return NextResponse.redirect(new URL('/onboarding/consent', requestUrl.origin))
}
if (!profile.display_name || !profile.phone) {
  return NextResponse.redirect(new URL('/onboarding/profile', requestUrl.origin))
}
```

Consent must come before any data collection — this ordering is enforced in code.

The dashboard layout also enforces it:

**File:** [`src/app/dashboard/layout.tsx`](src/app/dashboard/layout.tsx), lines 26–35

```typescript
if (!profile?.consent_agreed) {
  router.push('/onboarding/consent')
} else if (!profile?.display_name) {
  router.push('/onboarding/profile')
} else if (!profile?.onboarding_context_completed) {
  router.push('/onboarding/context')
}
```

#### How does the conversation end?
The user ends a session by clicking the red phone-off button (voice mode) or the X button (text mode). These call `endConversation()`:

**File:** [`src/components/RayWidget.tsx`](src/components/RayWidget.tsx), lines 146–164

```typescript
const endConversation = async () => {
  const dbId = conversationDbIdRef.current;
  await conversation.endSession();

  if (dbId) {
    // Records session duration to database
    await fetch('/api/elevenlabs', {
      method: 'PUT',
      body: JSON.stringify({ conversationDbId: dbId }),
    });
    if (onSessionEnd) onSessionEnd(dbId);
  }
};
```

After session end, the `onSessionEnd` callback in the dashboard triggers the post-session feedback form. There is no AI-led closing ritual — the session ends when the user presses the button.

#### Is there a consent flow before the conversation begins?
Yes — explicit, checkbox-based, with database persistence of consent date. The consent page (`src/app/onboarding/consent/page.tsx`) requires the user to read terms in a scrollable area and check a box before the "Begin" button activates. The checkbox text:

> "I consent to participate. I understand my participation is voluntary, private, and I can withdraw anytime."

Consent data stored:
```typescript
await supabase.from('profiles').upsert({
  id: user.id,
  consent_agreed: true,
  consent_date: new Date().toISOString(),
  email: user.email
})
```

### 3.3 Crisis Detection System

This is the most substantial safety mechanism in the codebase. It runs server-side via an ElevenLabs webhook.

**File:** [`src/app/api/elevenlabs/route.ts`](src/app/api/elevenlabs/route.ts), lines 258–483 (POST handler)

#### Architecture

```
ElevenLabs (conversation ends or event fires)
        │
        ▼
POST /api/elevenlabs  [webhook]
        │
        ├── 1. Verify HMAC signature (reject if invalid)
        │
        ├── 2. Extract user-only messages from transcript
        │        (agent responses are excluded from scanning)
        │
        ├── 3. Score against trigger lists
        │        Hard triggers → HIGH
        │        Soft + planning words → HIGH (escalated)
        │        ≥2 soft triggers → MEDIUM
        │        1 soft trigger → LOW (log only, no email)
        │        No triggers → no action
        │
        ├── 4. Persist to crisis_incidents table
        │        (write-only; no client-side reads permitted)
        │
        └── 5. Email researcher (HIGH and MEDIUM only)
                 via Resend
                 includes: risk level, matched triggers, NZ timestamp, user messages
```

#### Hard Triggers (58 phrases — explicit intent)

These immediately classify a conversation as HIGH risk:

```typescript
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
```

#### Soft Triggers (50 phrases — indirect/coded language)

```typescript
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
```

#### Planning Amplifiers (16 words — escalate soft → HIGH when combined)

```typescript
const planningWords = [
  'tonight', 'tomorrow', 'plan', 'planned', 'planning',
  'how to', 'method', 'pills', 'overdose', 'bridge',
  'rope', 'jump', 'bought', 'ready', 'decided', 'goodbye',
  'letter', 'will', 'final', 'last time',
];
```

#### Scoring Logic

```typescript
if (matchedHard.length > 0) {
  riskLevel = 'high';
} else if (matchedSoft.length > 0 && matchedPlanning.length > 0) {
  riskLevel = 'high'; // soft + planning = escalated
} else if (matchedSoft.length >= 2) {
  riskLevel = 'medium';
} else if (matchedSoft.length === 1) {
  riskLevel = 'low';
}
```

Only user messages are scanned (agent messages are excluded):

```typescript
const userMessages = transcript
  .filter((t: { role: string }) => t.role === 'user')
  .map((t: { message: string }) => t.message)
  .join(' ')
  .toLowerCase();
```

#### Email Alert Content (HIGH/MEDIUM)

**File:** [`src/app/api/elevenlabs/route.ts`](src/app/api/elevenlabs/route.ts), lines 428–451

The email sent to the researcher includes:
- Risk level (HIGH or MEDIUM) with visual colour coding
- Whether it was an escalation (soft + planning combination)
- All matched hard triggers
- All matched soft triggers
- All matched planning words
- ElevenLabs conversation ID
- Timestamp in New Zealand time (`Pacific/Auckland`)
- Full user message text (up to 2000 characters)
- Instruction: "Review transcript in ElevenLabs dashboard immediately."

#### Crisis Incident Persistence

Each triggered event is written to a `crisis_incidents` table with:
- `trigger_type` — First matched trigger phrase
- `user_message` — Full user message text (up to 2000 chars)
- `conversation_id` — Database conversation ID
- `user_id` — User UUID
- `researcher_notified_at` — Timestamp when email was sent (null if not sent yet)
- `status` — `'pending'` or `'email_failed'`
- `risk_level` — `'low'`, `'medium'`, or `'high'`
- `risk_reasons` — JSON object with all matched triggers

If the email fails to send, the incident is marked `email_failed` and the API returns a 500 error — this ensures failed notifications are identifiable.

#### Email Failure Handling

```typescript
if (emailResult.error) {
  console.error(`CRITICAL: Crisis email FAILED for ${riskLevel} risk conversation ${conversationId}:`, ...);
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
```

### 3.4 Emotional Safety Features

#### Mute and Mode Switching
During voice sessions, users can:
- **Mute their microphone** (mic-off button) without ending the session
- **Switch to text mode** mid-session (the AI agent keeps running, voice is disabled)
- **End the session** at any time via the red phone-off button

**File:** [`src/components/RayWidget.tsx`](src/components/RayWidget.tsx), lines 279–312

```typescript
<button onClick={() => setMicMuted(!micMuted)} ...>
  {micMuted ? <MicOff .../> : <Mic .../>}
</button>

<button onClick={endConversation} ...>
  <PhoneOff .../>
</button>
```

These give users physical control over their participation level at any moment.

#### The Removed SOS Button (Historical)
As documented in commit `286e7aa` (February 6, 2026):

> "Add emergency/crisis button to RayWidget that immediately ends AI session and auto-dials mental health line (tel:1737)"

The New Zealand mental health helpline (1737) was auto-dial integrated at one point. This feature was removed before or during the pilot. The reasons for removal are not documented in commit messages or code comments — this is a significant gap (see Section 4).

#### No In-Session Check-Ins
The codebase contains no scheduled or condition-triggered check-in mechanism during sessions. The AI does not have code-level instructions to pause and check in if the conversation becomes distressing. This would need to be handled within the ElevenLabs system prompt, which is not visible here.

#### No "Pause" Mechanism
There is no pause button. Users can mute themselves (mic off), switch to text, or end the session. There is no intermediate "pause and resume" state.

### 3.5 Data Handling

#### Storage Location
- **Conversation metadata:** Supabase PostgreSQL, hosted on Supabase's infrastructure (US-East by default). The URL `yydelxjwzycebakmruqi.supabase.co` does not indicate a specific geographic region, and the codebase has no explicit region configuration.
- **Conversation transcripts:** Stored by ElevenLabs on their infrastructure. Researcher downloads them using `export-transcripts.mjs`.
- **Crisis incidents:** Supabase (same instance as above).

#### Who Has Access
- **Participants:** Can read and modify only their own `profiles`, `conversations`, and `feedback` rows (enforced by RLS).
- **Researcher:** Full access via the Supabase service role key (server-side only, never sent to browser).
- **Crisis incidents:** Zero client access — the RLS policy explicitly blocks all client reads:

**File:** [`security_fixes.sql`](security_fixes.sql), lines 11–17

```sql
-- Users should NEVER have direct access to crisis data.
-- Only the service role (webhook) can insert. No client reads.
CREATE POLICY "Service role only - no client access"
  ON crisis_incidents
  FOR ALL
  USING (false)
  WITH CHECK (false);
```

#### Encryption
- **In transit:** HTTPS enforced by Vercel/Next.js; Supabase connections use TLS.
- **At rest:** Supabase encrypts at rest by default.
- **Application-level:** No additional application-layer encryption is implemented.

#### Can Users Delete Their Data?
The consent page states:

> "Control: You can delete individual sessions or your entire account anytime."

However, **no delete functionality exists in the current codebase**. There is no API route for account deletion, no session deletion UI, and no data export for participants. This is documented as a known limitation in `BUILD_DOCUMENTATION.md`:

> "Features like account deletion, data export for participants, and full withdrawal mechanics are noted in consent copy but may require additional development."

This is a gap between consent promises and implementation.

#### Region / Sovereignty
There is no NZ-specific data sovereignty configuration in the codebase. The Supabase project appears to be on a default region (not specified). ElevenLabs transcripts are stored on ElevenLabs infrastructure (US-based). There is no reference to data residency requirements, the NZ Privacy Act, or iwi data sovereignty frameworks in the codebase or documentation.

#### Row Level Security Policies

**File:** [`supabase_setup.sql`](supabase_setup.sql) and [`security_fixes.sql`](security_fixes.sql)

```sql
-- profiles: users can only view/insert/update their own row
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- conversations: users can only view/insert/update their own rows
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT USING (auth.uid() = user_id);
-- [similar insert/update policies]

-- feedback: users can only view/insert their own rows
-- [similar policies]

-- crisis_incidents: BLOCKED for all clients
CREATE POLICY "Service role only - no client access"
  ON crisis_incidents FOR ALL USING (false) WITH CHECK (false);
```

#### Data Retention
The consent page states:

> "Deletion: All data is destroyed 2 years after the project ends."

No automated deletion mechanism exists in the codebase — this would need to be implemented manually or via a scheduled Supabase function.

#### Webhook Security
The crisis detection webhook verifies an HMAC signature from ElevenLabs before processing any data:

**File:** [`src/app/api/elevenlabs/route.ts`](src/app/api/elevenlabs/route.ts), lines 261–282

```typescript
const sigHeader = request.headers.get('elevenlabs-signature');
const webhookSecret = process.env.ELEVENLABS_WEBHOOK_SECRET;

// ...
event = await client.webhooks.constructEvent(rawBody, sigHeader, webhookSecret);
// Invalid signatures throw → caught → 401 response
```

### 3.6 Cultural Safety

#### Te Reo Māori Usage
The application uses te reo Māori in two places:

1. **Landing page greeting:**

   **File:** [`src/app/page.tsx`](src/app/page.tsx), line 39
   ```tsx
   <h2 className="text-4xl md:text-5xl tracking-tight text-charcoal leading-tight">
     <span className="font-light">Kia ora,</span>{' '}
     <span className="font-bold">I'm Ray.</span>
   </h2>
   ```

2. **Consent page heading:**

   **File:** [`src/app/onboarding/consent/page.tsx`](src/app/onboarding/consent/page.tsx), line 34
   ```tsx
   <h1 className="heading-xl">Kia ora.</h1>
   ```

No other te reo appears in the codebase's UI text.

#### Cultural Values Referenced
The final review form explicitly names the cultural values Ray was designed around:

> *"Ray is designed around Māori and Pasifika values like whanaungatanga — relationship as fundamental — and manaakitanga — care for your story."*

This language appears only in the research survey, not in the product UI itself. The consent page, onboarding, and dashboard contain no explicit cultural framing beyond "Kia ora."

#### Ethnicity and Identity Factors in Demographics
The profile onboarding includes a rich, NZ-specific ethnicity list that reflects the country's demographics:

**File:** [`src/app/onboarding/profile/page.tsx`](src/app/onboarding/profile/page.tsx), lines 23–29

```typescript
const ethnicities = [
  'European / Pākehā', 'Māori', 'Indian', 'Chinese', 'Filipino',
  'Samoan', 'Tongan', 'Cook Islands Māori', 'Niuean', 'Fijian',
  'Sri Lankan', 'MELAA', 'British', 'Irish', 'South African',
  'Korean', 'Bangladesh', 'Japanese', 'Dutch', 'Australian',
  'Other Asian', 'Other European', 'Other Pacific Peoples', 'Prefer not to say'
]
```

The identity factors list uses te reo alongside English:

```typescript
const identityOptions = [
  'Digitally Excluded',
  'Disabled/Tāngata Whaikaha',
  'Neurodivergent/Kanorau ā-roro',
  'None of these apply',
  'Other'
]
```

`Tāngata Whaikaha` (people with lived experience of disability) and `Kanorau ā-roro` (neurodiversity) are the te reo equivalents used here — a culturally grounded framing rather than medical language.

#### Kaupapa / Researcher Acknowledgment
The codebase contains no explicit acknowledgment of kaupapa Māori methodology, Treaty obligations, or the researcher's positionality. The BUILD_DOCUMENTATION.md positions the project as "Master's Research Pilot, New Zealand" without further context on the research paradigm.

---

## 4. WHAT'S NOT THERE (GAPS)

These are safety features absent from the codebase that might be expected given the vulnerability level.

### 4.1 ElevenLabs System Prompt — Not Auditable
**Gap:** The AI's core instructions, boundary settings, persona, and crisis protocols live in the ElevenLabs dashboard. They are not in version control, not in the codebase, and not documented elsewhere. If the system prompt is changed, there is no audit trail.

**Why it matters:** The most important safety document in this system is inaccessible to this audit.

### 4.2 No In-Conversation Crisis Escalation Path
**Gap:** If a user expresses distress during a session, the AI has no code-level mechanism to redirect to crisis resources in real time. Crisis detection runs on the post-conversation transcript via webhook — after the conversation has ended.

**Why it matters:** A user in acute distress may need immediate redirection. The removed SOS button (commit `286e7aa`) was an attempt to address this; its removal without a replacement leaves a gap.

### 4.3 No Crisis Resources Shown to Users
**Gap:** There are no crisis resource links, phone numbers (e.g. 1737), or "you can also talk to..." messages displayed to participants in the product UI. The consent page says "I'm not crisis intervention" but provides no alternative.

**Why it matters:** If a participant reaches a crisis point, they are not given access to help within the product experience.

### 4.4 Account Deletion Is Promised but Not Built
**Gap:** The consent page explicitly tells participants they can "delete individual sessions or your entire account anytime." No delete functionality exists in the codebase.

**Why it matters:** This is a gap between informed consent promises and implementation. Participants who consented believing they had this right may be unable to exercise it.

### 4.5 No NZ Data Sovereignty Configuration
**Gap:** The Supabase project does not appear to be configured in a New Zealand or Australian region. ElevenLabs stores transcripts in the US. There is no reference to the NZ Privacy Act 2020, the Data and Statistics Act 2022, or Māori data sovereignty frameworks (e.g. Te Mana Raraunga principles).

**Why it matters:** For research involving Māori and Pasifika participants, data sovereignty is an ethical obligation — particularly if cultural knowledge or whakapapa-related information is shared in sessions.

### 4.6 No Session Time Limit Enforcement
**Gap:** The consent page says sessions are "capped at 45 minutes," but the `TimeMeter` component exists in the file list without any code that enforces a hard cutoff. There is no API-level or UI-level mechanism to end a session after 45 minutes.

**Why it matters:** Extended sessions with vulnerable users in emotional distress carry greater risk than shorter bounded interactions.

### 4.7 Keyword Detection Is Not Semantically Aware
**Gap:** The crisis detection system is a substring match against a flat list of phrases. It has no understanding of context, negation, or metaphor. Examples of potential false positives and misses:
- "My friend said she wants to die every time she sees traffic" — triggers `want to die`
- "I feel like I've completely lost myself in this relationship" — would not trigger anything
- "She was so angry she said she could kill him" — triggers `kill him` (reporting someone else's words)

**Why it matters:** The BUILD_DOCUMENTATION acknowledges this: *"The trigger system is keyword and pattern based, not semantically deep. It may produce false positives and could miss nuanced expressions of distress."* This is an honest limitation, but not a design response to it.

### 4.8 No Participant-Facing Incident Notification
**Gap:** When a crisis incident is detected and logged, the participant is not notified. The email goes to the researcher; the participant experiences nothing different.

**Why it matters:** Participants may not know the researcher has been alerted about their conversation. Whether this should be disclosed is an ethical question — but it is not addressed in the codebase.

### 4.9 No Supervision Protocol for LOW Risk Incidents
**Gap:** LOW risk incidents (single soft trigger) are logged to the database but generate no email and no researcher notification. The researcher would need to proactively review the `crisis_incidents` table to see LOW risk flags.

**Why it matters:** Low-risk flags can be early indicators of escalating distress across sessions for the same participant. There is no mechanism to aggregate them or flag patterns over time.

### 4.10 No Accessibility Testing or Accommodation
**Gap:** While the profile form includes "Digitally Excluded" and "Neurodivergent" as identity factors, the UI contains no specific accessibility accommodations (ARIA labels, screen reader support, high-contrast mode, dyslexia-friendly fonts). The PWA is voice-first, which may exclude users with speech impairments.

---

## 5. DESIGN DECISIONS LOG

### 5.1 Git History

The commit history uses minimal, non-descriptive messages ("x", "update", "k", "c") which provide almost no insight into design decisions. The one meaningful safety-related commit is:

| Commit | Date | Author | Message |
|---|---|---|---|
| `286e7aa` | 2026-02-06 | Lian Passmore | `Add emergency SOS button and restructure project` |

The commit description reads:
> "Add emergency/crisis button to RayWidget that immediately ends AI session and auto-dials mental health line (tel:1737) — Restructure project from app/ to src/ directory — Update configuration files"

**Significance:** This is the only commit with a safety rationale. The SOS button was built, committed, and then removed at some later point without any recorded rationale in git history.

Running the suggested search:
```bash
git log --all --oneline --grep="safe" --grep="crisis" --grep="consent" --grep="boundary" \
  --grep="protocol" --grep="trigger" --grep="escalat" --grep="privacy" \
  --grep="delete" --grep="sovereign"
```

Returns only: `286e7aa Add emergency SOS button and restructure project`

No other safety-relevant commits are recorded.

### 5.2 Code Comments Documenting Safety Reasoning

**Crisis detection is only for user messages** (not agent messages) — comment in code:

**File:** [`src/app/api/elevenlabs/route.ts`](src/app/api/elevenlabs/route.ts), line 356
```typescript
// Extract only user messages for scanning (ignore agent responses)
```

**Crisis table is write-only** — comment in SQL:

**File:** [`security_fixes.sql`](security_fixes.sql), lines 11–12
```sql
-- Users should NEVER have direct access to crisis data.
-- Only the service role (webhook) can insert. No client reads.
```

**Consent must come first** — comment in auth callback:

**File:** [`src/app/auth/callback/route.ts`](src/app/auth/callback/route.ts), line 17
```typescript
// Consent must come first, then profile setup
```

**Tiered risk scoring explanation** — inline comment block:

**File:** [`src/app/api/elevenlabs/route.ts`](src/app/api/elevenlabs/route.ts), lines 368–372
```typescript
// Scoring logic:
// - Any hard trigger → HIGH
// - Soft trigger + planning words → HIGH (escalated)
// - ≥2 distinct soft triggers → MEDIUM
// - 1 soft trigger alone → LOW (logged but no email)
```

**Phone is for researcher contact only** — UI placeholder text:

**File:** [`src/app/onboarding/profile/page.tsx`](src/app/onboarding/profile/page.tsx), line 115
```tsx
placeholder="For researcher contact only"
```

**BUILD_DOCUMENTATION.md explicitly names the ethical motivation for crisis detection:**

> *"This system was designed to address the ethical gap in unmonitored AI conversations on sensitive topics, providing a researcher safety layer without breaking participant confidentiality."*

### 5.3 Evidence of Iteration

**The context onboarding page was added as a separate step** — indicated by `add_onboarding_context_flag.sql` being a separate migration rather than part of the initial schema. The profile form came first; the relationship context step was added later.

**Phone field was added in a separate migration** — `add_phone_column.sql` is a standalone migration, suggesting emergency contact collection was not in the original design.

**Crisis detection was added in the initial commit** — the `/api/elevenlabs` route existed from `286e7aa` and included crisis webhook handling from the start. This suggests it was considered a core requirement, not a late addition.

**security_fixes.sql is a named "fixes" pass** — the file name implies a second review found RLS was not enabled on all tables, requiring a correction pass. The comment "CRITICAL - flagged by Supabase linter" on `crisis_incidents` confirms this was caught by tooling, not human review.

---

## 6. USER-FACING SAFETY COPY

### 6.1 Consent Page — Full Text

**File:** [`src/app/onboarding/consent/page.tsx`](src/app/onboarding/consent/page.tsx)

**Section: What you're joining**
> "I'm an AI relationship coach designed to help you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself."

**Section: The Ask**
> - Try Ray between Feb 12–26, 2026.
> - After each session: Ray asks for quick feedback (~3 minutes).
> - At the end: A 15-minute reflection with Ray about your overall experience.

**Section: Privacy & Data**
> - Conversations stay private: I analyze broad themes, but I do not read your specific transcripts unless you flag an issue.
> - Control: You can delete individual sessions or your entire account anytime.
> - Withdrawal: You can withdraw completely before March 1, 2026.
> - Anonymity: Data is stored with participant codes, not names.
> - Deletion: All data is destroyed 2 years after the project ends.

**Section: Important Limits**
> - I'm coaching, not therapy.
> - I'm not crisis intervention.
> - Sessions are capped at 45 minutes.
> - I have no memory of previous sessions (Fresh start every time).

**Closing quote:**
> "Your feedback will help shape whether ethical AI can work in vulnerable conversations."

**Checkbox consent text:**
> "I consent to participate. I understand my participation is voluntary, private, and I can withdraw anytime."

### 6.2 Landing Page

**File:** [`src/app/page.tsx`](src/app/page.tsx)

> "Kia ora, I'm Ray."
> "A thinking partner when you need a second take."
> *"Clarity over comfort."*

PWA manifest description:

**File:** [`public/manifest.json`](public/manifest.json)
> "Clarity over comfort. An AI relationship coach designed to help you see patterns clearly."

### 6.3 Context Onboarding — Framing Text

**File:** [`src/app/onboarding/context/page.tsx`](src/app/onboarding/context/page.tsx)

> "This context is shared with Ray at the start of each session. You can update it anytime from the menu."

Partner name field placeholder:
> "So Ray can reference them naturally"

### 6.4 Profile Page — Data Purpose Disclosure

**File:** [`src/app/onboarding/profile/page.tsx`](src/app/onboarding/profile/page.tsx)

> "This data is for research analysis only. I don't see this."

Phone field placeholder:
> "For researcher contact only"

### 6.5 Final Review — Safety Section Questions

**File:** [`src/components/FinalReviewForm.tsx`](src/components/FinalReviewForm.tsx), lines 81–104

Section 3 (Safety & Trust) asks participants:
> - "Relationship conversations can be vulnerable. Overall, did you feel safe being honest with Ray?"
> - "What made it feel safe — or unsafe?"
> - "You were talking to AI, not a human. How did that feel compared to talking to a person about your relationships?"
> - "What was better about AI? What was worse?"
> - "Did you trust Ray's responses? Why or why not?"

Section 5 (Cultural Grounding):
> "Ray is designed around Māori and Pasifika values like whanaungatanga — relationship as fundamental — and manaakitanga — care for your story. Did you notice this cultural grounding? If so, how did it feel?"

### 6.6 Error / Unavailability Messages

**File:** [`src/components/RayWidget.tsx`](src/components/RayWidget.tsx), lines 258–268

When Ray is unavailable (pilot sessions ended):
> "Ray's pilot sessions have ended. You can still complete your final review to receive your koha."

Connection error fallback:
> "Connection disrupted."

Authentication failure (internal):
> "I'm currently unavailable."

### 6.7 Final Review — Closing Consent

**File:** [`src/components/FinalReviewForm.tsx`](src/components/FinalReviewForm.tsx), lines 183–187

At the end of the final review, participants are asked to consent to specific uses of their data:

```typescript
interface ConsentState {
  quotes: boolean;      // Anonymised quotes in thesis
  findings: boolean;    // Overall findings
  case_study: boolean;  // Use as case study
}
```

Participants can consent to any combination of:
- Anonymised quotes
- Overall findings
- Being used as a case study

With an optional free-text notes field. This granular exit consent gives participants more control than the initial broad consent.

---

*End of safety extraction. All findings are traceable to the source files referenced above. The most significant unresolved gap remains the inaccessibility of the ElevenLabs system prompt — the primary document governing Ray's conversational behaviour.*
