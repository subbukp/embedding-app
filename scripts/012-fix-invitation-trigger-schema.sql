-- Fix: Use fully qualified table names in trigger to work with Supabase Auth context
-- The previous trigger was failing because the search_path didn't include 'public' 
-- when running in the auth context

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_profile_created_process_invitation ON profiles;
DROP FUNCTION IF EXISTS process_pending_invitation();

-- Recreate with fully qualified table names (public.table_name)
CREATE OR REPLACE FUNCTION process_pending_invitation()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Find pending invitation for this user's email
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE email = NEW.email
    AND used_at IS NULL
    AND group_id IS NOT NULL
  ORDER BY created_at DESC
  LIMIT 1;

  -- If we found a pending invitation with a group
  IF invitation_record.id IS NOT NULL THEN
    -- Check if membership already exists
    IF NOT EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE user_id = NEW.id AND group_id = invitation_record.group_id
    ) THEN
      -- Create active group membership
      INSERT INTO public.group_members (user_id, group_id, is_admin, is_active, is_deleted)
      VALUES (NEW.id, invitation_record.group_id, false, true, false);
    ELSE
      -- Reactivate existing membership if it was deleted
      UPDATE public.group_members 
      SET is_active = true, is_deleted = false
      WHERE user_id = NEW.id AND group_id = invitation_record.group_id;
    END IF;

    -- Update profile role if specified in invitation
    IF invitation_record.role IS NOT NULL AND invitation_record.role != NEW.role THEN
      UPDATE public.profiles SET role = invitation_record.role WHERE id = NEW.id;
    END IF;

    -- Mark invitation as used
    UPDATE public.user_invitations SET used_at = NOW() WHERE id = invitation_record.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_profile_created_process_invitation
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION process_pending_invitation();
