const { Op } = require('sequelize')
const Entrega = require('../models/Entrega')
const Carga = require('../models/Carga')
const Motorista = require('../models/Motorista')
const Funcionario = require('../models/Funcionario')
const v = require('../utils/validators')

const STATUS = ['ENTREGUE', 'TRANSITO']

const INCLUDE = [
    {
        model: Carga, as: 'carga', required: true,
        attributes: ['codCarga', 'descricao', 'codigoRastreio'],
        include: [{ model: Motorista, as: 'motorista', attributes: ['codMotorista', 'nome'] }]
    },
    { model: Funcionario, as: 'funcionario', attributes: ['codFuncionario', 'nome'] }
]

const serializar = (e) => ({
    codEntrega: e.codEntrega,
    cidadeDestino: e.cidadeDestino,
    status: e.status,
    data: e.data,
    hora: e.hora,
    idCarga: e.idCarga,
    carga: e.carga ? {
        codCarga: e.carga.codCarga,
        descricao: e.carga.descricao,
        codigoRastreio: String(e.carga.codigoRastreio),
        motorista: e.carga.motorista ? e.carga.motorista.nome : null
    } : null,
    registradoPor: e.funcionario ? e.funcionario.nome : null
})

const agora = () => {
    const d = new Date()
    const p = (n) => String(n).padStart(2, '0')
    return { data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, hora: `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` }
}

function validar(b, { parcial = false } = {}) {
    if (!parcial || b.cidadeDestino !== undefined) {
        if (!v.texto(b.cidadeDestino)) return 'Cidade de destino é obrigatória (até 100 caracteres).'
    }
    if (b.status !== undefined && !STATUS.includes(b.status)) return 'Status inválido: use ENTREGUE ou TRANSITO.'
    if (b.data !== undefined && b.data !== '' && !v.dataValida(b.data)) return 'Data inválida: use AAAA-MM-DD.'
    if (b.hora !== undefined && b.hora !== '' && !v.horaValida(b.hora)) return 'Hora inválida: use HH:MM.'
    return null
}

const normalizaHora = (h) => (h.length === 5 ? `${h}:00` : h)

const cadastrar = async (req, res) => {
    const body = req.body || {}
    if (!Number.isInteger(Number(body.idCarga)) || Number(body.idCarga) <= 0) {
        return res.status(400).json({ message: 'Selecione a carga da entrega.' })
    }
    const erro = validar(body)
    if (erro) return res.status(400).json({ message: erro })

    const carga = await Carga.findByPk(body.idCarga)
    if (!carga) return res.status(404).json({ message: 'Carga informada não existe.' })

    const ja = await Entrega.findOne({ where: { idCarga: carga.codCarga } })
    if (ja) return res.status(409).json({ message: 'Esta carga já possui uma entrega cadastrada.' })

    const now = agora()
    const e = await Entrega.create({
        cidadeDestino: body.cidadeDestino.trim(),
        status: body.status || 'TRANSITO',
        data: body.data || now.data,
        hora: normalizaHora(body.hora || now.hora),
        idCarga: carga.codCarga,
        idFuncionario: req.usuario.codFuncionario
    })
    const completa = await Entrega.findByPk(e.codEntrega, { include: INCLUDE })
    return res.status(201).json({ message: 'Entrega cadastrada com sucesso!', entrega: serializar(completa) })
}

// GET /api/entregas?ordem=asc|desc&status=&cidade=&dataInicial=&dataFinal=
const listar = async (req, res) => {
    const { ordem, status, cidade, dataInicial, dataFinal } = req.query
    const dir = String(ordem || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC'
    const where = {}

    if (status) {
        if (!STATUS.includes(status)) return res.status(400).json({ message: 'Status inválido: use ENTREGUE ou TRANSITO.' })
        where.status = status
    }
    if (typeof cidade === 'string' && cidade.trim()) {
        where.cidadeDestino = { [Op.like]: `%${cidade.trim().replace(/[\\%_]/g, (c) => '\\' + c)}%` }
    }
    if (dataInicial || dataFinal) {
        if ((dataInicial && !v.dataValida(dataInicial)) || (dataFinal && !v.dataValida(dataFinal))) {
            return res.status(400).json({ message: 'Data inválida: use AAAA-MM-DD.' })
        }
        where.data = {}
        if (dataInicial) where.data[Op.gte] = dataInicial
        if (dataFinal) where.data[Op.lte] = dataFinal
    }

    const lista = await Entrega.findAll({
        where, include: INCLUDE,
        order: [['data', dir], ['hora', dir], ['codEntrega', dir]]
    })
    return res.status(200).json(lista.map(serializar))
}

const consultar = async (req, res) => {
    const e = await Entrega.findByPk(req.params.id, { include: INCLUDE })
    if (!e) return res.status(404).json({ message: 'Entrega não encontrada.' })
    return res.status(200).json(serializar(e))
}

// Atualização de status (e demais campos da entrega)
const atualizar = async (req, res) => {
    const e = await Entrega.findByPk(req.params.id)
    if (!e) return res.status(404).json({ message: 'Entrega não encontrada.' })

    const body = req.body || {}
    const erro = validar(body, { parcial: true })
    if (erro) return res.status(400).json({ message: erro })

    if (e.status === 'ENTREGUE' && body.status === 'TRANSITO') {
        return res.status(409).json({ message: 'Uma entrega já ENTREGUE não pode voltar para TRANSITO.' })
    }

    const campos = {}
    if (body.cidadeDestino !== undefined) campos.cidadeDestino = body.cidadeDestino.trim()
    if (body.status !== undefined) campos.status = body.status
    if (body.data) campos.data = body.data
    if (body.hora) campos.hora = normalizaHora(body.hora)
    await e.update(campos)

    const completa = await Entrega.findByPk(e.codEntrega, { include: INCLUDE })
    return res.status(200).json({ message: 'Entrega atualizada com sucesso!', entrega: serializar(completa) })
}

const apagar = async (req, res) => {
    const e = await Entrega.findByPk(req.params.id)
    if (!e) return res.status(404).json({ message: 'Entrega não encontrada.' })
    await e.destroy()
    return res.status(200).json({ message: 'Entrega excluída com sucesso!' })
}

module.exports = { cadastrar, listar, consultar, atualizar, apagar }
