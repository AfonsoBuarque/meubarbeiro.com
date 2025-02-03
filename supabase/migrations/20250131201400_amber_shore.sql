/*
  # Fix search functionality

  1. Changes
    - Add banner_url and profile_url columns to establishment_details
    - Update indexes for better search performance
    - Add migration to move existing image data
*/

-- Add image URL columns to establishment_details
ALTER TABLE establishment_details
ADD COLUMN IF NOT EXISTS banner_url text,
ADD COLUMN IF NOT EXISTS profile_url text;

-- Move existing image data to establishment_details
UPDATE establishment_details e
SET 
  banner_url = (
    SELECT url 
    FROM establishment_images i 
    WHERE i.establishment_id = e.id 
    AND i.type = 'banner'
    LIMIT 1
  ),
  profile_url = (
    SELECT url 
    FROM establishment_images i 
    WHERE i.establishment_id = e.id 
    AND i.type = 'profile'
    LIMIT 1
  );

-- Drop establishment_images table as it's no longer needed
DROP TABLE IF EXISTS establishment_images;

-- Update indexes for better search performance
DROP INDEX IF EXISTS idx_establishment_name_trgm;
CREATE INDEX idx_establishment_name_trgm ON establishment_details USING gin (name gin_trgm_ops);
CREATE INDEX idx_establishment_address_city ON establishment_details USING gin ((address_details->>'city') gin_trgm_ops);
CREATE INDEX idx_establishment_address_neighborhood ON establishment_details USING gin ((address_details->>'neighborhood') gin_trgm_ops);