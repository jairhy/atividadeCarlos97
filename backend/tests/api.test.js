// Teste de integração da API - usa um banco separado (db_logistica_test)
process.env.DB_NAME = 'db_logistica_test'
process.env.NODE_ENV = 'test'

const request = require('supertest')
const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config/env')
const app = require('../app')
const db = require('../db/conn')
const { Funcionario, Motorista } = require('../models/rel')
const { ipInterno } = require('../middleware/rede.middleware')

let token
const auth = () => ({ Authorization: `Bearer ${token}` })

const motoristaBase = (o = {}) => ({
    nome: 'Maria Teste', cnh: '11122233344', cpf: '529.982.247-25', telefone: '(47) 99999-1111', ...o
})

beforeAll(async () => {
    const raw = await mysql.createConnection({ host: config.db.host, port: config.db.port, user: config.db.user, password: config.db.pass })
    await raw.query('CREATE DATABASE IF NOT EXISTS db_logistica_test')
    await raw.end()
    await db.sync({ force: true })
    await Funcionario.create({ nome: 'Tester', email: 'tester@logistica.com', senha: await bcrypt.hash('Senha@123', 10) })
})

afterAll(async () => { await db.close() })

describe('Autenticação e sessão (180 min)', () => {
    test('POST /auth/login sem dados -> 400', async () => {
        const r = await request(app).post('/api/auth/login').send({})
        expect(r.status).toBe(400)
    })

    test('POST /auth/login com senha errada -> 401', async () => {
        const r = await request(app).post('/api/auth/login').send({ email: 'tester@logistica.com', senha: 'errada' })
        expect(r.status).toBe(401)
        expect(r.body.token).toBeUndefined()
    })

    test('POST /auth/login com e-mail inexistente -> 401 (mesma mensagem)', async () => {
        const r = await request(app).post('/api/auth/login').send({ email: 'nao@existe.com', senha: 'Senha@123' })
        expect(r.status).toBe(401)
        expect(r.body.message).toBe('E-mail ou senha incorretos.')
    })

    test('POST /auth/login válido -> 200 com token que expira em 180 min', async () => {
        const r = await request(app).post('/api/auth/login').send({ email: 'tester@logistica.com', senha: 'Senha@123' })
        expect(r.status).toBe(200)
        expect(r.body.funcionario.nome).toBe('Tester')
        expect(r.body.sessaoMinutos).toBe(180)
        const { iat, exp } = jwt.decode(r.body.token)
        expect(exp - iat).toBe(180 * 60)
        token = r.body.token
    })

    test('senha do funcionário fica criptografada (hash bcrypt) no banco', async () => {
        const f = await Funcionario.findOne({ where: { email: 'tester@logistica.com' } })
        expect(f.senha).not.toBe('Senha@123')
        expect(f.senha).toMatch(/^\$2[aby]\$/)
    })

    test('rota protegida sem token -> 401', async () => {
        expect((await request(app).get('/api/motoristas')).status).toBe(401)
    })

    test('token inválido -> 401', async () => {
        const r = await request(app).get('/api/motoristas').set('Authorization', 'Bearer abc.def.ghi')
        expect(r.status).toBe(401)
    })

    test('token expirado -> 401 "Sessão expirada"', async () => {
        const expirado = jwt.sign({ codFuncionario: 1, nome: 'X', email: 'x@x.com' }, config.jwtSecret, { expiresIn: -10 })
        const r = await request(app).get('/api/motoristas').set('Authorization', `Bearer ${expirado}`)
        expect(r.status).toBe(401)
        expect(r.body.message).toMatch(/expirada/i)
    })

    test('GET /auth/me devolve o funcionário logado', async () => {
        const r = await request(app).get('/api/auth/me').set(auth())
        expect(r.status).toBe(200)
        expect(r.body.funcionario.email).toBe('tester@logistica.com')
    })

    test('POST /auth/logout -> 200', async () => {
        const r = await request(app).post('/api/auth/logout').set(auth())
        expect(r.status).toBe(200)
    })
})

