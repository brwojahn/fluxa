const { pool } = require('../database/conexao');
const httpError = require('../utils/httpError');

function validarAmostra(body) {
  const { codigo, fornecedorId, dataRecebimento, quantidadeRecebida } = body || {};
  if (typeof codigo !== 'string' || !codigo.trim() || codigo.trim().length > 80) {
    throw httpError(400, 'Informe um código de amostra com até 80 caracteres.');
  }
  if (!Number.isInteger(Number(fornecedorId)) || Number(fornecedorId) < 1) {
    throw httpError(400, 'Selecione um fornecedor válido.');
  }
  if (typeof dataRecebimento !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataRecebimento)) {
    throw httpError(400, 'Informe a data de recebimento no formato AAAA-MM-DD.');
  }
  const data = new Date(`${dataRecebimento}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== dataRecebimento) {
    throw httpError(400, 'A data de recebimento informada não existe.');
  }
  const quantidade = Number(quantidadeRecebida);
  if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 9999999.999 || Math.round(quantidade * 1000) !== quantidade * 1000) {
    throw httpError(400, 'A quantidade deve ser maior que zero e ter no máximo três casas decimais.');
  }
  for (const [campo, limite, nome] of [
    ['classificacao', 120, 'Classificação'],
    ['localizacao', 120, 'Localização'],
  ]) {
    if (body[campo] != null && (typeof body[campo] !== 'string' || body[campo].trim().length > limite)) {
      throw httpError(400, `${nome} deve ter até ${limite} caracteres.`);
    }
  }
  if (body.observacoes != null && typeof body.observacoes !== 'string') {
    throw httpError(400, 'Observações devem ser texto.');
  }
  return {
    codigo: codigo.trim(),
    fornecedorId: Number(fornecedorId),
    classificacao: body.classificacao?.trim() || null,
    dataRecebimento,
    quantidadeRecebida: quantidade,
    localizacao: body.localizacao?.trim() || null,
    observacoes: body.observacoes?.trim() || null,
  };
}

function responderErroBanco(error, next) {
  if (error.code === 'ER_DUP_ENTRY') return next(httpError(409, 'Já existe uma amostra com esse código.'));
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return next(httpError(400, 'Fornecedor não encontrado.'));
  return next(error);
}

async function listar(req, res) {
  const filtros = [];
  const parametros = [];
  const { codigo, fornecedorId, classificacao, localizacao, recebidaDe, recebidaAte } = req.query;
  if (codigo) { filtros.push('a.codigo LIKE ?'); parametros.push(`%${String(codigo).slice(0, 80)}%`); }
  if (fornecedorId && Number.isInteger(Number(fornecedorId)) && Number(fornecedorId) > 0) {
    filtros.push('a.fornecedor_id = ?'); parametros.push(Number(fornecedorId));
  }
  if (classificacao) { filtros.push('a.classificacao LIKE ?'); parametros.push(`%${String(classificacao).slice(0, 120)}%`); }
  if (localizacao) { filtros.push('a.localizacao LIKE ?'); parametros.push(`%${String(localizacao).slice(0, 120)}%`); }
  if (recebidaDe && /^\d{4}-\d{2}-\d{2}$/.test(recebidaDe)) { filtros.push('a.data_recebimento >= ?'); parametros.push(recebidaDe); }
  if (recebidaAte && /^\d{4}-\d{2}-\d{2}$/.test(recebidaAte)) { filtros.push('a.data_recebimento <= ?'); parametros.push(recebidaAte); }
  const [amostras] = await pool.execute(
    `SELECT a.id, a.codigo, a.fornecedor_id AS fornecedorId, f.codigo AS codigoFornecedor,
            f.nome AS fornecedor, a.classificacao, a.data_recebimento AS dataRecebimento,
            a.quantidade_recebida AS quantidadeRecebida,
            COALESCE(SUM(e.quantidade_enviada), 0) AS quantidadeEnviada,
            a.quantidade_recebida - COALESCE(SUM(e.quantidade_enviada), 0) AS quantidadeDisponivel,
            a.localizacao, a.observacoes, a.criado_em AS criadoEm
     FROM amostras a
     JOIN fornecedores f ON f.id = a.fornecedor_id
     LEFT JOIN envios e ON e.amostra_id = a.id
     ${filtros.length ? `WHERE ${filtros.join(' AND ')}` : ''}
     GROUP BY a.id, f.id
     ORDER BY a.data_recebimento DESC, a.id DESC`,
    parametros,
  );
  const status = req.query.status;
  const filtradas = status === 'disponivel'
    ? amostras.filter((item) => Number(item.quantidadeDisponivel) > 0)
    : status === 'esgotada' ? amostras.filter((item) => Number(item.quantidadeDisponivel) <= 0) : amostras;
  return res.json({ amostras: filtradas });
}

async function buscarPorId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next(httpError(400, 'ID de amostra inválido.'));
  const [amostras] = await pool.execute(
    `SELECT a.id, a.codigo, a.fornecedor_id AS fornecedorId, f.codigo AS codigoFornecedor,
            f.nome AS fornecedor, a.classificacao, a.data_recebimento AS dataRecebimento,
            a.quantidade_recebida AS quantidadeRecebida,
            COALESCE((SELECT SUM(e.quantidade_enviada) FROM envios e WHERE e.amostra_id = a.id), 0) AS quantidadeEnviada,
            a.quantidade_recebida - COALESCE((SELECT SUM(e.quantidade_enviada) FROM envios e WHERE e.amostra_id = a.id), 0) AS quantidadeDisponivel,
            a.localizacao, a.observacoes, a.criado_em AS criadoEm
     FROM amostras a JOIN fornecedores f ON f.id = a.fornecedor_id WHERE a.id = ?`,
    [id],
  );
  if (!amostras.length) return next(httpError(404, 'Amostra não encontrada.'));
  return res.json({ amostra: amostras[0] });
}

async function criar(req, res, next) {
  let dados;
  try { dados = validarAmostra(req.body); } catch (error) { return next(error); }
  try {
    const [result] = await pool.execute(
      `INSERT INTO amostras
       (codigo, fornecedor_id, classificacao, data_recebimento, quantidade_recebida, localizacao, observacoes, registrado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dados.codigo, dados.fornecedorId, dados.classificacao, dados.dataRecebimento,
        dados.quantidadeRecebida, dados.localizacao, dados.observacoes, req.usuario.id],
    );
    return res.status(201).json({ message: 'Amostra cadastrada.', id: result.insertId });
  } catch (error) { return responderErroBanco(error, next); }
}

