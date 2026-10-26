const { Sequelize } = require('sequelize')

const db = new Sequelize('db_logistica', 'root','senai', {
    host: 'localhost',
    dialect: 'mysql',
    port: 3306
})

module.exports = db


