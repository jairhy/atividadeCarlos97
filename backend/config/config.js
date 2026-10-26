// Configuração do sistema (sem .env): ajuste os valores aqui diretamente.
const config = {
    port: 3000,
    host: '0.0.0.0',
    db: {
        host: 'localhost',
        port: 3306,
        name: 'db_logistica',
        user: 'root',
        pass: 'senai'
    },
    // Segredos: troque por valores longos e aleatórios antes de usar em produção
    jwtSecret: 'logistica-express-jwt-segredo-troque-em-producao-2026',
    chaveCripto: 'logistica-express-aes-chave-troque-em-producao-2026',
    // Sessão do sistema: 180 minutos
    sessaoMinutos: 180,
    // true = só aceita acessos da rede interna (localhost, 10.x, 172.16-31.x, 192.168.x)
    redeInterna: true
}

module.exports = config
