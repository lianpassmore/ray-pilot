# Ray Pilot — Build Documentation

**Project:** Ray — AI Relationship Coaching Pilot
**Context:** Master's Research Pilot, New Zealand
**Pilot Period:** February 12–26, 2026
**Prepared:** March 2026

---

## 1. Project Overview

Ray is a web-based AI relationship coaching application built as a research pilot to investigate whether ethical AI can function as a thinking partner in vulnerable, emotionally significant conversations. The pilot ran for two weeks with a closed group of New Zealand participants.

The core research question centres on whether a voice-first, AI-driven coaching interface can help users identify patterns in their relationships — romantic, familial, professional, or otherwise — while maintaining appropriate safety guardrails and ethical data practices.

The application is named **Ray** and operates under the philosophy: *"Clarity over comfort."*

---

## 2. System Architecture

Ray is a full-stack web application using the following architecture:

```
Browser Client (Next.js / React)
        │
        ├── Auth Layer (Supabase Auth)
        │
        ├── API Routes (Next.js Server)
        │       ├── /api/elevenlabs     — conversation session management + crisis webhook
        │       ├── /api/feedback       — session-level feedback ingestion
        │       ├── /api/final-review   — end-of-pilot survey submission
        │       └── /api/updates        — pilot announcement content
        │
        ├── Database (Supabase / PostgreSQL)
        │       ├── profiles            — participant demographics and identity data
        │       ├── conversations       — session metadata and device info
        │       ├── feedback            — per-session participant ratings
        │       └── crisis_incidents    — flagged safety events with risk classification
        │
        └── External Services
                ├── ElevenLabs ConversationalAI  — voice and text conversation agent
                ├── Resend                        — transactional email (crisis alerts)
                └── Google OAuth                  — social authentication
```

---

## 3. Tech Stack

### Frontend
| Technology | Version | Role |
|---|---|---|
| Next.js | 16.1.6 | Full-stack React framework (App Router) |
| React | 19.2.3 | UI component library |
| TypeScript | 5 | Static typing |
| Tailwind CSS | 4 | Utility-first styling |
| Framer Motion | 12.33.0 | Animations and transitions |
| Lucide React | 0.563.0 | Icon library |

### Backend & Services
| Technology | Role |
|---|---|
| Supabase | PostgreSQL database, authentication, Row-Level Security (RLS) |
| ElevenLabs ConversationalAI API | AI voice and text conversation agent |
| Resend | Email delivery for crisis notifications |
| Google OAuth | Social sign-in |
| Node.js / Next.js API Routes | Server-side logic and webhook handling |

### Development Tools
| Tool | Role |
|---|---|
| ESLint 9 | Code linting |
| PostCSS | CSS processing |
| `node-fetch` | HTTP requests in scripts |

---

## 4. Repository Structure

