# Ray Pilot - User-Facing Copy (v2)

This document contains all user-facing text from the Ray application for proofreading purposes.
Updated: 8 Feb 2026

---

## 1. Landing Page (`/`)

### Heading
- "Kia ora, I'm Ray."

### Tagline
- "Clarity over comfort."

### Body
- "I'm an AI relationship coach designed to help you see patterns clearly. Not a therapist. Just a wise mate on the back porch."

### Button
- "Sign In"

### Caption
- "Research Pilot • Feb 12-26"

---

## 2. Login Page (`/login`)

### Headings
- **Main heading:** "Nau mai."
- **Subheading (OTP mode):** "Create account or sign in with Ray."
- **Subheading (Password mode):** "Sign in to connect with Ray."

### Google Sign-In
- **Default:** "CONTINUE WITH GOOGLE"
- **Loading:** "Connecting..."

### Divider
- "Or"

### OTP Flow
- **Email placeholder:** "Email address"
- **Helper text:** "New users will be prompted to create a password after verifying their email."
- **Send button (default):** "Continue with Email"
- **Send button (loading):** "Sending code..."
- **Code sent confirmation:** "Code sent to **{email}**" _(dynamic)_
- **Code placeholder:** "000000"
- **Verify button (default):** "Verify Code"
- **Verify button (loading):** "Verifying..."
- **Change email link:** "Use a different email"

### Password Flow
- **Email placeholder:** "Email address"
- **Password placeholder:** "Password"
- **Login button (default):** "Sign In"
- **Login button (loading):** "Signing in..."

### Toggle Links
- "Already have a password? Sign in here"
- "New user? Use email code"

### Messages
- **Success:** "Check your email for your one-time code!"
- **Error (Google):** "Failed to sign in with Google. Try again."
- **Error (password):** "Invalid email or password."
- **Error (OTP send):** "Something went wrong. Try again."
- **Error (OTP verify):** "Invalid code. Please try again."

---

## 3. Setup Password Page (`/setup-password`)

### Headings
- **Main heading:** "Secure account."
- **Subheading:** "Create a password for easier access next time. You can always use a one-time code if you forget it."

### Form Fields
- **Password placeholder:** "Password (min. 8 chars)"
- **Confirm password placeholder:** "Confirm password"

### Buttons
- **Submit (default):** "Continue"
- **Submit (loading):** "Saving..."

### Messages
- **Error (mismatch):** "Passwords do not match."
- **Error (too short):** "Password must be at least 8 characters."
- **Error (general):** "Failed to set password. Please try again."

---

## 4. Consent Page (`/onboarding/consent`)

### Header
- **Label:** "Research Pilot"
- **Main heading:** "Kia ora."
- **Subheading:** "Before we begin, we need to agree on how this works."

### Content Sections

#### What you're joining
- "Ray is an AI relationship coach designed to help you see patterns in any relationship: romantic, family, friendships, work, or even the one you have with yourself."

#### The Ask
- "Try Ray between **Feb 12–26, 2026**."
- "After each session: Ray asks for quick feedback (~3 minutes)."
- "At the end: A 15-minute reflection with Ray about your overall experience."

#### Privacy & Data
- "**Conversations stay private:** I analyze broad themes, but I do not read your specific transcripts unless you flag an issue."
- "**Control:** You can delete individual sessions or your entire account anytime."
- "**Withdrawal:** You can withdraw completely before March 1, 2026."
- "**Anonymity:** Data is stored with participant codes, not names."
- "**Deletion:** All data is destroyed 2 years after the project ends."

#### Important Limits
- "Ray is coaching, not therapy."
- "Ray is not crisis intervention."
- "Sessions are capped at 1 hour."
- "Ray has no memory of previous sessions (Fresh start every time)."

### Closing Quote
- "Your feedback will help shape whether ethical AI can work in vulnerable conversations."

### Consent Checkbox
- "I consent to participate. I understand my participation is voluntary, private, and I can withdraw anytime."

### Button
- "Begin"

---

## 5. Profile Page (`/onboarding/profile`)

