require('./utils/env');

const express = require('express');
const { testarConexao } = require('./database/conexao');
const corsMiddleware = require('./middleware/corsMiddleware');
const amostrasRoutes = require('./routes/amostrasRoutes');
const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(corsMiddleware);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'fluxa-api' });
});

app.get('/api/health/database', async (req, res) => {
  try {
    await testarConexao();
    res.json({ status: 'ok', database: process.env.DB_NAME || 'fluxa' });
  } catch (error) {
    console.error('Falha ao verificar conexão com o MySQL:', error.message);
    res.status(503).json({ status: 'error', message: 'Não foi possível conectar ao banco de dados.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/amostras', amostrasRoutes);

app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error('Erro na API:', error);
  return res.status(status).json({
    message: status === 500 ? 'Erro interno do servidor.' : error.message,
  });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.startsWith('troque-')) {
  throw new Error('Configure JWT_SECRET com pelo menos 32 caracteres no arquivo backend/.env.');
}

const server = app.listen(PORT, () => {
  console.log(`API Fluxa disponível em http://localhost:${PORT}`);
});

async function encerrarServidor() {
  server.close(async () => {
    const { pool } = require('./database/conexao');
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', encerrarServidor);
process.on('SIGTERM', encerrarServidor);
