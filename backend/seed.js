// Popula o banco com dados iniciais (3 registros por tabela)
const bcrypt = require('bcryptjs')
const conn = require('./db/conn')
const { Funcionario, Motorista, Carga, Entrega } = require('./models/rel')
const { criptografar, hashDeterministico } = require('./utils/crypto')

const mot = (nome, cnh, cpf, telefone) => ({
    nome, telefone, cnh: criptografar(cnh), cpf: criptografar(cpf), cpfHash: hashDeterministico(cpf)
})

async function seed() {
    try {
        await conn.sync()
        const senha = await bcrypt.hash('Senha@123', 10)
        const funcs = await Funcionario.bulkCreate([
            { nome: 'Carlos Almeida', email: 'carlos@logisticaexpress.com', senha },
            { nome: 'Mariana Souza', email: 'mariana@logisticaexpress.com', senha },
            { nome: 'Roberto Lima', email: 'roberto@logisticaexpress.com', senha }
        ])
        const mots = await Motorista.bulkCreate([
            mot('João Pereira', '12345678901', '52998224725', '47991112233'),
            mot('Ana Beatriz Costa', '98765432100', '11144477735', '47992223344'),
            mot('Pedro Henrique Santos', '45678912345', '39053344705', '47993334455')
        ])
        const cargas = await Carga.bulkCreate([
            { descricao: 'Caixas de eletrônicos', peso: 350.5, volume: 2.4, codigoRastreio: '10000000001', codigoMotorista: mots[0].codMotorista },
            { descricao: 'Material de escritório', peso: 120, volume: 1.1, codigoRastreio: '10000000002', codigoMotorista: mots[1].codMotorista },
            { descricao: 'Peças automotivas', peso: 780.25, volume: 3.8, codigoRastreio: '10000000003', codigoMotorista: mots[2].codMotorista }
        ])
        await Entrega.bulkCreate([
            { cidadeDestino: 'Curitiba', status: 'TRANSITO', data: '2026-10-20', hora: '08:30:00', idCarga: cargas[0].codCarga, idFuncionario: funcs[0].codFuncionario },
            { cidadeDestino: 'Florianópolis', status: 'ENTREGUE', data: '2026-10-22', hora: '14:15:00', idCarga: cargas[1].codCarga, idFuncionario: funcs[1].codFuncionario },
            { cidadeDestino: 'Porto Alegre', status: 'TRANSITO', data: '2026-10-25', hora: '10:00:00', idCarga: cargas[2].codCarga, idFuncionario: funcs[2].codFuncionario }
        ])
        console.log('Dados iniciais inseridos. Login: carlos@logisticaexpress.com / Senha@123')
    } catch (err) {
        console.error('Erro no seed:', err)
        process.exitCode = 1
    } finally {
        await conn.close()
    }
}

seed()
