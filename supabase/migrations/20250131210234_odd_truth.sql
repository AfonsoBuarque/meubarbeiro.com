/*
  # Create appointments system

  1. New Tables
    - `services`
      - `id` (uuid, primary key)
      - `establishment_id` (uuid, references establishment_details)
      - `name` (text)
      - `description` (text)
      - `duration` (integer, minutes)
      - `price` (integer, cents)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `appointments`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references auth.users)
      - `establishment_id` (uuid, references establishment_details)
      - `service_id` (uuid, references services)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `status` (enum: scheduled, completed, cancelled)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for CRUD operations
    - Ensure clients can only book available slots
    - Ensure establishments can only manage their own services
*/

-- Create btree_gist extension for time range exclusion
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  duration integer NOT NULL CHECK (duration >= 15),
  price integer NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (establishment_id) REFERENCES establishment_details(id) ON DELETE CASCADE
);

-- Create appointment status enum
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled');

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  establishment_id uuid NOT NULL,
  service_id uuid NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status appointment_status DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  FOREIGN KEY (establishment_id) REFERENCES establishment_details(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE RESTRICT,
  CONSTRAINT appointments_end_time_check CHECK (end_time > start_time),
  -- Add exclusion constraint to prevent overlapping appointments
  CONSTRAINT appointments_no_overlap EXCLUDE USING gist (
    establishment_id WITH =,
    tstzrange(start_time, end_time, '[]') WITH &&
  )
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Policies for services
CREATE POLICY "Establishments can manage their own services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM establishment_details WHERE barber_id = auth.uid()
    )
  );

CREATE POLICY "Public can view services"
  ON services
  FOR SELECT
  TO anon
  USING (true);

-- Policies for appointments
CREATE POLICY "Clients can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "Establishments can view their appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM establishment_details WHERE barber_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Client must be authenticated
    auth.uid() IS NOT NULL
    -- Appointment must be in the future
    AND start_time > now()
    -- Service must belong to the establishment
    AND service_id IN (
      SELECT id FROM services WHERE establishment_id = appointments.establishment_id
    )
  );

CREATE POLICY "Clients can cancel their own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (
    -- Can only update status to cancelled
    status = 'cancelled'
    -- Can only cancel future appointments
    AND start_time > now()
  );

CREATE POLICY "Establishments can manage their appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (
    establishment_id IN (
      SELECT id FROM establishment_details WHERE barber_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_establishment ON appointments(establishment_id);
CREATE INDEX idx_appointments_service ON appointments(service_id);
CREATE INDEX idx_appointments_start_time ON appointments(start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_services_establishment ON services(establishment_id);

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();