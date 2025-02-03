/*
  # Fix Database Relationships and Search Functionality

  1. Changes
    - Drop duplicate foreign key constraint
    - Update indexes for better search performance
    - Add missing text search extensions
    - Fix relationship between barber_profiles and establishment_details

  2. Performance
    - Add optimized indexes for text search
    - Add indexes for foreign key relationships

  3. Security
    - Maintain existing RLS policies
*/

-- First ensure we have the required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop the duplicate foreign key constraint if it exists
ALTER TABLE establishment_details 
DROP CONSTRAINT IF EXISTS fk_barber;

-- Keep only the primary foreign key relationship
ALTER TABLE establishment_details
DROP CONSTRAINT IF EXISTS establishment_details_barber_id_fkey,
ADD CONSTRAINT establishment_details_barber_id_fkey 
  FOREIGN KEY (barber_id) 
  REFERENCES barber_profiles(id) 
  ON DELETE CASCADE;

-- Recreate optimized indexes
DROP INDEX IF EXISTS idx_establishment_name_trgm;
DROP INDEX IF EXISTS idx_establishment_address_city;
DROP INDEX IF EXISTS idx_establishment_address_neighborhood;

CREATE INDEX idx_establishment_name_trgm 
  ON establishment_details 
  USING gin (name gin_trgm_ops);

CREATE INDEX idx_establishment_address_city 
  ON establishment_details 
  USING gin ((address_details->>'city') gin_trgm_ops);

CREATE INDEX idx_establishment_address_neighborhood 
  ON establishment_details 
  USING gin ((address_details->>'neighborhood') gin_trgm_ops);

-- Add index for the foreign key relationship
CREATE INDEX IF NOT EXISTS idx_establishment_barber_id 
  ON establishment_details(barber_id);

-- Update RLS policies to ensure proper access
DROP POLICY IF EXISTS "Public can view all establishment details" ON establishment_details;
CREATE POLICY "Public can view all establishment details"
  ON establishment_details
  FOR SELECT
  TO anon
  USING (true);