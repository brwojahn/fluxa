const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database/conexao');
const httpError = require('../utils/httpError');

function criarToken(user) {
  return jwt.sign(
    { sub: String(user.id), perfil: user.perfil },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

function validarCredenciais(input = {}, cadastro = false) {
  const { nome, email, senha } = input || {};
  if (cadastro && (typeof nome !== 'string' || nome.trim().length < 2)) {
    throw httpError(400, 'Informe um nome com pelo menos 2 caracteres.');
  }
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw httpError(400, 'Informe um e-mail válido.');
  }
  if (typeof senha !== 'string' || senha.length < 8) {
    throw httpError(400, 'A senha deve ter pelo menos 8 caracteres.');
  }
  if (Buffer.byteLength(senha, 'utf8') > 72) {
    throw httpError(400, 'A senha não pode exceder 72 bytes.');
  }
}

async function registrar(req, res, next) {
  let connection;
  try {
    validarCredenciais(req.body, true);
    const nome = req.body.nome.trim();
    const email = req.body.email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(req.body.senha, 12);

    connection = await pool.getConnection();
    // Serializa os cadastros iniciais: somente o primeiro usuário recebe perfil de administrador.
    const [[lock]] = await connection.query("SELECT GET_LOCK('fluxa_primeiro_usuario', 10) AS adquirido");
    if (lock.adquirido !== 1) throw httpError(503, 'Não foi possível iniciar o cadastro. Tente novamente.');
    const [[{ total }]] = await connection.query('SELECT COUNT(*) AS total FROM usuarios');
    const perfil = Number(total) === 0 ? 'administrador' : 'funcionario';
    const [[role]] = await connection.execute('SELECT id FROM perfis WHERE nome = ?', [perfil]);
    const [result] = await connection.execute(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, role.id],
    );

    const user = { id: result.insertId, nome, email, perfil };
    return res.status(201).json({ usuario: user, token: criarToken(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'Este e-mail já está cadastrado.'));
    return next(error);
  } finally {
    if (connection) {
      await connection.query("SELECT RELEASE_LOCK('fluxa_primeiro_usuario')").catch(() => {});
      connection.release();
    }
  }
}

async function login(req, res, next) {
  try {
    validarCredenciais(req.body);
    const email = req.body.email.trim().toLowerCase();
    const [users] = await pool.execute(
      `SELECT u.id, u.nome, u.email, u.senha_hash, u.ativo, r.nome AS perfil
       FROM usuarios u JOIN perfis r ON r.id = u.perfil_id WHERE u.email = ? LIMIT 1`,
      [email],
    );
    const user = users[0];

    if (!user || !user.ativo || !(await bcrypt.compare(req.body.senha, user.senha_hash))) {
      return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
    }

    const publicUser = { id: user.id, nome: user.nome, email: user.email, perfil: user.perfil };
    return res.json({ usuario: publicUser, token: criarToken(publicUser) });
  } catch (error) {
    return next(error);
  }
}

function perfilAtual(req, res) {
  return res.json({ usuario: req.usuario });
}

module.exports = { registrar, login, perfilAtual, criarToken, validarCredenciais };
