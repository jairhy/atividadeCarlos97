const soDigitos = (v) => String(v ?? '').replace(/\D/g, '')

function cpfValido(valor) {
    const cpf = soDigitos(valor)
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
    for (const t of [9, 10]) {
        let soma = 0
        for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i)
        const dv = ((soma * 10) % 11) % 10
        if (dv !== Number(cpf[t])) return false
    }
    return true
}

const cnhValida = (v) => soDigitos(v).length === 11
const telefoneValido = (v) => [10, 11].includes(soDigitos(v).length)
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? ''))
const rastreioValido = (v) => /^\d{11}$/.test(String(v ?? ''))
const numeroPositivo = (v) => v !== '' && v !== null && Number.isFinite(Number(v)) && Number(v) > 0
const dataValida = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '') && !Number.isNaN(Date.parse(v))
const horaValida = (v) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v ?? '')
const texto = (v, max = 100) => typeof v === 'string' && v.trim().length > 0 && v.trim().length <= max

module.exports = {
    soDigitos, cpfValido, cnhValida, telefoneValido, emailValido,
    rastreioValido, numeroPositivo, dataValida, horaValida, texto
}
