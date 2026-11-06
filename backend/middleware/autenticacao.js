const jwt = require('jsonwebtoken');
const { pool } = require('../database/conexao');

async function autenticar(req, res, next) {
  const authorization = req.get('authorization') || '';
  const [scheme, token, extra] = authorization.trim().split(/\s+/);

  if (scheme !== 'Bearer' || !token || extra) {
    return res.status(401).json({ message: 'Token de autenticação obrigatório.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await pool.execute(
      `SELECT u.id, u.nome, u.email, u.ativo, r.nome AS perfil
       FROM usuarios u JOIN perfis r ON r.id = u.perfil_id
       WHERE u.id = ? LIMIT 1`,
      [payload.sub],
    );

    if (!users.length || !users[0].ativo) {
      return res.status(401).json({ message: 'Usuário inválido ou desativado.' });
    }

    req.usuario = {
      id: users[0].id,
      nome: users[0].nome,
      email: users[0].email,
      perfil: users[0].perfil,
    };
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token inválido ou expirado.' });
    }
    return next(error);
  }
}

function autorizar(...perfisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !perfisPermitidos.includes(req.usuario.perfil)) {
      return res.status(403).json({ message: 'Você não tem permissão para acessar este recurso.' });
    }
    return next();
  };
}

module.exports = { autenticar, autorizar };
