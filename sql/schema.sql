CREATE DATABASE IF NOT EXISTS fluxa
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fluxa;

CREATE TABLE IF NOT EXISTS perfis (
  id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_perfis_nome (nome)
) ENGINE=InnoDB;

INSERT IGNORE INTO perfis (id, nome) VALUES
  (1, 'administrador'),
  (2, 'funcionario');

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil_id TINYINT UNSIGNED NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email),
  KEY idx_usuarios_perfil (perfil_id),
  CONSTRAINT fk_usuarios_perfis FOREIGN KEY (perfil_id) REFERENCES perfis (id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS fornecedores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(30) NOT NULL,
  nome VARCHAR(160) NOT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_fornecedores_codigo (codigo),
  KEY idx_fornecedores_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clientes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome VARCHAR(160) NOT NULL,
  pais VARCHAR(100) NULL,
  email VARCHAR(254) NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_clientes_nome (nome)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS amostras (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo VARCHAR(80) NOT NULL,
  fornecedor_id BIGINT UNSIGNED NOT NULL,
  classificacao VARCHAR(120) NULL,
  data_recebimento DATE NOT NULL,
  quantidade_recebida DECIMAL(10,3) UNSIGNED NOT NULL,
  localizacao VARCHAR(120) NULL,
  observacoes TEXT NULL,
  registrado_por BIGINT UNSIGNED NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_amostras_codigo (codigo),
  KEY idx_amostras_fornecedor (fornecedor_id),
  KEY idx_amostras_data_recebimento (data_recebimento),
  CONSTRAINT chk_amostras_quantidade CHECK (quantidade_recebida > 0),
  CONSTRAINT fk_amostras_fornecedores FOREIGN KEY (fornecedor_id) REFERENCES fornecedores (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_amostras_usuarios FOREIGN KEY (registrado_por) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS envios (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  amostra_id BIGINT UNSIGNED NOT NULL,
  cliente_id BIGINT UNSIGNED NOT NULL,
  pais_destino VARCHAR(100) NULL,
  data_envio DATE NOT NULL,
  quantidade_enviada DECIMAL(10,3) UNSIGNED NOT NULL,
  referencia VARCHAR(120) NULL,
  responsavel_id BIGINT UNSIGNED NULL,
  observacoes TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_envios_amostra (amostra_id),
  KEY idx_envios_cliente (cliente_id),
  KEY idx_envios_data (data_envio),
  CONSTRAINT chk_envios_quantidade CHECK (quantidade_enviada > 0),
  CONSTRAINT fk_envios_amostras FOREIGN KEY (amostra_id) REFERENCES amostras (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_envios_clientes FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_envios_usuarios FOREIGN KEY (responsavel_id) REFERENCES usuarios (id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
