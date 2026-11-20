USE fluxa;

START TRANSACTION;

-- Dados fictícios para desenvolvimento local. Execute schema.sql primeiro.
INSERT INTO fornecedores (codigo, nome)
SELECT 'FOR-001', 'Fazenda Exemplo' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM fornecedores WHERE codigo = 'FOR-001');

INSERT INTO fornecedores (codigo, nome)
SELECT 'FOR-002', 'Cooperativa Modelo' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM fornecedores WHERE codigo = 'FOR-002');

INSERT INTO clientes (nome, pais, email)
SELECT 'Cliente Demonstração', 'Brasil', 'cliente.demo@example.com' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'cliente.demo@example.com');

INSERT INTO clientes (nome, pais, email)
SELECT 'Importadora Exemplo', 'Alemanha', 'importadora.demo@example.com' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'importadora.demo@example.com');

INSERT INTO amostras
  (codigo, fornecedor_id, classificacao, data_recebimento, quantidade_recebida, localizacao, observacoes)
SELECT 'FOR-001-1', f.id, 'Arábica - bebida especial', '2025-01-15', 1.000, 'Estante A1', 'Registro de demonstração'
FROM fornecedores f
WHERE f.codigo = 'FOR-001'
  AND NOT EXISTS (SELECT 1 FROM amostras WHERE codigo = 'FOR-001-1');

INSERT INTO amostras
  (codigo, fornecedor_id, classificacao, data_recebimento, quantidade_recebida, localizacao, observacoes)
SELECT 'FOR-002-1', f.id, 'Arábica - bebida fina', '2025-02-10', 2.500, 'Estante B2', 'Registro de demonstração'
FROM fornecedores f
WHERE f.codigo = 'FOR-002'
  AND NOT EXISTS (SELECT 1 FROM amostras WHERE codigo = 'FOR-002-1');

INSERT INTO envios
  (amostra_id, cliente_id, pais_destino, data_envio, quantidade_enviada, referencia, observacoes)
SELECT a.id, c.id, c.pais, '2025-02-01', 0.250, 'PEDIDO-DEMO-001', 'Envio de demonstração'
FROM amostras a
JOIN clientes c ON c.email = 'cliente.demo@example.com'
WHERE a.codigo = 'FOR-001-1'
  AND NOT EXISTS (
    SELECT 1 FROM envios e
    WHERE e.amostra_id = a.id AND e.cliente_id = c.id AND e.referencia = 'PEDIDO-DEMO-001'
  );

COMMIT;
