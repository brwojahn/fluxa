const { pool } = require('../database/conexao');
const httpError = require('../utils/httpError');

async function listar(req, res) {
  const [fornecedores] = await pool.query(
    'SELECT id, codigo, nome FROM fornecedores ORDER BY nome, id',
  );
  return res.json({ fornecedores });
}

async function criar(req, res, next) {
  const { codigo, nome } = req.body || {};
  return salvar(null, codigo, nome, res, next);
}

async function atualizar(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return next(httpError(400, 'ID de fornecedor inválido.'));
  const { codigo, nome } = req.body || {};
  return salvar(id, codigo, nome, res, next);
}

async function salvar(id, codigo, nome, res, next) {
  if (typeof codigo !== 'string' || !codigo.trim() || codigo.trim().length > 30) {
    return next(httpError(400, 'Informe um código de fornecedor com até 30 caracteres.'));
  }
  if (typeof nome !== 'string' || nome.trim().length < 2 || nome.trim().length > 160) {
    return next(httpError(400, 'Informe um nome de fornecedor entre 2 e 160 caracteres.'));
  }
  try {
    if (id == null) {
      const [result] = await pool.execute(
        'INSERT INTO fornecedores (codigo, nome) VALUES (?, ?)', [codigo.trim(), nome.trim()],
      );
      return res.status(201).json({ fornecedor: { id: result.insertId, codigo: codigo.trim(), nome: nome.trim() } });
    }
    const [[fornecedor]] = await pool.execute('SELECT id FROM fornecedores WHERE id = ?', [id]);
    if (!fornecedor) return next(httpError(404, 'Fornecedor não encontrado.'));
    await pool.execute(
      'UPDATE fornecedores SET codigo = ?, nome = ? WHERE id = ?', [codigo.trim(), nome.trim(), id],
    );
    return res.json({ message: 'Fornecedor atualizado.', fornecedor: { id, codigo: codigo.trim(), nome: nome.trim() } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'Esse código de fornecedor já está cadastrado.'));
    return next(error);
  }
}

async function remover(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return next(httpError(400, 'ID de fornecedor inválido.'));
  try {
    const [result] = await pool.execute('DELETE FROM fornecedores WHERE id = ?', [id]);
    if (!result.affectedRows) return next(httpError(404, 'Fornecedor não encontrado.'));
    return res.json({ message: 'Fornecedor excluído.' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return next(httpError(409, 'Fornecedor possui amostras cadastradas e não pode ser excluído.'));
    return next(error);
  }
}

module.exports = { listar, criar, atualizar, remover };
