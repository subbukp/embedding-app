-- Create a function that allows promoting the first super admin
-- This bypasses RLS for the specific case of creating the first admin
CREATE OR REPLACE FUNCTION public.promote_first_super_admin(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  existing_admin_count INTEGER;
BEGIN
  -- Check if any super admin already exists
  SELECT COUNT(*) INTO existing_admin_count
  FROM profiles
  WHERE role = 'super_admin';

  IF existing_admin_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'A super admin already exists'
    );
  END IF;

  -- Find the user by email
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Promote to super admin
  UPDATE profiles
  SET role = 'super_admin', updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Successfully promoted to super admin',
    'user_id', target_user_id
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_first_super_admin(TEXT) TO authenticated;