describe('Restrição à rede interna', () => {
    test('IPs internos aceitos e externos recusados', () => {
        for (const ip of ['127.0.0.1', '::1', '::ffff:192.168.0.10', '10.1.2.3', '172.16.0.1', '172.31.255.1']) expect(ipInterno(ip)).toBe(true)
        for (const ip of ['8.8.8.8', '172.32.0.1', '200.150.10.5', '::ffff:177.10.10.10']) expect(ipInterno(ip)).toBe(false)
    })
})

describe('Motoristas - CRUD e busca por nome', () => {
    let id

    test('POST cria motorista (CPF com máscara aceito)', async () => {
        const r = await request(app).post('/api/motoristas').set(auth()).send(motoristaBase())
        expect(r.status).toBe(201)
        expect(r.body.motorista.cpf).toBe('52998224725')
        id = r.body.motorista.codMotorista
    })

    test('CNH e CPF estão criptografados no banco', async () => {
        const m = await Motorista.findByPk(id)
        expect(m.cpf).not.toContain('52998224725')
        expect(m.cnh).not.toContain('11122233344')
        expect(m.cpf.split(':')).toHaveLength(3)
    })

    test('POST com CPF inválido -> 400', async () => {
        const r = await request(app).post('/api/motoristas').set(auth()).send(motoristaBase({ cpf: '111.111.111-11' }))
        expect(r.status).toBe(400)
    })

    test('POST com CPF duplicado -> 409', async () => {
        const r = await request(app).post('/api/motoristas').set(auth()).send(motoristaBase({ nome: 'Outra' }))
        expect(r.status).toBe(409)
    })

    test('POST sem nome -> 400', async () => {
        const r = await request(app).post('/api/motoristas').set(auth()).send(motoristaBase({ nome: '' }))
        expect(r.status).toBe(400)
    })

    test('GET lista devolve dados descriptografados', async () => {
        const r = await request(app).get('/api/motoristas').set(auth())
        expect(r.status).toBe(200)
        expect(r.body[0].cnh).toBe('11122233344')
        expect(r.body[0].cpf).toBe('52998224725')
    })

    test('GET ?nome= filtra por nome (parcial, sem diferenciar maiúsculas)', async () => {
        await request(app).post('/api/motoristas').set(auth()).send(motoristaBase({ nome: 'Zeca Silva', cpf: '11144477735' }))
        const r = await request(app).get('/api/motoristas?nome=zeca').set(auth())
        expect(r.body).toHaveLength(1)
        expect(r.body[0].nome).toBe('Zeca Silva')
        const vazio = await request(app).get('/api/motoristas?nome=inexistente').set(auth())
        expect(vazio.body).toEqual([])
    })

    test('GET /:id e 404', async () => {
        expect((await request(app).get(`/api/motoristas/${id}`).set(auth())).body.nome).toBe('Maria Teste')
        expect((await request(app).get('/api/motoristas/9999').set(auth())).status).toBe(404)
        expect((await request(app).get('/api/motoristas/abc').set(auth())).status).toBe(400)
    })

    test('PUT atualiza', async () => {
        const r = await request(app).put(`/api/motoristas/${id}`).set(auth()).send(motoristaBase({ nome: 'Maria Atualizada', telefone: '4733334444' }))
        expect(r.status).toBe(200)
        expect(r.body.motorista.nome).toBe('Maria Atualizada')
    })

    test('DELETE remove e depois 404', async () => {
        const novo = await request(app).post('/api/motoristas').set(auth()).send(motoristaBase({ nome: 'Descartável', cpf: '39053344705' }))
        const del = await request(app).delete(`/api/motoristas/${novo.body.motorista.codMotorista}`).set(auth())
        expect(del.status).toBe(200)
        expect((await request(app).delete(`/api/motoristas/${novo.body.motorista.codMotorista}`).set(auth())).status).toBe(404)
    })
})

