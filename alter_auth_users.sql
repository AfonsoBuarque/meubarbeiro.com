ALTER TABLE auth.users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS encrypted_password text,
  ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS raw_app_meta_data jsonb,
  ADD COLUMN IF NOT EXISTS raw_user_meta_data jsonb;
