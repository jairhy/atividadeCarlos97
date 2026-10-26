// Restringe o acesso à rede interna (loopback + faixas privadas RFC 1918 / ULA IPv6)
const { redeInterna } = require('../config/env')

function ipInterno(ip = '') {
    const v4 = ip.replace(/^::ffff:/, '')
    if (v4 === '::1' || v4 === '127.0.0.1' || v4.startsWith('127.')) return true
    if (/^10\./.test(v4)) return true
    if (/^192\.168\./.test(v4)) return true
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(v4)) return true
    if (/^f[cd][0-9a-f]{2}:/i.test(v4) || /^fe80:/i.test(v4)) return true
    return false
}

function redeMiddleware(req, res, next) {
    if (!redeInterna || ipInterno(req.socket.remoteAddress)) return next()
    return res.status(403).json({ message: 'Acesso permitido somente pela rede interna.' })
}

module.exports = redeMiddleware
module.exports.ipInterno = ipInterno