```
ray-pilot/
├── src/
│   ├── app/
│   │   ├── page.tsx                      # Landing page with animated intro
│   │   ├── layout.tsx                    # Root layout, global metadata
│   │   ├── login/page.tsx                # Auth (Google OAuth, email OTP, password)
│   │   ├── onboarding/
│   │   │   ├── consent/page.tsx          # Informed consent agreement
│   │   │   ├── context/page.tsx          # Relationship context collection
│   │   │   └── profile/page.tsx          # Demographic and identity data
│   │   ├── dashboard/page.tsx            # Redirects to final-review
│   │   ├── final-review/page.tsx         # End-of-pilot feedback survey
│   │   ├── setup-password/page.tsx       # Password creation after OTP
│   │   ├── auth/callback/route.ts        # OAuth callback handler
│   │   └── api/
│   │       ├── elevenlabs/route.ts       # Core: session management + crisis detection
│   │       ├── feedback/route.ts         # Feedback submission endpoint
│   │       ├── final-review/route.ts     # Final survey submission
│   │       └── updates/route.ts          # Pilot update announcements
│   ├── components/
│   │   ├── RayWidget.tsx                 # Primary conversation UI (voice + text)
│   │   ├── AnimatedRayCircle.tsx         # Visual pulse indicator for voice mode
│   │   ├── FinalReviewForm.tsx           # Multi-section end-of-pilot survey form
│   │   ├── FeedbackForm.tsx              # Post-session feedback form
│   │   ├── MyContextForm.tsx             # Relationship context form
│   │   ├── HeaderIcons.tsx               # Navigation icons
│   │   ├── PilotUpdateBanner.tsx         # In-app announcement banner
│   │   ├── AddToHomeScreen.tsx           # Progressive Web App install prompt
│   │   └── TimeMeter.tsx                 # Session duration indicator
│   ├── lib/
│   │   ├── supabase.ts                   # Client-side Supabase initialisation
│   │   └── supabase-server.ts            # Server-side Supabase (service role)
│   └── middleware.ts                     # Session refresh on every request
├── public/
│   ├── manifest.json                     # PWA manifest
│   └── [icons]                           # App icons for home screen install
├── SQL Migration Scripts
│   ├── supabase_setup.sql                # Initial schema and RLS policies
│   ├── security_fixes.sql                # RLS enforcement pass
│   ├── add_phone_column.sql              # Phone field for participant contact
│   ├── add_onboarding_context_flag.sql   # Onboarding completion tracking
│   └── add_memory_columns.sql            # Session memory storage columns
├── export-transcripts.mjs                # CLI utility: bulk transcript export
├── next.config.ts                        # Next.js configuration
├── tsconfig.json                         # TypeScript configuration
├── tailwind.config.ts                    # Tailwind theme
├── postcss.config.mjs                    # PostCSS plugins
├── eslint.config.mjs                     # ESLint rules
├── .env.local                            # Environment variables (not in version control)
└── package.json                          # Dependencies and scripts
```

---

## 5. Database Schema

All tables are hosted in Supabase (PostgreSQL) with Row-Level Security (RLS) enforced.

### `profiles`
Stores participant identity and demographic data collected during onboarding.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Foreign key → `auth.users.id` |
| name | text | Participant name |
| phone | text | Contact phone number |
| ethnicity | text | Self-identified ethnicity |
| identity_factors | text[] | Multi-select identity descriptors |
| location | text | NZ region |
| consent_given | boolean | Explicit consent tracking |
| onboarding_complete | boolean | Flags completion of context step |
| created_at | timestamp | Account creation time |

### `conversations`
Logs metadata for each conversation session.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| user_id | uuid | Foreign key → `auth.users.id` |
| device_type | text | mobile / desktop |
| browser | text | Browser identifier |
| session_duration | integer | Seconds |
| status | text | active / completed |
| started_at | timestamp | Session start |
| ended_at | timestamp | Session end |

### `feedback`
Captures per-session participant ratings after each conversation.

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| conversation_id | uuid | Links to session |
| user_id | uuid | Participant |
| helpful_rating | integer | 1–5 scale |
| safety_rating | integer | 1–5 scale |
| insight_rating | integer | 1–5 scale |
| comments | text | Open-ended response |
| created_at | timestamp | Submission time |

### `crisis_incidents`
Write-only log of flagged safety events (never readable by client-side code).

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| conversation_id | text | ElevenLabs conversation ID |
| risk_level | text | low / medium / high |
| matched_triggers | text[] | Keywords that triggered detection |
| reasoning | text | Analyst reasoning summary |
| transcript_excerpt | text | Relevant portion of conversation |
| notified_at | timestamp | When email alert was sent |
| created_at | timestamp | Incident log time |

**RLS Policies:**
- Users can only read and modify their own `profiles`, `conversations`, and `feedback` rows.
- `crisis_incidents` are insert-only via the server-side webhook handler; no client reads permitted.

---

## 6. Key Features

### 6.1 Authentication and Onboarding

Participants access Ray through a multi-step entry flow:

1. **Login** — Google OAuth, email OTP (magic link), or username/password.
2. **Consent** — Explicit informed consent agreement with withdrawal terms.
3. **Profile** — Demographics, location, identity factors.
4. **Relationship Context** — Free-form description of the relationship(s) the participant wants to explore with Ray. This is passed to the AI agent as a dynamic variable at session start to personalise the conversation.

### 6.2 Conversation Interface (RayWidget)

The core UI is a single component (`RayWidget.tsx`) that supports two conversation modes:

