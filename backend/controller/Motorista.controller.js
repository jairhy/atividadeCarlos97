const { Op } = require('sequelize')
const Motorista = require('../models/Motorista')
const { criptografar, descriptografar, hashDeterministico } = require('../utils/crypto')
const v = require('../utils/validators')

// Nunca devolve dado criptografado: CNH e CPF saem descriptografados
const serializar = (m) => ({
    codMotorista: m.codMotorista,
    nome: m.nome,
    cnh: descriptografar(m.cnh),
    cpf: descriptografar(m.cpf),
    telefone: m.telefone
})

function validar(b) {
    if (!v.texto(b.nome)) return 'Nome é obrigatório (até 100 caracteres).'
    if (!v.cnhValida(b.cnh)) return 'CNH inválida: informe 11 dígitos.'
    if (!v.cpfValido(b.cpf)) return 'CPF inválido.'
    if (!v.telefoneValido(b.telefone)) return 'Telefone inválido: informe DDD + número (10 ou 11 dígitos).'
    return null
}

const montar = (b) => {
    const cpf = v.soDigitos(b.cpf)
    return {
        nome: b.nome.trim(),
        cnh: criptografar(v.soDigitos(b.cnh)),
        cpf: criptografar(cpf),
        cpfHash: hashDeterministico(cpf),
        telefone: v.soDigitos(b.telefone)
    }
}

const cadastrar = async (req, res) => {
    const body = req.body || {}
    const erro = validar(body)
    if (erro) return res.status(400).json({ message: erro })

    const m = await Motorista.create(montar(body))
    return res.status(201).json({ message: 'Motorista cadastrado com sucesso!', motorista: serializar(m) })
}

// Lista todos ou busca por nome: GET /api/motoristas?nome=ana
const listar = async (req, res) => {
    const where = {}
    const nome = typeof req.query.nome === 'string' ? req.query.nome.trim() : ''
    if (nome) {
        const seguro = nome.replace(/[\\%_]/g, (c) => '\\' + c)
        where.nome = { [Op.like]: `%${seguro}%` }
    }
    const lista = await Motorista.findAll({ where, order: [['nome', 'ASC']] })
    return res.status(200).json(lista.map(serializar))
}

const consultar = async (req, res) => {
    const m = await Motorista.findByPk(req.params.id)
    if (!m) return res.status(404).json({ message: 'Motorista não encontrado.' })
    return res.status(200).json(serializar(m))
}

const atualizar = async (req, res) => {
    const m = await Motorista.findByPk(req.params.id)
    if (!m) return res.status(404).json({ message: 'Motorista não encontrado.' })

    const body = req.body || {}
    const erro = validar(body)
    if (erro) return res.status(400).json({ message: erro })

    await m.update(montar(body))
    return res.status(200).json({ message: 'Motorista atualizado com sucesso!', motorista: serializar(m) })
}

const apagar = async (req, res) => {
    const m = await Motorista.findByPk(req.params.id)
    if (!m) return res.status(404).json({ message: 'Motorista não encontrado.' })
    await m.destroy()   // FK RESTRICT -> 409 se houver cargas (tratado no errorHandler)
    return res.status(200).json({ message: 'Motorista excluído com sucesso!' })
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