describe('Cargas vinculadas ao motorista', () => {
    let motId, cargaId
    const cargaBase = (o = {}) => ({ descricao: 'Geladeiras', peso: 250.5, volume: 3.2, codigoRastreio: '12345678901', codigoMotorista: motId, ...o })

    beforeAll(async () => {
        const r = await request(app).post('/api/motoristas').set(auth()).send(motoristaBase({ nome: 'Dono da Carga', cpf: '71428793860' }))
        motId = r.body.motorista.codMotorista
    })

    test('POST cria carga com peso, volume, descrição e rastreio', async () => {
        const r = await request(app).post('/api/cargas').set(auth()).send(cargaBase())
        expect(r.status).toBe(201)
        expect(r.body.carga.peso).toBe(250.5)
        expect(r.body.carga.motorista.nome).toBe('Dono da Carga')
        cargaId = r.body.carga.codCarga
    })

    test.each([
        ['rastreio com 10 dígitos', { codigoRastreio: '1234567890' }],
        ['rastreio com letras', { codigoRastreio: '1234567890a' }],
        ['peso zero', { peso: 0 }],
        ['volume negativo', { volume: -1 }],
        ['sem descrição', { descricao: '' }]
    ])('POST inválido (%s) -> 400', async (_n, o) => {
        const r = await request(app).post('/api/cargas').set(auth()).send(cargaBase({ codigoRastreio: '99999999999', ...o }))
        expect(r.status).toBe(400)
    })

    test('POST com motorista inexistente -> 404', async () => {
        const r = await request(app).post('/api/cargas').set(auth()).send(cargaBase({ codigoRastreio: '22222222222', codigoMotorista: 9999 }))
        expect(r.status).toBe(404)
    })

    test('POST com rastreio duplicado -> 409', async () => {
        expect((await request(app).post('/api/cargas').set(auth()).send(cargaBase())).status).toBe(409)
    })

    test('GET lista traz o nome do motorista', async () => {
        const r = await request(app).get('/api/cargas').set(auth())
        expect(r.status).toBe(200)
        expect(r.body[0].motorista.nome).toBe('Dono da Carga')
    })

    test('PUT atualiza', async () => {
        const r = await request(app).put(`/api/cargas/${cargaId}`).set(auth()).send(cargaBase({ peso: 300 }))
        expect(r.status).toBe(200)
        expect(r.body.carga.peso).toBe(300)
    })

    test('DELETE de motorista com carga -> 409 (integridade)', async () => {
        expect((await request(app).delete(`/api/motoristas/${motId}`).set(auth())).status).toBe(409)
    })

    test('DELETE de carga', async () => {
        const nova = await request(app).post('/api/cargas').set(auth()).send(cargaBase({ codigoRastreio: '33333333333' }))
        expect((await request(app).delete(`/api/cargas/${nova.body.carga.codCarga}`).set(auth())).status).toBe(200)
    })

    describe('Entregas vinculadas à carga', () => {
        const ids = {}
        const mkCarga = async (rastreio) => (await request(app).post('/api/cargas').set(auth()).send(cargaBase({ codigoRastreio: rastreio }))).body.carga.codCarga

        test('POST cria entrega (TRANSITO)', async () => {
            ids.a = await mkCarga('40000000001')
            const r = await request(app).post('/api/entregas').set(auth())
                .send({ idCarga: ids.a, cidadeDestino: 'Curitiba', status: 'TRANSITO', data: '2026-10-20', hora: '08:30' })
            expect(r.status).toBe(201)
            expect(r.body.entrega.carga.codigoRastreio).toBe('40000000001')
            expect(r.body.entrega.registradoPor).toBe('Tester')
            ids.entA = r.body.entrega.codEntrega
        })

        test('POST sem data/hora usa data e hora atuais', async () => {
            ids.b = await mkCarga('40000000002')
            const r = await request(app).post('/api/entregas').set(auth()).send({ idCarga: ids.b, cidadeDestino: 'Joinville' })
            expect(r.status).toBe(201)
            expect(r.body.entrega.status).toBe('TRANSITO')
            expect(r.body.entrega.data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            ids.entB = r.body.entrega.codEntrega
        })

        test('POST com data anterior para testar ordenação', async () => {
            ids.c = await mkCarga('40000000003')
            const r = await request(app).post('/api/entregas').set(auth())
                .send({ idCarga: ids.c, cidadeDestino: 'Blumenau', status: 'ENTREGUE', data: '2026-09-01', hora: '09:00' })
            expect(r.status).toBe(201)
            ids.entC = r.body.entrega.codEntrega
        })

        test('POST: status inválido -> 400; carga inexistente -> 404; carga repetida -> 409', async () => {
            expect((await request(app).post('/api/entregas').set(auth()).send({ idCarga: ids.a, cidadeDestino: 'X', status: 'PERDIDO' })).status).toBe(400)
            expect((await request(app).post('/api/entregas').set(auth()).send({ idCarga: 9999, cidadeDestino: 'X' })).status).toBe(404)
            expect((await request(app).post('/api/entregas').set(auth()).send({ idCarga: ids.a, cidadeDestino: 'X' })).status).toBe(409)
        })

        test('GET ordena por data crescente e decrescente', async () => {
            const asc = (await request(app).get('/api/entregas?ordem=asc').set(auth())).body.map(e => e.data)
            const desc = (await request(app).get('/api/entregas?ordem=desc').set(auth())).body.map(e => e.data)
            expect(asc).toEqual([...asc].sort())
            expect(desc).toEqual([...asc].reverse())
            expect(asc[0]).toBe('2026-09-01')
        })

        test('GET filtra por período, status e cidade', async () => {
            const p = await request(app).get('/api/entregas?dataInicial=2026-10-01&dataFinal=2026-10-31').set(auth())
            expect(p.body.map(e => e.cidadeDestino)).toContain('Curitiba')
            expect(p.body.map(e => e.cidadeDestino)).not.toContain('Blumenau')
            const s = await request(app).get('/api/entregas?status=ENTREGUE').set(auth())
            expect(s.body.every(e => e.status === 'ENTREGUE')).toBe(true)
            const c = await request(app).get('/api/entregas?cidade=joinv').set(auth())
            expect(c.body).toHaveLength(1)
            expect((await request(app).get('/api/entregas?status=XX').set(auth())).status).toBe(400)
            expect((await request(app).get('/api/entregas?dataInicial=ontem').set(auth())).status).toBe(400)
        })

        test('PUT atualiza status TRANSITO -> ENTREGUE', async () => {
            const r = await request(app).put(`/api/entregas/${ids.entA}`).set(auth()).send({ status: 'ENTREGUE' })
            expect(r.status).toBe(200)
            expect(r.body.entrega.status).toBe('ENTREGUE')
        })

        test('PUT ENTREGUE -> TRANSITO é bloqueado (409)', async () => {
            const r = await request(app).put(`/api/entregas/${ids.entA}`).set(auth()).send({ status: 'TRANSITO' })
            expect(r.status).toBe(409)
        })

        test('DELETE de carga com entrega -> 409; DELETE de entrega -> 200', async () => {
            expect((await request(app).delete(`/api/cargas/${ids.a}`).set(auth())).status).toBe(409)
            expect((await request(app).delete(`/api/entregas/${ids.entB}`).set(auth())).status).toBe(200)
            expect((await request(app).get(`/api/entregas/${ids.entB}`).set(auth())).status).toBe(404)
        })
    })
})

describe('Funcionários', () => {
    test('POST cadastra funcionário e permite login; senha curta -> 400; e-mail repetido -> 409', async () => {
        const novo = { nome: 'Novo Func', email: 'novo@logistica.com', senha: 'OutraSenha1' }
        expect((await request(app).post('/api/funcionarios').set(auth()).send(novo)).status).toBe(201)
        expect((await request(app).post('/api/auth/login').send({ email: novo.email, senha: novo.senha })).status).toBe(200)
        expect((await request(app).post('/api/funcionarios').set(auth()).send({ ...novo, email: 'b@b.com', senha: '123' })).status).toBe(400)
        expect((await request(app).post('/api/funcionarios').set(auth()).send(novo)).status).toBe(409)
        const lista = await request(app).get('/api/funcionarios').set(auth())
        expect(JSON.stringify(lista.body)).not.toMatch(/senha|\$2/)
    })
})

describe('Segurança básica', () => {
    test('JSON malformado -> 400; rota inexistente -> 404; cabeçalhos do helmet presentes', async () => {
        const r = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad')
        expect(r.status).toBe(400)
        expect((await request(app).get('/api/nada')).status).toBe(404)
        const h = await request(app).get('/api/health')
        expect(h.headers['x-content-type-options']).toBe('nosniff')
        expect(h.headers['x-powered-by']).toBeUndefined()
    })

    test('tentativa de SQL injection no filtro de nome não quebra nem vaza dados', async () => {
        const r = await request(app).get("/api/motoristas?nome=' OR '1'='1").set(auth())
        expect(r.status).toBe(200)
        expect(r.body).toEqual([])
    })
})