**Voice Mode:**
- Connects to the ElevenLabs ConversationalAI API via a signed URL fetched server-side.
- Participant relationship context is injected as a dynamic variable at session initialisation.
- Animated visual indicator (`AnimatedRayCircle`) pulses during AI speech.
- Push-to-talk controls with mute toggle.
- Session duration tracked via `TimeMeter`.

**Text Mode:**
- Chat interface with message history.
- Same ElevenLabs agent backend, accessed in text input mode.
- Mode can be toggled mid-session.

Both modes display real-time connection status and include an explicit "End session" control.

### 6.3 Crisis Detection System

A core research and safety component. The ElevenLabs webhook delivers conversation events to `/api/elevenlabs`. The webhook handler:

1. **Verifies** the ElevenLabs signature to confirm authenticity.
2. **Analyses** transcript text against a tiered trigger system:
   - *Hard triggers* (explicit statements of intent): immediately classified as **HIGH** risk.
   - *Soft triggers* (indirect language) combined with planning words: escalated to **HIGH**.
   - Multiple soft triggers without planning words: **MEDIUM** risk.
   - No triggers: **LOW** risk, no action taken.
3. **Persists** the incident to the `crisis_incidents` table with full context.
4. **Notifies** the researcher by email (via Resend) with a formatted HTML alert including risk level, matched triggers, reasoning, and transcript excerpt.

This system was designed to address the ethical gap in unmonitored AI conversations on sensitive topics, providing a researcher safety layer without breaking participant confidentiality.

### 6.4 Feedback Collection

**Session Feedback (`FeedbackForm`):**
After each conversation, participants rate the session across three dimensions:
- How helpful was Ray?
- Did you feel safe?
- Did Ray help you gain insight?

Plus an open-ended comments field.

**End-of-Pilot Survey (`FinalReviewForm`):**
A multi-section qualitative and quantitative survey covering:
- Overall experience and usage patterns
- Perceived impact and behaviour change
- Safety and trust perceptions
- Comparison of Ray to a human coach
- Demographic factors and AI relationship
- Final satisfaction and likelihood to return

### 6.5 Transcript Export Utility

`export-transcripts.mjs` is a Node.js CLI script for researcher use. It:
- Paginates through all conversations for the Ray ElevenLabs agent (100 per page).
- Extracts full transcripts with speaker labels and timestamps.
- Writes consolidated output to `ray-transcripts.txt` for qualitative analysis.

Run with:
```bash
node export-transcripts.mjs
```

### 6.6 Progressive Web App (PWA)

The application includes a `manifest.json` and an `AddToHomeScreen` prompt component, allowing participants on mobile to install Ray as a home screen app — removing browser chrome and providing a more app-like experience suited to private, personal conversations.

---

## 7. Environment Configuration

The application requires a `.env.local` file (not committed to version control) containing the following variables:

```bash
# ElevenLabs
ELEVENLABS_API_KEY=           # API key for ElevenLabs
ELEVENLABS_AGENT_ID=          # Specific agent ID for Ray
ELEVENLABS_WEBHOOK_SECRET=    # Shared secret for webhook signature verification

# Supabase
NEXT_PUBLIC_SUPABASE_URL=     # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Public anon key (safe for client-side)
SUPABASE_SERVICE_ROLE_KEY=    # Service role key (server-side only)

# Resend (email)
RESEND_API_KEY=               # API key for transactional email
RESEND_FROM_EMAIL=            # Sender address

# Researcher contact
RESEARCHER_EMAIL=             # Destination for crisis alerts
RESEARCHER_PHONE=             # Displayed in-app as emergency contact

# Anthropic (configured but not used as primary agent)
ANTHROPIC_API_KEY=
```

---

## 8. Build and Run Instructions

### Prerequisites

- Node.js 18+ and npm
- A Supabase project with the schema applied (see SQL scripts below)
- ElevenLabs account with a configured ConversationalAI agent
- Resend account for email delivery
- Google Cloud project with OAuth credentials

### Database Setup

Apply the SQL scripts to your Supabase project in this order:

```bash
1. supabase_setup.sql          # Create tables and initial RLS policies
2. security_fixes.sql          # Enable RLS on all tables
3. add_phone_column.sql        # Add phone to profiles
4. add_onboarding_context_flag.sql  # Add onboarding completion flag
5. add_memory_columns.sql      # Add session memory columns
```

### Application Setup

