const { Router } = require('express')
const auth = require('../middleware/auth.middleware')
const A = require('../controller/Auth.controller')
const F = require('../controller/Funcionarios.controller')
const M = require('../controller/Motorista.controller')
const C = require('../controller/Carga.controller')
const E = require('../controller/Entrega.controller')

const r = Router()

// Garante que :id seja um inteiro positivo
r.param('id', (req, res, next, id) => {
    if (!/^\d+$/.test(id) || Number(id) <= 0) return res.status(400).json({ message: 'Identificador inválido.' })
    next()
})

r.get('/health', (_req, res) => res.json({ status: 'ok' }))

// Autenticação
r.post('/auth/login', A.login)
r.get('/auth/me', auth, A.me)
r.post('/auth/logout', auth, A.logout)

// Funcionários (cadastro apenas por funcionário autenticado)
r.get('/funcionarios', auth, F.listar)
r.post('/funcionarios', auth, F.cadastrar)

// Motoristas - CRUD + busca por nome (?nome=)
r.get('/motoristas', auth, M.listar)
r.post('/motoristas', auth, M.cadastrar)
r.get('/motoristas/:id', auth, M.consultar)
r.put('/motoristas/:id', auth, M.atualizar)
r.delete('/motoristas/:id', auth, M.apagar)

// Cargas
r.get('/cargas', auth, C.listar)
r.post('/cargas', auth, C.cadastrar)
r.get('/cargas/:id', auth, C.consultar)
r.put('/cargas/:id', auth, C.atualizar)
r.delete('/cargas/:id', auth, C.apagar)

// Entregas (filtro/ordenação por data em GET /entregas)
r.get('/entregas', auth, E.listar)
r.post('/entregas', auth, E.cadastrar)
r.get('/entregas/:id', auth, E.consultar)
r.put('/entregas/:id', auth, E.atualizar)
r.delete('/entregas/:id', auth, E.apagar)

module.exports = r
