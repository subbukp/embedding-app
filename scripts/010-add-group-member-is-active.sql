-- Add is_active column to group_members table to track pending vs active memberships
-- When a user is invited with a group, they get an inactive membership
-- When they accept the invite and log in, the membership is activated

ALTER TABLE group_members ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Create index for faster queries filtering by is_active
CREATE INDEX IF NOT EXISTS idx_group_members_is_active ON group_members(is_active);
