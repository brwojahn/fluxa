const { pool } = require('../database/conexao');
const httpError = require('../utils/httpError');

function validar(body) {
  const { nome, pais, email } = body || {};
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 160) {
    throw httpError(400, 'Informe um nome de cliente entre 2 e 160 caracteres.');
  }
  if (pais != null && (typeof pais !== 'string' || pais.trim().length > 100)) {
    throw httpError(400, 'País deve ter até 100 caracteres.');
  }
  if (email != null && email !== '' && (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
    throw httpError(400, 'Informe um e-mail válido com até 254 caracteres.');
  }
  return { nome: nome.trim(), pais: pais?.trim() || null, email: email?.trim().toLowerCase() || null };
}

async function listar(req, res) {
  const [clientes] = await pool.query('SELECT id, nome, pais, email FROM clientes ORDER BY nome, id');
  return res.json({ clientes });
}

async function criar(req, res, next) {
  let dados;
  try { dados = validar(req.body); } catch (error) { return next(error); }
  try {
    const [result] = await pool.execute(
      'INSERT INTO clientes (nome, pais, email) VALUES (?, ?, ?)', [dados.nome, dados.pais, dados.email],
    );
    return res.status(201).json({ cliente: { id: result.insertId, ...dados } });
  } catch (error) { return tratarErro(error, next); }
}

async function atualizar(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return next(httpError(400, 'ID de cliente inválido.'));
  let dados;
  try { dados = validar(req.body); } catch (error) { return next(error); }
  try {
    const [[cliente]] = await pool.execute('SELECT id FROM clientes WHERE id = ?', [id]);
    if (!cliente) return next(httpError(404, 'Cliente não encontrado.'));
    await pool.execute('UPDATE clientes SET nome = ?, pais = ?, email = ? WHERE id = ?',
      [dados.nome, dados.pais, dados.email, id]);
    return res.json({ message: 'Cliente atualizado.', cliente: { id, ...dados } });
  } catch (error) { return tratarErro(error, next); }
}

async function remover(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return next(httpError(400, 'ID de cliente inválido.'));
  try {
    const [result] = await pool.execute('DELETE FROM clientes WHERE id = ?', [id]);
    if (!result.affectedRows) return next(httpError(404, 'Cliente não encontrado.'));
    return res.json({ message: 'Cliente excluído.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return next(httpError(409, 'Cliente possui envios registrados e não pode ser excluído.'));
    return next(error);
  }
}

function tratarErro(error, next) {
  if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'E-mail de cliente já cadastrado.'));
  return next(error);
}

module.exports = { listar, criar, atualizar, remover };
