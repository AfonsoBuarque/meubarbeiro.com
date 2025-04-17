import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import multer from 'multer';
import { jwtMiddleware, generateToken } from './jwtUtils.js';
import { v4 as uuidv4 } from 'uuid';
import upload from './multerConfig';

// Carrega variáveis de ambiente
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
});

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Logger profissional
const logPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), './backend.log');
function logToFile(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] [${level}] ${message}\n`);
}

// Middleware para logar todas as requisições
app.use((req, res, next) => {
  logToFile(`${req.method} ${req.originalUrl}`);
  next();
});

// Exemplo de rota pública para login (gera token)
app.post('/api/login', (req, res) => {
  // Aqui você pode validar usuário/senha de verdade!
  const { uid, email } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'Informe uid e email' });
  }
  // Payload mínimo para o token
  const token = generateToken({ uid, email });
  res.json({ token });
});

// GET all barber profiles (rota pública)
app.get('/api/barber_profiles', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT b.id, b.auth_uid, b.name, b.phone, b.bio, b.email, e.banner_url, e.profile_url, e.name AS establishment_name, e.address_details
      FROM barber_profiles b
      LEFT JOIN establishment_details e ON e.barber_id = b.id
    `);
    logToFile(`Returned ${rows.length} barber profiles (with banner_url, profile_url and establishment info).`);
    res.json(rows);
  } catch (err) {
    logToFile(`Database error (all profiles): ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Database error' });
  }
});

// GET all barber profiles (rota pública alternativa)
app.get('/api/barber_profiles/all', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM barber_profiles');
    logToFile(`Returned ${rows.length} barber profiles (all endpoint).`);
    res.json(rows);
  } catch (err) {
    logToFile(`Database error (all profiles/all): ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Database error' });
  }
});

// GET barber profile by Firebase UID (protegida)
app.get('/api/barber_profiles/:uid', jwtMiddleware, async (req, res) => {
  const { uid } = req.params;
  // Só permite buscar o próprio perfil
  if (req.user.uid !== uid) {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  try {
    const { rows } = await pool.query('SELECT * FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (rows.length === 0) {
      logToFile(`Profile not found for auth_uid: ${uid}`, 'WARN');
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    logToFile(`Database error (get profile): ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Database error' });
  }
});

// POST criar barbeiro (protegida)
app.post('/api/barber_profiles', jwtMiddleware, async (req, res) => {
  // Use o uid do JWT, não aceite do body!
  const auth_uid = req.user.uid;
  const { name, phone, bio, email, address } = req.body;
  if (!auth_uid || !name || !email) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, email' });
  }
  try {
    // Gera um UUID para o novo barbeiro
    const id = uuidv4();
    const { rows } = await pool.query(
      'INSERT INTO barber_profiles (id, auth_uid, name, phone, bio, email, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, auth_uid, name, phone || '', bio || '', email, address || '']
    );
    logToFile(`Barbeiro criado: ${auth_uid}`);
    res.status(201).json(rows[0]);
  } catch (err) {
    logToFile(`Erro ao criar barbeiro: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao criar barbeiro' });
  }
});

// PUT update barber profile by ID (protegida)
app.put('/api/barber_profiles/:id', jwtMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, phone, bio, email } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE barber_profiles SET name = $1, phone = $2, bio = $3, email = $4 WHERE id = $5 RETURNING *',
      [name, phone, bio, email, id]
    );
    if (rows.length === 0) {
      logToFile(`Profile not found for update, id: ${id}`, 'WARN');
      return res.status(404).json({ error: 'Profile not found' });
    }
    logToFile(`Profile updated for id: ${id}`);
    res.json(rows[0]);
  } catch (err) {
    logToFile(`Erro ao atualizar barbeiro: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao atualizar barbeiro' });
  }
});

// DELETE remover barbeiro (protegida)
app.delete('/api/barber_profiles/:uid', jwtMiddleware, async (req, res) => {
  const { uid } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM barber_profiles WHERE auth_uid = $1', [uid]);
    if (rowCount === 0) {
      logToFile(`Barbeiro não encontrado para remover: ${uid}`, 'WARN');
      return res.status(404).json({ error: 'Barbeiro não encontrado' });
    }
    logToFile(`Barbeiro removido: ${uid}`);
    res.json({ message: 'Barbeiro removido com sucesso' });
  } catch (err) {
    logToFile(`Erro ao remover barbeiro: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao remover barbeiro' });
  }
});

