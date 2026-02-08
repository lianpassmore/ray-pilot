-- ============================================================
-- SECURITY FIXES: Enable RLS + Policies for all tables
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================
-- 1. crisis_incidents (CRITICAL - flagged by Supabase linter)
-- ============================
ALTER TABLE crisis_incidents ENABLE ROW LEVEL SECURITY;

-- Users should NEVER have direct access to crisis data.
-- Only the service role (webhook) can insert. No client reads.
CREATE POLICY "Service role only - no client access"
  ON crisis_incidents
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================
-- 2. conversations
-- ============================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can only view their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================
-- 3. feedback
-- ============================
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
