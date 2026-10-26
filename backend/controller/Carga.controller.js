const Carga = require('../models/Carga')
const Motorista = require('../models/Motorista')
const v = require('../utils/validators')

const INCLUDE = [{ model: Motorista, as: 'motorista', attributes: ['codMotorista', 'nome'] }]

const serializar = (c) => ({
    codCarga: c.codCarga,
    descricao: c.descricao,
    peso: Number(c.peso),
    volume: Number(c.volume),
    codigoRastreio: String(c.codigoRastreio),
    codigoMotorista: c.codigoMotorista,
    motorista: c.motorista ? { codMotorista: c.motorista.codMotorista, nome: c.motorista.nome } : null
})

function validar(b) {
    if (!v.texto(b.descricao)) return 'Descrição é obrigatória (até 100 caracteres).'
    if (!v.numeroPositivo(b.peso)) return 'Peso deve ser um número maior que zero (kg).'
    if (!v.numeroPositivo(b.volume)) return 'Volume deve ser um número maior que zero (m³).'
    if (!v.rastreioValido(b.codigoRastreio)) return 'O código de rastreio deve conter exatamente 11 dígitos numéricos.'
    if (!Number.isInteger(Number(b.codigoMotorista)) || Number(b.codigoMotorista) <= 0) return 'Selecione o motorista da carga.'
    return null
}

const montar = (b) => ({
    descricao: b.descricao.trim(),
    peso: Number(b.peso),
    volume: Number(b.volume),
    codigoRastreio: String(b.codigoRastreio),
    codigoMotorista: Number(b.codigoMotorista)
})

async function motoristaExiste(id) {
    return !!(await Motorista.findByPk(id, { attributes: ['codMotorista'] }))
}

const cadastrar = async (req, res) => {
    const body = req.body || {}
    const erro = validar(body)
    if (erro) return res.status(400).json({ message: erro })
    if (!(await motoristaExiste(body.codigoMotorista))) {
        return res.status(404).json({ message: 'Motorista informado não existe.' })
    }

    const c = await Carga.create(montar(body))
    const completa = await Carga.findByPk(c.codCarga, { include: INCLUDE })
    return res.status(201).json({ message: 'Carga cadastrada com sucesso!', carga: serializar(completa) })
}

const listar = async (req, res) => {
    const where = {}
    if (req.query.codigoMotorista && Number.isInteger(Number(req.query.codigoMotorista))) {
        where.codigoMotorista = Number(req.query.codigoMotorista)
    }
    const lista = await Carga.findAll({ where, include: INCLUDE, order: [['codCarga', 'ASC']] })
    return res.status(200).json(lista.map(serializar))
}

const consultar = async (req, res) => {
    const c = await Carga.findByPk(req.params.id, { include: INCLUDE })
    if (!c) return res.status(404).json({ message: 'Carga não encontrada.' })
    return res.status(200).json(serializar(c))
}

const atualizar = async (req, res) => {
    const c = await Carga.findByPk(req.params.id)
    if (!c) return res.status(404).json({ message: 'Carga não encontrada.' })

    const body = req.body || {}
    const erro = validar(body)
    if (erro) return res.status(400).json({ message: erro })
    if (!(await motoristaExiste(body.codigoMotorista))) {
        return res.status(404).json({ message: 'Motorista informado não existe.' })
    }

    await c.update(montar(body))
    const completa = await Carga.findByPk(c.codCarga, { include: INCLUDE })
    return res.status(200).json({ message: 'Carga atualizada com sucesso!', carga: serializar(completa) })
}

const apagar = async (req, res) => {
    const c = await Carga.findByPk(req.params.id)
    if (!c) return res.status(404).json({ message: 'Carga não encontrada.' })
    await c.destroy()   // 409 se houver entrega vinculada
    return res.status(200).json({ message: 'Carga excluída com sucesso!' })
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
