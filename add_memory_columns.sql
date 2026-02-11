-- Add personal context / memory fields to profiles
-- These are passed to Ray at session start so he has context about the user

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_status text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partner_name text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS children_info text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS occupation text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS living_situation text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS additional_context text;
