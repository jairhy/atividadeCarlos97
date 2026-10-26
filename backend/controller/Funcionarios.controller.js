const bcrypt = require('bcryptjs')
const Funcionario = require('../models/Funcionario')
const { texto, emailValido } = require('../utils/validators')

const serializar = (f) => ({ codFuncionario: f.codFuncionario, nome: f.nome, email: f.email })

const cadastrar = async (req, res) => {
    const { nome, email, senha } = req.body || {}

    if (!texto(nome) || !emailValido(email) || typeof senha !== 'string') {
        return res.status(400).json({ message: 'Nome, e-mail válido e senha são obrigatórios.' })
    }
    if (senha.length < 8) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 8 caracteres.' })
    }

    const f = await Funcionario.create({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: await bcrypt.hash(senha, 10)
    })
    return res.status(201).json({ message: 'Funcionário cadastrado com sucesso!', funcionario: serializar(f) })
}

const listar = async (_req, res) => {
    const lista = await Funcionario.findAll({ order: [['nome', 'ASC']] })
    return res.status(200).json(lista.map(serializar))
}

module.exports = { cadastrar, listar }
