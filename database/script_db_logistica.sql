-- =====================================================================
-- Sistema de Gestão e Rastreamento de Encomendas - Logística Express
-- Script do banco de dados: db_logistica   (MySQL 8 / MariaDB 10.11+)
--
-- * Senhas de funcionários: hash bcrypt (senha de teste: Senha@123)
-- * CNH e CPF dos motoristas: AES-256-GCM (formato iv:tag:dados em base64).
--   Os valores abaixo foram gerados com a chaveCripto do arquivo
--   backend/config/config.js. Se você trocar a chave, rode "npm run seed"
--   (após "npm run sync") para regerar os registros iniciais.
-- =====================================================================

SET NAMES utf8mb4;
DROP DATABASE IF EXISTS db_logistica;
CREATE DATABASE db_logistica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE db_logistica;

-- ---------------------------------------------------------------------
CREATE TABLE funcionarios (
    codFuncionario INT          NOT NULL AUTO_INCREMENT,
    nome           VARCHAR(100) NOT NULL,
    email          VARCHAR(100) NOT NULL,
    senha          VARCHAR(100) NOT NULL COMMENT 'hash bcrypt',
    PRIMARY KEY (codFuncionario),
    UNIQUE KEY uq_funcionarios_email (email)
) ENGINE=InnoDB;

CREATE TABLE motoristas (
    codMotorista INT          NOT NULL AUTO_INCREMENT,
    nome         VARCHAR(100) NOT NULL,
    cnh          VARCHAR(255) NOT NULL COMMENT 'criptografada AES-256-GCM',
    cpf          VARCHAR(255) NOT NULL COMMENT 'criptografado AES-256-GCM',
    cpfHash      CHAR(64)     NOT NULL COMMENT 'HMAC-SHA256 do CPF (evita duplicidade sem expor o CPF)',
    telefone     VARCHAR(20)  NOT NULL,
    PRIMARY KEY (codMotorista),
    UNIQUE KEY uq_motoristas_cpfhash (cpfHash)
) ENGINE=InnoDB;

CREATE TABLE cargas (
    codCarga        INT           NOT NULL AUTO_INCREMENT,
    descricao       VARCHAR(100)  NOT NULL,
    peso            DECIMAL(10,2) NOT NULL COMMENT 'kg',
    volume          DECIMAL(10,3) NOT NULL COMMENT 'm3',
    codigoRastreio  BIGINT        NOT NULL COMMENT '11 dígitos numéricos',
    codigoMotorista INT           NOT NULL,
    PRIMARY KEY (codCarga),
    UNIQUE KEY uq_cargas_rastreio (codigoRastreio),
    CONSTRAINT fk_cargas_motorista FOREIGN KEY (codigoMotorista)
        REFERENCES motoristas (codMotorista) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_cargas_peso   CHECK (peso > 0),
    CONSTRAINT ck_cargas_volume CHECK (volume > 0)
) ENGINE=InnoDB;

CREATE TABLE entregas (
    codEntrega    INT          NOT NULL AUTO_INCREMENT,
    cidadeDestino VARCHAR(100) NOT NULL,
    status        ENUM('ENTREGUE','TRANSITO') NOT NULL DEFAULT 'TRANSITO',
    data          DATE         NOT NULL,
    hora          TIME         NOT NULL,
    idCarga       INT          NOT NULL,
    idFuncionario INT          NOT NULL COMMENT 'funcionário que registrou',
    PRIMARY KEY (codEntrega),
    UNIQUE KEY uq_entregas_carga (idCarga),
    KEY idx_entregas_data (data, hora),
    CONSTRAINT fk_entregas_carga FOREIGN KEY (idCarga)
        REFERENCES cargas (codCarga) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_entregas_funcionario FOREIGN KEY (idFuncionario)
        REFERENCES funcionarios (codFuncionario) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Registros iniciais (3 por tabela)
-- ---------------------------------------------------------------------
INSERT INTO funcionarios (nome, email, senha) VALUES
    ('Carlos Almeida', 'carlos@logisticaexpress.com', '$2a$10$4pjlScJFmZTEvZ0dcTPIAOjwGXKe4vRkG95vnEetJfOIK9BgAHE.q'),
    ('Mariana Souza', 'mariana@logisticaexpress.com', '$2a$10$4pjlScJFmZTEvZ0dcTPIAOjwGXKe4vRkG95vnEetJfOIK9BgAHE.q'),
    ('Roberto Lima', 'roberto@logisticaexpress.com', '$2a$10$4pjlScJFmZTEvZ0dcTPIAOjwGXKe4vRkG95vnEetJfOIK9BgAHE.q');

INSERT INTO motoristas (nome, cnh, cpf, cpfHash, telefone) VALUES
    ('João Pereira', 'irfCRO1KOe49Ch4w:2PimSHDKav//uO6ZLJp7zA==:pdQyAf+gLvUkBzw=', '5BZ2EyaL4jPMf5gn:M9wVnNbmLab8AUl41VnFYQ==:uEJvthBlG+rEwqs=', 'e57a8afc41a0821ea75fa51ce52fd62dcc42c8134fea8fdfe4895f4ec1f78d75', '47991112233'),
    ('Ana Beatriz Costa', 'nJyl8ewO9XuEvJWV:wNsFpdgpRYJTEqnHRN07Fw==:z/UjJsHWterCeEY=', '3Ci3YDCk/kgHgy3O:g5n/HpyygPuY4xpwPGKjRQ==:HZZIYfimW8IK4CU=', '820fca8b1b4ae4c920f09f24ae5475dceb1739655a169ec308bfd03e6398d6e7', '47992223344'),
    ('Pedro Henrique Santos', 'hE/7VuoPuxmH/roX:evxY/7NXi08THXTi9IVxQQ==:hOAOZ1vV/nFeAnw=', 'codn2nAcZm54zMdt:vCd2kYjAaapJCW4ftBsimA==:iuRTdtLmn9ygKuE=', 'd6950a79dfcba648d281831142840c0bfc9541d832ec0d49a8cc57a967d84c47', '47993334455');

INSERT INTO cargas (descricao, peso, volume, codigoRastreio, codigoMotorista) VALUES
    ('Caixas de eletrônicos', 350.50, 2.400, 10000000001, 1),
    ('Material de escritório', 120.00, 1.100, 10000000002, 2),
    ('Peças automotivas', 780.25, 3.800, 10000000003, 3);

INSERT INTO entregas (cidadeDestino, status, data, hora, idCarga, idFuncionario) VALUES
    ('Curitiba',      'TRANSITO', '2026-10-20', '08:30:00', 1, 1),
    ('Florianópolis', 'ENTREGUE', '2026-10-22', '14:15:00', 2, 2),
    ('Porto Alegre',  'TRANSITO', '2026-10-25', '10:00:00', 3, 3);

-- ---------------------------------------------------------------------
-- Consulta de exemplo: entregas ordenadas por data (mais recentes primeiro)
-- ---------------------------------------------------------------------
-- SELECT e.codEntrega, e.data, e.hora, e.cidadeDestino, e.status, c.codigoRastreio, m.nome AS motorista
--   FROM entregas e JOIN cargas c ON c.codCarga = e.idCarga JOIN motoristas m ON m.codMotorista = c.codigoMotorista
--  ORDER BY e.data DESC, e.hora DESC;
