const { pool } = require('../database/conexao');

async function consultar(req, res) {
  const [[totais]] = await pool.query(
    `SELECT COUNT(*) AS totalAmostras,
       SUM(q.disponivel > 0) AS amostrasDisponiveis,
       SUM(q.enviada > 0) AS amostrasComEnvio,
       SUM(q.disponivel <= 0) AS amostrasEsgotadas
     FROM (
       SELECT a.id, a.quantidade_recebida - COALESCE(SUM(e.quantidade_enviada), 0) AS disponivel,
              COALESCE(SUM(e.quantidade_enviada), 0) AS enviada
       FROM amostras a LEFT JOIN envios e ON e.amostra_id = a.id
       GROUP BY a.id
     ) q`,
  );
  const [enviosRecentes] = await pool.query(
    `SELECT e.id, a.codigo AS codigoAmostra, c.nome AS cliente,
            e.data_envio AS dataEnvio, e.quantidade_enviada AS quantidadeEnviada
     FROM envios e JOIN amostras a ON a.id = e.amostra_id
     JOIN clientes c ON c.id = e.cliente_id
     ORDER BY e.data_envio DESC, e.id DESC LIMIT 5`,
  );
  return res.json({ indicadores: totais, enviosRecentes });
}

module.exports = { consultar };
