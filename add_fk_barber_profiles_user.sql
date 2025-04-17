ALTER TABLE barber_profiles
  ADD CONSTRAINT fk_barber_profiles_user
  FOREIGN KEY (id) REFERENCES auth.users(id);
