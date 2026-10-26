require('dotenv').config()

const config = {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '0.0.0.0',
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        name: process.env.DB_NAME || 'db_logistica',
        user: process.env.DB_USER || 'root',
        pass: process.env.DB_PASS || 'senai'
    },
    jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-troque-em-producao-0123456789',
    chaveCripto: process.env.CHAVE_CRIPTO || 'dev-chave-aes-troque-em-producao-0123456789',
    // Sessão do sistema: 180 minutos (RF/RN do enunciado)
    sessaoMinutos: 180,
    redeInterna: process.env.REDE_INTERNA !== 'false'
}

module.exports = config
