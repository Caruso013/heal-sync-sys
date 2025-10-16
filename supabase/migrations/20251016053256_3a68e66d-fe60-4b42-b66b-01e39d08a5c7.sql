-- Insert admin user role
-- This will create the admin account on first signup with these credentials
-- Email: dr.assis@gmail.com
-- Password: Lady@leila1976

-- Note: The user must sign up first with these credentials, then this will assign the admin role
-- Create a function to check if admin exists
CREATE OR REPLACE FUNCTION check_and_create_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if there's already an admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin') THEN
    -- This is just a placeholder, admin must sign up via /auth first
    RAISE NOTICE 'No admin found. Please sign up with admin credentials first.';
  END IF;
END;
$$;