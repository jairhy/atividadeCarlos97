const path = require('path')
const express = require('express')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const redeMiddleware = require('./middleware/rede.middleware')
const routes = require('./routes')

const app = express()

app.disable('x-powered-by')
app.use(redeMiddleware)                       // somente rede interna
app.use(helmet())                             // cabeçalhos de segurança (CSP, nosniff, etc.)
app.use(express.json({ limit: '100kb' }))

// Limita tentativas de login (força bruta)
if (!global.__TESTE__) {
    app.use('/api/auth/login', rateLimit({
        windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false,
        message: { message: 'Muitas tentativas de login. Aguarde alguns minutos.' }
    }))
}

app.use('/api', routes)
app.use('/api', (_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }))

// Frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')))

// Tratamento centralizado de erros (nunca vaza stack trace)
app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido.' })
    if (err.name === 'SequelizeUniqueConstraintError') {
        const campo = Object.keys(err.fields || {})[0] || ''
        const msg = /cpf/i.test(campo) ? 'Já existe um motorista com este CPF.'
            : /rastreio/i.test(campo) ? 'Já existe uma carga com este código de rastreio.'
            : /email/i.test(campo) ? 'Já existe um funcionário com este e-mail.'
            : /idCarga|id_carga/i.test(campo) ? 'Esta carga já possui uma entrega cadastrada.'
            : 'Registro duplicado.'
        return res.status(409).json({ message: msg })
    }
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        return res.status(409).json({ message: 'Operação não permitida: existem registros vinculados a este item.' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Erro interno do servidor.' })
})

module.exports = app
