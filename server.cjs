// Backend Express para servir dados do Postgres
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: 'postgres://postgres:postgres@91.229.245.81:5434/meubarbeirocom?sslmode=disable'
});

// Endpoint: Lista de barbearias
app.get('/api/barber_profiles', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM barber_profiles LIMIT 3');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint: Lista completa de barbearias
app.get('/api/barber_profiles/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM barber_profiles');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Adicione outros endpoints conforme necessário)

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
