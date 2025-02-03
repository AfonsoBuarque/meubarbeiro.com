/*
  # Add sample services

  1. New Data
    - Sample services for existing establishments
    - Prices in cents (integer)
    - Duration in minutes
  
  2. Changes
    - Insert sample services for testing
*/

-- Add sample services for each establishment
INSERT INTO services (establishment_id, name, description, duration, price)
SELECT 
  e.id,
  'Corte Masculino',
  'Corte tradicional com acabamento perfeito',
  45,
  3500
FROM establishment_details e;

INSERT INTO services (establishment_id, name, description, duration, price)
SELECT 
  e.id,
  'Barba',
  'Barba feita com navalha e produtos especiais',
  30,
  2500
FROM establishment_details e;

INSERT INTO services (establishment_id, name, description, duration, price)
SELECT 
  e.id,
  'Corte + Barba',
  'Combo completo: corte masculino + barba',
  75,
  5500
FROM establishment_details e;

INSERT INTO services (establishment_id, name, description, duration, price)
SELECT 
  e.id,
  'Pigmentação',
  'Disfarce com pigmentação para falhas na barba',
  45,
  4500
FROM establishment_details e;

INSERT INTO services (establishment_id, name, description, duration, price)
SELECT 
  e.id,
  'Hidratação',
  'Tratamento completo para cabelo e barba',
  60,
  6000
FROM establishment_details e;