### Headings
- **Main heading:** "About you."
- **Subheading:** "This data is for research analysis only. Ray does not see this."

### Form Fields

#### Section 1: Basics
- **Name label:** "What should Ray call you?"
- **Name placeholder:** "Name"
- **Phone label:** "Phone (Optional)"
- **Phone placeholder:** "For researcher contact only"

#### Section 2: Demographics
- **Age Range label:** "Age Range"
- **Age placeholder:** "Select..."
- **Age options:** 18-24, 25-34, 35-44, 45-54, 55-64, 65+
- **Location label:** "Location"
- **Location placeholder:** "Select..."
- **Location options:** Northland, Auckland, Wellington, Christchurch, Other NZ, International

#### Section 3: Cultural Identity
- **Label:** "Cultural Identity"
- **Options:** European / Pākehā, Māori, Indian, Chinese, Filipino, Samoan, Tongan, Cook Islands Māori, Niuean, Fijian, Sri Lankan, MELAA, British, Irish, South African, Korean, Bangladesh, Japanese, Dutch, Australian, Other Asian, Other European, Other Pacific Peoples, Prefer not to say

#### Section 4: Identity Factors
- **Label:** "Identity Factors"
- **Options:** Digitally Excluded, Disabled/Tāngata Whaikaha, Neurodivergent/Kanorau ā-roro, None of these apply, Other

### Buttons
- **Submit (default):** "Meet Ray"
- **Submit (loading):** "Saving..."

### Error Messages
- "Failed to save profile: {error.message}" _(dynamic)_
- "An error occurred. Please try again."

---

## 6. Dashboard Page (`/dashboard`)

### Header
- **Brand title:** "RAY"

### Greeting
- "Kia ora, {firstName}." _(dynamic, uses first name only)_

### Pilot Status _(dynamic)_
- "Starts in: {days}d {hours}h"
- "Pilot Active"
- "Pilot Closed"

### Footer
- "Clarity over comfort"

### Loading State
- "Initializing"

---

## 7. Dashboard Slide-Out Menu

### Menu Header
- "Menu"

### Block 1: About Ray
- **Heading:** "About Ray"
- **Body:** "Ray is a thinking partner. Not a therapist. Not a cheerleader. Conversations are private and start fresh every time."

### Block 2: Crisis Support
- **Heading:** "Crisis Support"
- Mental Health (1737) — [Call]
- Women's Refuge — [Call] _(0800 733 843)_
- Emergency (111) — [Call]

### Block 3: Researcher
- **Label:** "Researcher"
- **Name:** Lian Passmore
- **Email:** lianpassmore@gmail.com
- **Phone:** 027 566 8803

### Footer
- "Sign Out"

---

## 8. Ray Widget (`RayWidget.tsx`)

### Status Text
- **Connecting:** "Grounding..."
- **Connected (listening):** "Ray is listening"
- **Connected (speaking):** "Ray is speaking"
- **Disconnected:** "Tap to begin"
- **Error:** "Connection disrupted." / "Ray is currently unavailable."

### Text Chat Mode
- **Header:** "Text Mode"
- **Empty state:** "Start typing to Ray..."
- **Input placeholder:** "Type your message..."

### Buttons
- **Start session:** "Begin Session"
- **Mute title:** "Mute" / "Unmute"
- **Text mode title:** "Switch to Text"
- **End session title:** "End Session"

### Footer Note (Idle)
- "Each Session Starts Fresh"

---

## 9. Header Icons (`HeaderIcons.tsx`)

### Accessibility
- **Menu button aria-label:** "Open Menu"

---

## 10. Root Layout (`layout.tsx`)

### Metadata
- **Title:** "Ray - AI Relationship Coach"
- **Description:** "Clarity over comfort. An AI relationship coach designed to help you see patterns clearly."

---

## Notes
- All clickable phone numbers use `tel:` protocol for mobile dialing
- Form validation messages appear in destructive/red styling
- Success messages appear in forest-green styling
- Dynamic content is marked with _{dynamic}_
- All user flows now enforce consent before profile setup and dashboard access
