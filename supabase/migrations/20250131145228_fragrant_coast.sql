/*
  # Fix Authentication Flow

  1. Changes
    - Add RLS policies for profile creation during registration
    - Add trigger to handle user deletion cleanup
    - Add function to clean up profiles when users are deleted

  2. Security
    - Enable RLS
    - Add policies for authenticated users
    - Add policies for public access
*/

-- Create function to handle user deletion
CREATE OR REPLACE FUNCTION handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the barber profile
  DELETE FROM barber_profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_user_deleted ON auth.users;
CREATE TRIGGER on_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_deletion();

-- Update RLS policies
DROP POLICY IF EXISTS "Users can create their own profile" ON barber_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON barber_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON barber_profiles;
DROP POLICY IF EXISTS "Public can view all profiles" ON barber_profiles;

-- Create new policies
CREATE POLICY "Enable insert for authenticated users only"
  ON barber_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable read access for authenticated users"
  ON barber_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable update for users based on id"
  ON barber_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable delete for users based on id"
  ON barber_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable read access for anonymous users"
  ON barber_profiles
  FOR SELECT
  TO anon
  USING (true);