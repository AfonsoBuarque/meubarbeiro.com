/*
  # Fix search functionality

  1. Changes
    - Add extension for text search
    - Add unique constraint to ensure one establishment per barber
    - Add indexes for faster search
    - Update RLS policies for better performance

  2. Indexes
    - Add B-tree index on barber_id for faster joins
    - Add GiST index on address_details for JSONB search
    - Add trigram index on name after extension is created

  3. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- First create the extension for text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add unique constraint to ensure one establishment per barber
ALTER TABLE establishment_details
ADD CONSTRAINT unique_barber_establishment UNIQUE (barber_id);

-- Add indexes for faster search
CREATE INDEX idx_establishment_barber ON establishment_details (barber_id);
CREATE INDEX idx_establishment_address ON establishment_details USING gin (address_details);
CREATE INDEX idx_establishment_name_trgm ON establishment_details USING gin (name gin_trgm_ops);

-- Update RLS policies for better performance
DROP POLICY IF EXISTS "Public can view all establishment details" ON establishment_details;
CREATE POLICY "Public can view all establishment details"
  ON establishment_details
  FOR SELECT
  TO anon
  USING (true);