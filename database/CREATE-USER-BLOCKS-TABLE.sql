/**
 * Create user_blocks table for user blocking functionality
 * Required for App Store Review Guideline 1.2 - User-Generated Content
 */

-- 1. Create user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can't block the same user twice
  UNIQUE(blocker_id, blocked_id),
  
  -- Ensure a user can't block themselves
  CHECK (blocker_id != blocked_id)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_created_at ON public.user_blocks(created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Users can see their own blocks
DROP POLICY IF EXISTS "user_blocks_select_own" ON public.user_blocks;
CREATE POLICY "user_blocks_select_own"
  ON public.user_blocks
  FOR SELECT
  USING (auth.uid() = blocker_id);

-- Users can create blocks
DROP POLICY IF EXISTS "user_blocks_insert_own" ON public.user_blocks;
CREATE POLICY "user_blocks_insert_own"
  ON public.user_blocks
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
DROP POLICY IF EXISTS "user_blocks_delete_own" ON public.user_blocks;
CREATE POLICY "user_blocks_delete_own"
  ON public.user_blocks
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- Admins can see all blocks
DROP POLICY IF EXISTS "user_blocks_admin_all" ON public.user_blocks;
CREATE POLICY "user_blocks_admin_all"
  ON public.user_blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 5. Grant permissions
GRANT SELECT, INSERT, DELETE ON public.user_blocks TO authenticated;
GRANT ALL ON public.user_blocks TO service_role;

-- 6. Add comments
COMMENT ON TABLE public.user_blocks IS 'Users blocking other users - Required for App Store Review Guideline 1.2';
COMMENT ON COLUMN public.user_blocks.blocker_id IS 'User who is blocking';
COMMENT ON COLUMN public.user_blocks.blocked_id IS 'User who is being blocked';

-- 7. Verify table creation
SELECT 
  'user_blocks table created successfully' AS status,
  COUNT(*) AS row_count
FROM public.user_blocks;

