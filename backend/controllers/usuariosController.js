const bcrypt = require('bcryptjs');
const { pool } = require('../database/conexao');
const { criarToken, validarCredenciais } = require('./authController');
const httpError = require('../utils/httpError');

async function listar(req, res) {
  const [users] = await pool.query(
    `SELECT u.id, u.nome, u.email, u.ativo, p.nome AS perfil, u.criado_em
     FROM usuarios u JOIN perfis p ON p.id = u.perfil_id ORDER BY u.id`,
  );
  return res.json({ usuarios: users });
}

async function criar(req, res, next) {
  try {
    validarCredenciais(req.body, true);
    const perfil = req.body.perfil || 'funcionario';
    if (!['administrador', 'funcionario'].includes(perfil)) {
      throw httpError(400, 'Perfil deve ser administrador ou funcionario.');
    }

    const nome = req.body.nome.trim();
    const email = req.body.email.trim().toLowerCase();
    const senhaHash = await bcrypt.hash(req.body.senha, 12);
    const [[role]] = await pool.execute('SELECT id FROM perfis WHERE nome = ?', [perfil]);
    const [result] = await pool.execute(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil_id) VALUES (?, ?, ?, ?)',
      [nome, email, senhaHash, role.id],
    );
    const usuario = { id: result.insertId, nome, email, perfil };
    return res.status(201).json({ usuario, token: criarToken(usuario) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'Este e-mail já está cadastrado.'));
    return next(error);
  }
}

async function alterarPerfil(req, res, next) {
  const id = Number(req.params.id);
  const { perfil } = req.body;
  if (!Number.isInteger(id) || id < 1) return next(httpError(400, 'ID de usuário inválido.'));
  if (!['administrador', 'funcionario'].includes(perfil)) {
    return next(httpError(400, 'Perfil deve ser administrador ou funcionario.'));
  }
  if (id === req.usuario.id && perfil !== 'administrador') {
    return next(httpError(400, 'Não é possível remover seu próprio perfil de administrador.'));
  }

  const [[user]] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
  if (!user) return next(httpError(404, 'Usuário não encontrado.'));
  const [[role]] = await pool.execute('SELECT id FROM perfis WHERE nome = ?', [perfil]);
  await pool.execute('UPDATE usuarios SET perfil_id = ? WHERE id = ?', [role.id, id]);
  return res.json({ message: 'Perfil atualizado.', id, perfil });
}

async function alterarStatus(req, res, next) {
  const id = Number(req.params.id);
  const { ativo } = req.body;
  if (!Number.isInteger(id) || id < 1) return next(httpError(400, 'ID de usuário inválido.'));
  if (typeof ativo !== 'boolean') return next(httpError(400, 'O campo ativo deve ser booleano.'));
  if (id === req.usuario.id && !ativo) return next(httpError(400, 'Não é possível desativar seu próprio usuário.'));

  const [[user]] = await pool.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
  if (!user) return next(httpError(404, 'Usuário não encontrado.'));
  await pool.execute('UPDATE usuarios SET ativo = ? WHERE id = ?', [ativo, id]);
  return res.json({ message: 'Status do usuário atualizado.', id, ativo });
}

module.exports = { listar, criar, alterarPerfil, alterarStatus };
