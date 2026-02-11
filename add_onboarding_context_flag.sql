-- Track whether the user completed the "Help Ray know you" onboarding step
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_context_completed boolean DEFAULT false;
