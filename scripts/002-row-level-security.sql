-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is group admin of a specific group
CREATE OR REPLACE FUNCTION is_group_admin(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = auth.uid() 
    AND group_id = group_uuid 
    AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is member of a group
CREATE OR REPLACE FUNCTION is_group_member(group_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = auth.uid() AND group_id = group_uuid
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to get user's groups
CREATE OR REPLACE FUNCTION get_user_groups()
RETURNS SETOF UUID AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ============= PROFILES RLS POLICIES =============

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_super_admin());

-- Group admins can view profiles in their groups
CREATE POLICY "Group admins can view their group members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm1.is_admin = TRUE
      AND gm2.user_id = profiles.id
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

-- Super admins can update all profiles
CREATE POLICY "Super admins can update all profiles"
  ON profiles FOR UPDATE
  USING (is_super_admin());

-- Group admins can update profiles in their groups (except role changes)
CREATE POLICY "Group admins can update their group members"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      INNER JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = auth.uid() 
      AND gm1.is_admin = TRUE
      AND gm2.user_id = profiles.id
    )
  );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Super admins can delete profiles
CREATE POLICY "Super admins can delete profiles"
  ON profiles FOR DELETE
  USING (is_super_admin());

-- ============= GROUPS RLS POLICIES =============

-- Super admins can do everything with groups
CREATE POLICY "Super admins can view all groups"
  ON groups FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super admins can create groups"
  ON groups FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update groups"
  ON groups FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "Super admins can delete groups"
  ON groups FOR DELETE
  USING (is_super_admin());

-- Group admins can view and update their groups
CREATE POLICY "Group admins can view their groups"
  ON groups FOR SELECT
  USING (is_group_admin(id));

CREATE POLICY "Group admins can update their groups"
  ON groups FOR UPDATE
  USING (is_group_admin(id));

-- Group members can view their groups
CREATE POLICY "Group members can view their groups"
  ON groups FOR SELECT
  USING (is_group_member(id));

-- ============= GROUP_MEMBERS RLS POLICIES =============

-- Super admins can manage all group members
CREATE POLICY "Super admins can view all group members"
  ON group_members FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super admins can add group members"
  ON group_members FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update group members"
  ON group_members FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "Super admins can remove group members"
  ON group_members FOR DELETE
  USING (is_super_admin());

-- Group admins can manage members in their groups
CREATE POLICY "Group admins can view their group members"
  ON group_members FOR SELECT
  USING (is_group_admin(group_id));

CREATE POLICY "Group admins can add members to their groups"
  ON group_members FOR INSERT
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "Group admins can update their group members"
  ON group_members FOR UPDATE
  USING (is_group_admin(group_id));

CREATE POLICY "Group admins can remove their group members"
  ON group_members FOR DELETE
  USING (is_group_admin(group_id));

-- Users can view their own group memberships
CREATE POLICY "Users can view own group memberships"
  ON group_members FOR SELECT
  USING (user_id = auth.uid());

-- ============= DASHBOARDS RLS POLICIES =============

-- Super admins can manage all dashboards
CREATE POLICY "Super admins can view all dashboards"
  ON dashboards FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super admins can create dashboards"
  ON dashboards FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update dashboards"
  ON dashboards FOR UPDATE
  USING (is_super_admin());

CREATE POLICY "Super admins can delete dashboards"
  ON dashboards FOR DELETE
  USING (is_super_admin());

-- Group admins can manage dashboards in their groups
CREATE POLICY "Group admins can view their group dashboards"
  ON dashboards FOR SELECT
  USING (is_group_admin(group_id));

CREATE POLICY "Group admins can create dashboards in their groups"
  ON dashboards FOR INSERT
  WITH CHECK (is_group_admin(group_id));

CREATE POLICY "Group admins can update their group dashboards"
  ON dashboards FOR UPDATE
  USING (is_group_admin(group_id));

CREATE POLICY "Group admins can delete their group dashboards"
  ON dashboards FOR DELETE
  USING (is_group_admin(group_id));

-- Group members can view their group dashboards
CREATE POLICY "Group members can view their group dashboards"
  ON dashboards FOR SELECT
  USING (is_group_member(group_id));

-- ============= USER_INVITATIONS RLS POLICIES =============

-- Super admins can manage all invitations
CREATE POLICY "Super admins can view all invitations"
  ON user_invitations FOR SELECT
  USING (is_super_admin());

CREATE POLICY "Super admins can create invitations"
  ON user_invitations FOR INSERT
  WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update invitations"
  ON user_invitations FOR UPDATE
  USING (is_super_admin());

-- Group admins can manage invitations for their groups
CREATE POLICY "Group admins can view invitations for their groups"
  ON user_invitations FOR SELECT
  USING (
    group_id IS NULL OR is_group_admin(group_id)
  );

CREATE POLICY "Group admins can create invitations for their groups"
  ON user_invitations FOR INSERT
  WITH CHECK (
    group_id IS NULL OR is_group_admin(group_id)
  );

CREATE POLICY "Group admins can update their group invitations"
  ON user_invitations FOR UPDATE
  USING (
    group_id IS NULL OR is_group_admin(group_id)
  );