// GET detalhes do estabelecimento por UID do barbeiro autenticado
app.get('/api/establishment_details', jwtMiddleware, async (req, res) => {
  const { uid } = req.user;
  try {
    // Buscar barber_id pelo auth_uid
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbeiro não encontrado para o usuário autenticado' });
    }
    const barber_id = barberResult.rows[0].id;
    // Buscar estabelecimento do barbeiro
    const { rows } = await pool.query('SELECT * FROM establishment_details WHERE barber_id = $1 LIMIT 1', [barber_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar estabelecimento' });
  }
});

// POST criar ou atualizar estabelecimento
app.post('/api/establishment_details', jwtMiddleware, async (req, res) => {
  const { uid } = req.user;
  const {
    name, phone, bio, street, number, complement, neighborhood, city, state, zipcode, workingHours,
    banner_url, profile_url, id
  } = req.body;
  try {
    // Buscar barber_id pelo auth_uid
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbeiro não encontrado para o usuário autenticado' });
    }
    const barber_id = barberResult.rows[0].id;
    // Montar address_details como objeto JSON
    const address_details = {
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipcode
    };
    let query, params;
    if (id) {
      // Atualiza existente
      query = `UPDATE public.establishment_details SET barber_id = $1, barber_uid = $2, name = $3, phone = $4, bio = $5, address_details = $6, working_hours = $7, banner_url = $8, profile_url = $9 WHERE id = $10 AND barber_uid = $2 RETURNING *`;
      params = [barber_id, uid, name, phone, bio, address_details, workingHours, banner_url, profile_url, id];
    } else {
      // Cria novo
      query = `INSERT INTO public.establishment_details (barber_id, barber_uid, name, phone, bio, address_details, working_hours, banner_url, profile_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`;
      params = [barber_id, uid, name, phone, bio, address_details, workingHours, banner_url, profile_url];
    }
    const { rows } = await pool.query(query, params);
    res.json(rows[0]);
  } catch (err) {
    logToFile(`Erro ao salvar estabelecimento: ${err.stack || err}`, 'ERROR');
    console.error('Erro ao salvar estabelecimento:', err);
    res.status(500).json({ error: 'Erro ao salvar estabelecimento', details: err.message });
  }
});

app.put('/api/establishment_details', jwtMiddleware, async (req, res) => {
  const { uid } = req.user;
  const {
    name, phone, bio, street, number, complement, neighborhood, city, state, zipcode, workingHours,
    banner_url, profile_url, id
  } = req.body;
  if (!id) {
    return res.status(400).json({ error: 'ID do estabelecimento não fornecido' });
  }
  try {
    // Buscar barber_id pelo auth_uid
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbeiro não encontrado para o usuário autenticado' });
    }
    const barber_id = barberResult.rows[0].id;
    // Montar address_details como objeto JSON
    const address_details = {
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      zipcode
    };
    const query = `UPDATE public.establishment_details SET barber_id = $1, barber_uid = $2, name = $3, phone = $4, bio = $5, address_details = $6, working_hours = $7, banner_url = $8, profile_url = $9 WHERE id = $10 AND barber_uid = $2 RETURNING *`;
    const params = [barber_id, uid, name, phone, bio, address_details, workingHours, banner_url, profile_url, id];
    const { rows } = await pool.query(query, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado para atualizar' });
    }
    res.json(rows[0]);
  } catch (err) {
    logToFile(`Erro ao atualizar estabelecimento: ${err.stack || err}`, 'ERROR');
    console.error('Erro ao atualizar estabelecimento:', err);
    res.status(500).json({ error: 'Erro ao atualizar estabelecimento', details: err.message });
  }
});

// Rota pública para buscar detalhes do estabelecimento por ID (sem geocodificação)
app.get('/api/establishment_details/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Busca o estabelecimento pelo barber_id
    const { rows } = await pool.query('SELECT * FROM establishment_details WHERE barber_id = $1', [id]);
    if (!rows.length) return res.status(404).json({ error: 'Estabelecimento não encontrado' });
    const est = rows[0];
    res.json(est);
  } catch (err) {
    console.error('Erro ao buscar estabelecimento por id:', err);
    res.status(500).json({ error: 'Erro ao buscar estabelecimento' });
  }
});

// Configuração do multer para uploads locais
const uploadDir = path.resolve('./uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});
const uploadImage = multer({ storage });

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(uploadDir));

// Endpoint para upload de imagem (banner/profile)
app.post('/api/upload_image', jwtMiddleware, uploadImage.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Arquivo não enviado' });
  }
  // Retorna URL local (ajuste para produção/conforme seu frontend)
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// GET público (sem autenticação) para listar serviços de um barbeiro
app.get('/api/barber_services/:barber_id', async (req, res) => {
  try {
    const { barber_id } = req.params;
    const { rows } = await pool.query('SELECT * FROM barber_services WHERE barber_id = $1 ORDER BY created_at DESC', [barber_id]);
    res.json({ services: rows });
  } catch (err) {
    console.error('Erro ao buscar serviços:', err);
    res.status(500).json({ error: 'Erro ao buscar serviços' });
  }
});

