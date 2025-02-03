/*
  # Fix RLS policies for barber profiles

  1. Changes
    - Add policy to allow authenticated users to insert their own profile
    - Update existing policies for better security

  2. Security
    - Enable RLS on barber_profiles table
    - Add policies for CRUD operations
    - Ensure users can only manage their own data
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Barbers can read their own profile" ON barber_profiles;
DROP POLICY IF EXISTS "Barbers can update their own profile" ON barber_profiles;
DROP POLICY IF EXISTS "Public can read barber profiles" ON barber_profiles;

-- Create new policies
CREATE POLICY "Users can create their own profile"
  ON barber_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile"
  ON barber_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON barber_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public can view all profiles"
  ON barber_profiles
  FOR SELECT
  TO anon
  USING (true);