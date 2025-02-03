/*
  # Add establishment management tables

  1. New Tables
    - `establishment_details`
      - Stores detailed information about barbershops
      - Links to barber_profiles
      - Includes address, working hours, and other business details
    
    - `establishment_images`
      - Stores image URLs for establishments
      - Supports banner and profile images
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public read access
*/

-- Create establishment details table
CREATE TABLE IF NOT EXISTS establishment_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES barber_profiles(id) NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  bio text,
  address_details jsonb NOT NULL,
  working_hours jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_barber FOREIGN KEY (barber_id) REFERENCES barber_profiles(id) ON DELETE CASCADE
);

-- Create establishment images table
CREATE TABLE IF NOT EXISTS establishment_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES establishment_details(id) NOT NULL,
  type text NOT NULL CHECK (type IN ('banner', 'profile')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT fk_establishment FOREIGN KEY (establishment_id) REFERENCES establishment_details(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE establishment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE establishment_images ENABLE ROW LEVEL SECURITY;

-- Policies for establishment_details
CREATE POLICY "Users can create their own establishment details"
  ON establishment_details
  FOR INSERT
  TO authenticated
  WITH CHECK (barber_id = auth.uid());

CREATE POLICY "Users can view their own establishment details"
  ON establishment_details
  FOR SELECT
  TO authenticated
  USING (barber_id = auth.uid());

CREATE POLICY "Users can update their own establishment details"
  ON establishment_details
  FOR UPDATE
  TO authenticated
  USING (barber_id = auth.uid());

CREATE POLICY "Users can delete their own establishment details"
  ON establishment_details
  FOR DELETE
  TO authenticated
  USING (barber_id = auth.uid());

CREATE POLICY "Public can view all establishment details"
  ON establishment_details
  FOR SELECT
  TO anon
  USING (true);

-- Policies for establishment_images
CREATE POLICY "Users can manage their own establishment images"
  ON establishment_images
  FOR ALL
  TO authenticated
  USING (establishment_id IN (
    SELECT id FROM establishment_details WHERE barber_id = auth.uid()
  ));

CREATE POLICY "Public can view all establishment images"
  ON establishment_images
  FOR SELECT
  TO anon
  USING (true);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_establishment_details_updated_at
  BEFORE UPDATE ON establishment_details
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_establishment_images_updated_at
  BEFORE UPDATE ON establishment_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();