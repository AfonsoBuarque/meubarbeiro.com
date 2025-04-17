/*
  # Create barber profiles schema

  1. New Tables
    - `barber_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, required)
      - `name` (text, required)
      - `phone` (text, required)
      - `bio` (text)
      - `address` (text, required)
      - `latitude` (float8)
      - `longitude` (float8)
      - `working_hours` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `barber_services`
      - `id` (uuid, primary key)
      - `barber_id` (uuid, references barber_profiles)
      - `name` (text, required)
      - `price` (int, required)
      - `duration` (int, required, in minutes)
      - `description` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for barbers to manage their own data
    - Add policies for public read access
*/

-- Create barber profiles table
CREATE TABLE IF NOT EXISTS barber_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  bio text,
  address text NOT NULL,
  latitude float8,
  longitude float8,
  working_hours jsonb DEFAULT '{"monday":{"start":"09:00","end":"18:00"},"tuesday":{"start":"09:00","end":"18:00"},"wednesday":{"start":"09:00","end":"18:00"},"thursday":{"start":"09:00","end":"18:00"},"friday":{"start":"09:00","end":"18:00"},"saturday":{"start":"09:00","end":"13:00"},"sunday":null}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create barber services table
CREATE TABLE IF NOT EXISTS barber_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES barber_profiles(id) NOT NULL,
  name text NOT NULL,
  price integer NOT NULL,
  duration integer NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_services ENABLE ROW LEVEL SECURITY;

-- Policies for barber_profiles
CREATE POLICY "Barbers can read their own profile"
  ON barber_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Barbers can update their own profile"
  ON barber_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Public can read barber profiles"
  ON barber_profiles
  FOR SELECT
  TO anon
  USING (true);

-- Policies for barber_services
CREATE POLICY "Barbers can manage their own services"
  ON barber_services
  FOR ALL
  TO authenticated
  USING (barber_id = auth.uid());

CREATE POLICY "Public can read barber services"
  ON barber_services
  FOR SELECT
  TO anon
  USING (true);

-- Create function to handle profile updates
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON barber_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON barber_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON barber_services;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON barber_services
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();