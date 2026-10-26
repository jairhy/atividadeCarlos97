// Criptografia reversível (AES-256-GCM) para CNH e CPF,
// e HMAC determinístico para garantir unicidade do CPF sem expô-lo.
const crypto = require('crypto')
const { chaveCripto } = require('../config/env')

const KEY = crypto.scryptSync(chaveCripto, 'logistica-express-salt', 32)

function criptografar(texto) {
    const iv = crypto.randomBytes(12)
    const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv)
    const enc = Buffer.concat([cipher.update(String(texto), 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return [iv, tag, enc].map(b => b.toString('base64')).join(':')
}

function descriptografar(payload) {
    const [iv, tag, enc] = payload.split(':').map(p => Buffer.from(p, 'base64'))
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

function hashDeterministico(texto) {
    return crypto.createHmac('sha256', KEY).update(String(texto)).digest('hex')
}

module.exports = { criptografar, descriptografar, hashDeterministico }
