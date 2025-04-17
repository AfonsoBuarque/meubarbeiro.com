import { Client } from 'pg';

describe('Migrações - Integridade do Banco', () => {
  const client = new Client({
    connectionString: 'postgres://postgres:postgres@91.229.245.81:5434/meubarbeirocom?sslmode=disable'
  });

  beforeAll(async () => {
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  test('Tabela barber_profiles tem coluna email NOT NULL', async () => {
    const res = await client.query(`
      SELECT is_nullable
      FROM information_schema.columns
      WHERE table_name = 'barber_profiles' AND column_name = 'email'
    `);
    expect(res.rows[0].is_nullable).toBe('NO');
  });

  test('Existem 5 barbearias seedadas', async () => {
    const res = await client.query('SELECT COUNT(*) FROM barber_profiles');
    expect(Number(res.rows[0].count)).toBe(5);
  });

  test('Tabela auth.users existe', async () => {
    const res = await client.query(`
      SELECT to_regclass('auth.users') as exists
    `);
    expect(res.rows[0].exists).toBe('auth.users');
  });

  test('Chave estrangeira em barber_profiles.id referencia auth.users', async () => {
    const res = await client.query(`
      SELECT tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_name = 'barber_profiles' AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users' AND ccu.table_schema = 'auth';
    `);
    expect(res.rowCount).toBeGreaterThan(0);
  });
});
