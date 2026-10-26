const app = require('./app')
const db = require('./db/conn')
require('./models/rel')
const { port, host } = require('./config/config')

async function iniciar() {
    try {
        await db.authenticate()
        console.log('Conectado ao banco de dados.')
        app.listen(port, host, () => console.log(`Servidor em http://localhost:${port}`))
    } catch (err) {
        console.error('Falha ao conectar no banco:', err.message)
        process.exit(1)
    }
}

iniciar()
