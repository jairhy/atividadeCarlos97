// Cria o banco (se não existir) e as tabelas. ATENÇÃO: force:true recria tudo.
const mysql = require('mysql2/promise')
const { db: cfg } = require('./config/config')
const conn = require('./db/conn')
require('./models/rel')

async function dataBaseSync() {
    try {
        const raw = await mysql.createConnection({ host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.pass })
        await raw.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
        await raw.end()
        await conn.sync({ force: true })
        console.log('Tabelas sincronizadas!')
    } catch (err) {
        console.error('Erro de sincronização!', err)
        process.exitCode = 1
    } finally {
        await conn.close()
    }
}

if (require.main === module) dataBaseSync()
module.exports = dataBaseSync
