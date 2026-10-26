const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Funcionario = require('../models/Funcionario')
const { jwtSecret, sessaoMinutos } = require('../config/env')
const { emailValido } = require('../utils/validators')

// hash fictício para igualar o tempo de resposta quando o e-mail não existe
const HASH_FALSO = bcrypt.hashSync('senha-inexistente', 10)

const login = async (req, res) => {
    const { email, senha } = req.body || {}

    if (typeof email !== 'string' || typeof senha !== 'string' || !email || !senha) {
        return res.status(400).json({ message: 'Informe e-mail e senha.' })
    }
    if (!emailValido(email)) {
        return res.status(400).json({ message: 'E-mail inválido.' })
    }

    const func = await Funcionario.findOne({ where: { email: email.trim().toLowerCase() } })
    const ok = await bcrypt.compare(senha, func ? func.senha : HASH_FALSO)

    if (!func || !ok) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos.' })
    }

    const payload = { codFuncionario: func.codFuncionario, nome: func.nome, email: func.email }
    const token = jwt.sign(payload, jwtSecret, { expiresIn: `${sessaoMinutos}m` })
    const { exp } = jwt.decode(token)

    return res.status(200).json({
        message: 'Login realizado com sucesso!',
        token,
        expiraEm: exp * 1000,
        sessaoMinutos,
        funcionario: payload
    })
}

// Dados do funcionário logado (usado na página principal)
const me = async (req, res) => {
    const { codFuncionario, nome, email, exp } = req.usuario
    return res.status(200).json({ funcionario: { codFuncionario, nome, email }, expiraEm: exp * 1000 })
}

// O token é stateless: o logout efetivo é descartar o token no cliente.
const logout = async (_req, res) => res.status(200).json({ message: 'Logout realizado com sucesso!' })

module.exports = { login, me, logout }
