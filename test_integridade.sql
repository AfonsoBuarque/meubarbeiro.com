-- Testes de integridade com pgTAP
SELECT has_table('auth', 'users');
SELECT has_table('public', 'barber_profiles');
SELECT col_is_not_null('public', 'barber_profiles', 'email');
SELECT has_fk('public', 'barber_profiles', 'id');
SELECT results_eq(
  'SELECT count(*) FROM barber_profiles',
  ARRAY[5],
  'Deve haver 5 barbearias seedadas'
);