async function atualizar(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next(httpError(400, 'ID de amostra inválido.'));
  let dados;
  try { dados = validarAmostra(req.body); } catch (error) { return next(error); }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[existente]] = await connection.execute(
      'SELECT id FROM amostras WHERE id = ? FOR UPDATE', [id],
    );
    if (!existente) {
      await connection.rollback();
      return next(httpError(404, 'Amostra não encontrada.'));
    }
    const [[{ enviada }]] = await connection.execute(
      'SELECT COALESCE(SUM(quantidade_enviada), 0) AS enviada FROM envios WHERE amostra_id = ?', [id],
    );
    if (Math.round(dados.quantidadeRecebida * 1000) < Math.round(Number(enviada) * 1000)) {
      await connection.rollback();
      return next(httpError(409, 'A quantidade recebida não pode ficar abaixo do total já enviado.'));
    }
    await connection.execute(
      `UPDATE amostras SET codigo = ?, fornecedor_id = ?, classificacao = ?, data_recebimento = ?,
       quantidade_recebida = ?, localizacao = ?, observacoes = ? WHERE id = ?`,
      [dados.codigo, dados.fornecedorId, dados.classificacao, dados.dataRecebimento,
        dados.quantidadeRecebida, dados.localizacao, dados.observacoes, id],
    );
    await connection.commit();
    return res.json({ message: 'Amostra atualizada.', id });
  } catch (error) {
    await connection.rollback().catch(() => {});
    return responderErroBanco(error, next);
  } finally { connection.release(); }
}

async function remover(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return next(httpError(400, 'ID de amostra inválido.'));
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[amostra]] = await connection.execute('SELECT id FROM amostras WHERE id = ? FOR UPDATE', [id]);
    if (!amostra) {
      await connection.rollback();
      return next(httpError(404, 'Amostra não encontrada.'));
    }
    const [[{ total }]] = await connection.execute('SELECT COUNT(*) AS total FROM envios WHERE amostra_id = ?', [id]);
    if (Number(total) > 0) {
      await connection.rollback();
      return next(httpError(409, 'A amostra possui envios registrados e não pode ser excluída.'));
    }
    await connection.execute('DELETE FROM amostras WHERE id = ?', [id]);
    await connection.commit();
    return res.json({ message: 'Amostra excluída.' });
  } catch (error) {
    await connection.rollback().catch(() => {});
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return next(httpError(409, 'A amostra possui movimentações e não pode ser excluída.'));
    return next(error);
  } finally { connection.release(); }
}

module.exports = { listar, buscarPorId, criar, atualizar, remover };
