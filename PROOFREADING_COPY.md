# Ray Pilot - User-Facing Copy

This document contains all user-facing text from the Ray application for proofreading purposes.

---

## 1. Consent Page (`/onboarding/consent`)

### Headings
- **Main heading:** "Kia ora, welcome to Ray"

### Content Sections

#### What you're joining:
- "Ray is an AI relationship coach designed to help you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself."

#### What I'm asking you to do:
- Try Ray between February 12–26, 2026 (use it whenever suits you)
- After each session: Ray asks for quick feedback (~3 minutes)
- At the end: A 15-minute reflection with Ray about your overall experience

#### Your privacy matters:
- **Your conversations stay private:** I may identify broad themes across all participants, but your specific conversations remain private. I'm the only person with access to transcripts.
- **You're in control:** Delete individual sessions or your entire account anytime during the pilot
- **Withdraw anytime:** You can withdraw from the research completely before March 1, 2026
- **Data is anonymised:** Participant codes only, no names
- **Everything is deleted:** 2 years after the project ends

#### Important:
- Ray is coaching, not therapy or mental health treatment
- Ray is not crisis intervention
- Sessions are capped at 1 hour
- Each session starts fresh—Ray has no memory of previous conversations

#### Closing
- "Your feedback will help shape whether ethical AI can work in vulnerable conversations."

### Consent Checkbox
- "I consent to participate in this pilot. I understand my participation is voluntary, my conversations remain private, and I can withdraw at any time before March 1, 2026."

### Button
- "Continue"

---

## 2. Login Page (`/login`)

### Headings
- **Main heading:** "Nau mai."
- **Subheading (OTP mode):** "Create account or sign in with Ray."
- **Subheading (Password mode):** "Sign in to connect with Ray."

### Form Fields
- **Email placeholder:** "Email address"
- **Password placeholder:** "Password"
- **OTP code placeholder:** "Enter your code"

### Buttons
- **OTP Send (loading):** "Sending code..."
- **OTP Send (default):** "Continue with Email"
- **Password Login (loading):** "Signing in..."
- **Password Login (default):** "Sign In"
- **OTP Verify (loading):** "Verifying..."
- **OTP Verify (default):** "Verify Code"

### Toggle Links
- "Already have a password? Sign in here"
- "New user or forgot password? Use email code"
- "Use a different email"

### Info Text
- "New users will be prompted to create a password after verifying their email."
- "Code sent to **{email}**" _(dynamic)_

### Messages
- **Success:** "Check your email for your one-time code!"
- **Error (password):** "Invalid email or password."
- **Error (OTP send):** "Something went wrong. Try again."
- **Error (OTP verify):** "Invalid code. Please try again."

---

## 3. Setup Password Page (`/setup-password`)

### Headings
- **Main heading:** "Set Your Password"
- **Subheading:** "Create a password to secure your account. You can always use a one-time code if you forget it."

### Form Fields
- **Password placeholder:** "Password (min. 8 characters)"
- **Confirm password placeholder:** "Confirm password"

### Buttons
- **Submit (loading):** "Setting password..."
- **Submit (default):** "Continue"

### Messages
- **Error (mismatch):** "Passwords do not match."
- **Error (too short):** "Password must be at least 8 characters."
- **Error (general):** "Failed to set password. Please try again."

---

## 4. Onboarding Profile Page (`/onboarding/profile`)

### Headings
- **Main heading:** "A little more about you"
- **Subheading:** "These questions help me identify patterns across all participants for research purposes. Ray won't use this information in your conversations—each session starts fresh with no memory of you."

### Form Labels & Placeholders
- **Name field label:** "What should Ray call you?"
- **Name placeholder:** "Your name"
- **Age field label:** "Age Range _(Optional)_"
- **Age placeholder:** "Select age..."
- **Location field label:** "Where do you live? _(Optional)_"
- **Location placeholder:** "Select location..."
- **Ethnicity label:** "Cultural Identity (Select all that apply)"
- **Identity factors label:** "Identity Factors (Select all that apply)"

### Age Range Options
- 18-24
- 25-34
- 35-44
- 45-54
- 55-64
- 65+

### Location Options
- Northland
- Auckland
- Waikato
- Wellington
- Christchurch
- Dunedin
- Other NZ
- International

### Cultural Identity Options
- European / Pākehā
- Māori
- Indian
- Chinese
- Filipino
- Samoan
- Tongan
- Cook Islands Māori
- Niuean
- Fijian
- Sri Lankan
- MELAA
- British
- Irish
- South African
- Korean
- Bangladesh
- Japanese
- Dutch
- Australian
- Other Asian
- Other European
- Other Pacific Peoples
- Prefer not to say

### Identity Factors Options
- Digitally Excluded
- Disabled/Tāngata Whaikaha
- Neurodivergent/Kanorau ā-roro
- None of these apply
- Other

### Buttons
- **Submit (loading):** "Saving..."
- **Submit (default):** "Meet Ray"

### Error Messages
- "Failed to save profile: {error.message}" _(dynamic)_
- "An error occurred. Please try again."

---

## 5. Dashboard Page (`/dashboard`)

### Header
- **Brand title:** "RAY"
- **Greeting:** "Kia ora, **{firstName}**" _(dynamic)_
- **Pilot status (before start):** "Starts in: {days}d {hours}h" _(dynamic)_
- **Pilot status (active):** "Pilot Active"
- **Pilot status (closed):** "Pilot Closed"

### Footer
- "Need immediate support?"
- "Call or Text 1737 (24/7)"

### Settings Menu

#### Section 1: About Ray
- **Header:** "About Ray"
- **Content (paragraph 1):** "Ray is an AI relationship coach—like a thinking partner helping you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself."
- **Content (paragraph 2):** "Your conversations are private. Each session starts fresh—Ray has no memory of previous sessions."
- **Content (paragraph 3):** "Ray is coaching, not therapy. Ray can't treat mental health conditions or provide crisis intervention."

#### Section 2: Support
- **Header:** "Support"
- Mental Health (1737) — "Call"
- Lifeline — "0800 543 354"
- Women's Refuge — "0800 733 843"
- Emergency — "111"

#### Section 3: Researcher Contact
- **Header:** "Researcher Contact"
- **Name:** Lian Passmore
- **Email:** lianpassmore@gmail.com
- **Phone:** 027 566 8803

#### Sign Out
- "Sign Out" _(button with icon)_

---

## 6. Ray Widget Component (`RayWidget.tsx`)

### Status Text (Voice Mode)
- "Connecting..."
- "Listening"
- "Ray is speaking"
- "Ready to start"

### Text Chat
- **Empty state:** "Start chatting with Ray..."

### Buttons
- **Start conversation:** "Talk to Ray"
- **Start conversation (loading):** "Connecting..."
- **Mute button aria-label:** "Mute" / "Unmute"
- **Mode toggle title (voice → text):** "Switch to text mode"
- **Mode toggle title (text → voice):** "Switch to voice mode"

### Grounding & Disclaimer
- "Feet on the floor. Take a breath."
- "Ray is an AI coach, not a therapist."
- "Each session starts fresh—Ray has no memory of previous conversations."

### Text Input
- **Placeholder:** "Type your message..."

---

## 7. Header Icons Component (`HeaderIcons.tsx`)

### Accessibility Labels
- **Info button (lightbulb icon):** "About & Support"

---

## Notes
- All clickable phone numbers use `tel:` protocol for mobile dialing
- All form validation messages appear in red/destructive color
- Success messages appear in green/forest-green color
- Dynamic content is marked with _{dynamic}_ and uses actual user data
