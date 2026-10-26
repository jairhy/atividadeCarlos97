const { Sequelize } = require('sequelize')
const { db: cfg } = require('../config/config')

const db = new Sequelize(cfg.name, cfg.user, cfg.pass, {
    host: cfg.host,
    port: cfg.port,
    dialect: 'mysql',
    logging: false
})

module.exports = db
