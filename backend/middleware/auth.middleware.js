const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config/config')

// Exige "Authorization: Bearer <token>" válido e não expirado (180 min)
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || ''
    const [tipo, token] = header.split(' ')

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Acesso negado! Token não fornecido.' })
    }

    try {
        req.usuario = jwt.verify(token, jwtSecret)
        return next()
    } catch (err) {
        const expirou = err.name === 'TokenExpiredError'
        return res.status(401).json({
            message: expirou ? 'Sessão expirada! Faça login novamente.' : 'Token inválido!'
        })
    }
}

module.exports = authMiddleware