```bash
# Clone the repository
git clone <repository-url>
cd ray-pilot

# Install dependencies
npm install

# Configure environment (copy and populate)
cp .env.local.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
# Application available at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start

# Lint codebase
npm run lint
```

### Exporting Research Data

```bash
# Export all conversation transcripts from ElevenLabs
node export-transcripts.mjs
# Output written to: ray-transcripts.txt
```

---

## 9. Data Flow: A Session from Start to Finish

```
1. Participant logs in (Google / OTP / password)
         │
2. Onboarding: consent → profile → relationship context
         │
3. Participant opens Ray conversation
         │
4. Browser requests signed ElevenLabs URL from /api/elevenlabs
   → Server injects relationship context as dynamic variable
         │
5. ElevenLabs WebSocket connection established in browser
         │
6. Voice or text conversation begins
         │
7. ElevenLabs webhook fires events to /api/elevenlabs as conversation proceeds
   → Server verifies signature
   → Server analyses transcript for crisis triggers
   → If triggered: logs incident, sends email to researcher
         │
8. Participant ends session → session metadata saved to conversations table
         │
9. Post-session feedback form presented
         │
10. At pilot end: Final Review survey presented and submitted
         │
11. Researcher exports transcripts via CLI for qualitative analysis
```

---

## 10. Security and Ethics Considerations

### Data Minimisation
- Participant codes are used; names are collected only for personalised interaction and are not surfaced in research outputs.
- Transcripts are stored by ElevenLabs and retrieved only by the researcher.
- All data is scheduled for deletion two years after project completion.

### Access Control
- Row-Level Security ensures participants cannot access other participants' data.
- The service role key is used only server-side and is never exposed to the browser.
- Crisis incident data is write-only for the webhook; no client code can read it.

### Webhook Security
- ElevenLabs webhooks are verified using HMAC signature validation before any processing occurs.
- Invalid signatures are rejected with a 401 response.

### Informed Consent
- Explicit consent is required before any data collection begins.
- Participants are told clearly: Ray is coaching, not therapy; sessions are not crisis intervention.
- Withdrawal is available until March 1, 2026, with full data deletion on request.

### Researcher Safety Layer
- The crisis detection system exists specifically to bridge the ethical gap in unsupervised AI conversations on sensitive relationship topics.
- The researcher receives real-time alerts without needing to monitor transcripts continuously.

---

## 11. Known Limitations

- **No persistent memory across sessions:** Each conversation starts fresh. This was a deliberate design choice for the pilot but limits longitudinal coaching continuity.
- **ElevenLabs dependency:** Core conversation functionality is tightly coupled to ElevenLabs. Any API changes, outages, or cost increases directly affect the application.
- **Crisis detection heuristics:** The trigger system is keyword and pattern based, not semantically deep. It may produce false positives and could miss nuanced expressions of distress.
- **New Zealand geographic scope:** Location selects, timezone handling, and cultural greetings (Kia ora, Nau mai) are specific to the NZ context.
- **Pilot-only build:** Features like account deletion, data export for participants, and full withdrawal mechanics are noted in consent copy but may require additional development.

---

## 12. Dependencies (from package.json)

```json
{
  "dependencies": {
    "@elevenlabs/client": "latest",
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest",
    "framer-motion": "^12.33.0",
    "lucide-react": "^0.563.0",
    "next": "^16.1.6",
    "node-fetch": "^3.3.2",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "resend": "latest"
  },
  "devDependencies": {
    "@eslint/eslintrc": "latest",
    "@types/node": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "eslint": "^9",
    "eslint-config-next": "latest",
    "postcss": "latest",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 13. Deployment

The application is built for deployment on Vercel (the natural target for Next.js App Router projects), though it can be deployed to any Node.js-compatible hosting provider.

**Recommended Vercel deployment:**
1. Connect the GitHub repository to a Vercel project.
2. Add all environment variables from `.env.local` to the Vercel project settings.
3. Vercel automatically runs `npm run build` on each push to `main`.
4. Edge middleware handles session refresh on every request.

**Webhook configuration:**
After deployment, configure the ElevenLabs webhook endpoint to point to:
`https://<your-domain>/api/elevenlabs`

---

*This documentation was prepared in March 2026 as part of Master's research on ethical AI in relationship coaching contexts.*
