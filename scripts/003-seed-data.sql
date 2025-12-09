-- Create a super admin user (you'll need to sign up with this email first via OTP)
-- Then run this script to upgrade them to super admin

-- Note: Replace 'admin@example.com' with your actual email after you sign up
-- This is just example seed data

-- Create sample groups
INSERT INTO groups (id, name, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Engineering Team', 'Software engineering and development'),
  ('22222222-2222-2222-2222-222222222222', 'Marketing Team', 'Marketing and communications'),
  ('33333333-3333-3333-3333-333333333333', 'Sales Team', 'Sales and business development');

-- Note: To make your first super admin:
-- 1. Sign up via the app with your email
-- 2. Find your user ID in the profiles table
-- 3. Run: UPDATE profiles SET role = 'super_admin' WHERE email = 'your-email@example.com';