app.post('/api/barber_services', jwtMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { name, price, duration, description } = req.body;
  if (!name || price == null || duration == null) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, price, duration' });
  }
  try {
    // Busca barber_id do usuário autenticado
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbeiro não encontrado para o usuário autenticado' });
    }
    const barber_id = barberResult.rows[0].id;
    const id = uuidv4();
    const now = new Date();
    const { rows } = await pool.query(
      `INSERT INTO barber_services (id, barber_id, name, price, duration, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, barber_id, name, parseInt(price), parseInt(duration), description || '', now, now]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    logToFile(`Erro ao criar serviço: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

app.put('/api/barber_services/:id', jwtMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  const { name, price, duration, description } = req.body;
  if (!name || price == null || duration == null) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, price, duration' });
  }
  try {
    // Busca barber_id do usuário autenticado
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbeiro não encontrado para o usuário autenticado' });
    }
    const barber_id = barberResult.rows[0].id;
    const now = new Date();
    const { rows } = await pool.query(
      `UPDATE barber_services SET name = $1, price = $2, duration = $3, description = $4, updated_at = $5
       WHERE id = $6 AND barber_id = $7 RETURNING *`,
      [name, parseInt(price), parseInt(duration), description || '', now, id, barber_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado ou não pertence ao barbeiro' });
    }
    res.json(rows[0]);
  } catch (err) {
    logToFile(`Erro ao atualizar serviço: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

app.delete('/api/barber_services/:id', jwtMiddleware, async (req, res) => {
  const { uid } = req.user;
  const { id } = req.params;
  try {
    // Busca barber_id do usuário autenticado
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barbeiro não encontrado para o usuário autenticado' });
    }
    const barber_id = barberResult.rows[0].id;
    const { rowCount } = await pool.query(
      'DELETE FROM barber_services WHERE id = $1 AND barber_id = $2',
      [id, barber_id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Serviço não encontrado ou não pertence ao barbeiro' });
    }
    res.json({ message: 'Serviço removido com sucesso' });
  } catch (err) {
    logToFile(`Erro ao remover serviço: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao remover serviço' });
  }
});

// POST cadastrar funcionário barbeiro com upload de foto
app.post('/api/barber_employees', jwtMiddleware, upload.single('photo'), async (req, res) => {
  const { uid } = req.user;
  try {
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barber profile não encontrado para o usuário logado' });
    }
    const barber_profile_id = barberResult.rows[0].id;
    const { name, phone, email } = req.body;
    let photoUrl = '';
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }
    await pool.query(
      'INSERT INTO barber_employee (name, phone, email, photo, barber_profile_id) VALUES ($1, $2, $3, $4, $5)',
      [name, phone, email, photoUrl, barber_profile_id]
    );
    logToFile(`Funcionário cadastrado: ${name} (${email})`, 'INFO');
    res.status(201).json({ success: true });
  } catch (err) {
    logToFile(`Erro ao cadastrar funcionário: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao cadastrar funcionário' });
  }
});

// GET listar funcionários barbeiros vinculados ao usuário logado
app.get('/api/barber_employees', jwtMiddleware, async (req, res) => {
  const { uid } = req.user; // uid do usuário logado (auth_uid)
  try {
    // Busca o id do barber_profile do usuário logado
    const barberResult = await pool.query('SELECT id FROM barber_profiles WHERE auth_uid = $1 LIMIT 1', [uid]);
    if (barberResult.rows.length === 0) {
      return res.status(404).json({ error: 'Barber profile não encontrado para o usuário logado' });
    }
    const barber_profile_id = barberResult.rows[0].id;
    const { rows } = await pool.query('SELECT * FROM barber_employee WHERE barber_profile_id = $1', [barber_profile_id]);
    if (!rows.length) {
      return res.json({ warning: 'BARBEIROS NÃO CADASTRADOS', employees: [] });
    }
    res.json(rows);
  } catch (err) {
    logToFile(`Erro ao buscar funcionários: ${err.stack || err}`, 'ERROR');
    res.status(500).json({ error: 'Erro ao buscar funcionários' });
  }
});

const { google } = require('googleapis');
require('dotenv').config();

// Endpoint de callback do Google OAuth2 para Google Calendar
app.get('/api/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Code não fornecido');
  }
  // Configuração do OAuth2
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  try {
    // Troca o code pelos tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    // Recupera o usuário autenticado (exemplo: pelo JWT, cookie, etc)
    // Aqui, espera-se que o frontend envie o token JWT na query ou header
    const jwt = req.query.state || req.headers['authorization']?.replace('Bearer ', '');
    if (!jwt) return res.status(401).send('Usuário não autenticado');
    const decoded = require('jsonwebtoken').verify(jwt, process.env.JWT_SECRET);
    const auth_uid = decoded.uid;
    // Salva os tokens no banco (barber_profiles)
    await pool.query(
      'UPDATE barber_profiles SET google_access_token = $1, google_refresh_token = $2, google_calendar_connected = $3 WHERE auth_uid = $4',
      [tokens.access_token, tokens.refresh_token, true, auth_uid]
    );
    // Redireciona para o frontend ou retorna sucesso
    return res.redirect('/barber/establishment?google_calendar_connected=1');
  } catch (err) {
    logToFile(`Erro no callback do Google: ${err.stack || err}`, 'ERROR');
    return res.status(500).send('Erro ao conectar com o Google Calendar');
  }
});

app.listen(port, () => {
  logToFile(`Backend listening on http://localhost:${port}`);
  console.log(`Backend listening on http://localhost:${port}`);
});
