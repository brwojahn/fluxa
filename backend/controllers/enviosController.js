const { pool } = require('../database/conexao');
const httpError = require('../utils/httpError');

function validar(body) {
  const { amostraId, clienteId, dataEnvio, quantidadeEnviada } = body || {};
  for (const [valor, nome] of [[amostraId, 'amostra'], [clienteId, 'cliente']]) {
    if (!Number.isSafeInteger(Number(valor)) || Number(valor) < 1) throw httpError(400, `Selecione uma ${nome} válida.`);
  }
  if (typeof dataEnvio !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dataEnvio)) {
    throw httpError(400, 'Informe a data do envio no formato AAAA-MM-DD.');
  }
  const data = new Date(`${dataEnvio}T00:00:00Z`);
  if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== dataEnvio) {
    throw httpError(400, 'A data de envio informada não existe.');
  }
  const quantidade = Number(quantidadeEnviada);
  if (!Number.isFinite(quantidade) || quantidade <= 0 || quantidade > 9999999.999 || Math.round(quantidade * 1000) !== quantidade * 1000) {
    throw httpError(400, 'A quantidade deve ser maior que zero e ter no máximo três casas decimais.');
  }
  for (const [campo, limite, nome] of [
    ['paisDestino', 100, 'País de destino'], ['referencia', 120, 'Referência'],
  ]) {
    if (body[campo] != null && (typeof body[campo] !== 'string' || body[campo].trim().length > limite)) {
      throw httpError(400, `${nome} deve ter até ${limite} caracteres.`);
    }
  }
  if (body.observacoes != null && typeof body.observacoes !== 'string') throw httpError(400, 'Observações devem ser texto.');
  return {
    amostraId: Number(amostraId), clienteId: Number(clienteId), dataEnvio,
    quantidadeEnviada: quantidade,
    paisDestino: body.paisDestino?.trim() || null,
    referencia: body.referencia?.trim() || null,
    observacoes: body.observacoes?.trim() || null,
  };
}

async function listar(req, res) {
  const where = [];
  const params = [];
  if (req.query.amostra) { where.push('a.codigo LIKE ?'); params.push(`%${String(req.query.amostra).slice(0, 80)}%`); }
  if (req.query.clienteId && Number.isSafeInteger(Number(req.query.clienteId))) {
    where.push('e.cliente_id = ?'); params.push(Number(req.query.clienteId));
  }
  if (req.query.dataDe && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dataDe)) {
    where.push('e.data_envio >= ?'); params.push(req.query.dataDe);
  }
  if (req.query.dataAte && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dataAte)) {
    where.push('e.data_envio <= ?'); params.push(req.query.dataAte);
  }
  const [envios] = await pool.execute(
    `SELECT e.id, e.amostra_id AS amostraId, a.codigo AS codigoAmostra,
            e.cliente_id AS clienteId, c.nome AS cliente, e.pais_destino AS paisDestino,
            e.data_envio AS dataEnvio, e.quantidade_enviada AS quantidadeEnviada,
            e.referencia, e.responsavel_id AS responsavelId, u.nome AS responsavel,
            e.observacoes, e.criado_em AS criadoEm
     FROM envios e JOIN amostras a ON a.id = e.amostra_id
     JOIN clientes c ON c.id = e.cliente_id
     LEFT JOIN usuarios u ON u.id = e.responsavel_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY e.data_envio DESC, e.id DESC`, params,
  );
  return res.json({ envios });
}

async function criar(req, res, next) {
  let dados;
  try { dados = validar(req.body); } catch (error) { return next(error); }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // A linha da amostra é bloqueada até o commit para serializar envios concorrentes.
    const [[amostra]] = await connection.execute(
      'SELECT id, quantidade_recebida FROM amostras WHERE id = ? FOR UPDATE', [dados.amostraId],
    );
    if (!amostra) {
      await connection.rollback();
      return next(httpError(404, 'Amostra não encontrada.'));
    }
    const [[{ enviada }]] = await connection.execute(
      'SELECT COALESCE(SUM(quantidade_enviada), 0) AS enviada FROM envios WHERE amostra_id = ?', [dados.amostraId],
    );
    const disponivelMilesimos = Math.round(Number(amostra.quantidade_recebida) * 1000)
      - Math.round(Number(enviada) * 1000);
    const quantidadeMilesimos = Math.round(dados.quantidadeEnviada * 1000);
    if (quantidadeMilesimos > disponivelMilesimos) {
      await connection.rollback();
      return next(httpError(409, `Estoque insuficiente. Quantidade disponível: ${(disponivelMilesimos / 1000).toFixed(3)} kg.`));
    }

    const [result] = await connection.execute(
      `INSERT INTO envios
       (amostra_id, cliente_id, pais_destino, data_envio, quantidade_enviada, referencia, responsavel_id, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dados.amostraId, dados.clienteId, dados.paisDestino, dados.dataEnvio,
        dados.quantidadeEnviada, dados.referencia, req.usuario.id, dados.observacoes],
    );
    await connection.commit();
    return res.status(201).json({ message: 'Envio registrado.', id: result.insertId });
  } catch (error) {
    await connection.rollback().catch(() => {});
    if (error.code === 'ER_NO_REFERENCED_ROW_2') return next(httpError(400, 'Cliente ou amostra não encontrado.'));
    return next(error);
  } finally {
    connection.release();
  }
}

module.exports = { listar, criar };
