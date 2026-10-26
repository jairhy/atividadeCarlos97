const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Entrega = db.define('entrega', {
    codEntrega: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    cidadeDestino: { type: DataTypes.STRING(100), allowNull: false },
    status: { type: DataTypes.ENUM('ENTREGUE', 'TRANSITO'), allowNull: false, defaultValue: 'TRANSITO' },
    data: { type: DataTypes.DATEONLY, allowNull: false },
    hora: { type: DataTypes.TIME, allowNull: false },
    idCarga: { type: DataTypes.INTEGER, allowNull: false, unique: true },   // 1 entrega por carga
    idFuncionario: { type: DataTypes.INTEGER, allowNull: false }            // quem registrou
}, { timestamps: false, tableName: 'entregas' })

module.exports = Entrega
