const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Carga = db.define('carga', {
    codCarga: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descricao: { type: DataTypes.STRING(100), allowNull: false },
    peso: { type: DataTypes.DECIMAL(10, 2), allowNull: false },     // kg
    volume: { type: DataTypes.DECIMAL(10, 3), allowNull: false },   // m³
    // 11 dígitos não cabem em INT (máx. ~2,1 bi) -> BIGINT
    codigoRastreio: { type: DataTypes.BIGINT, allowNull: false, unique: true },
    codigoMotorista: { type: DataTypes.INTEGER, allowNull: false }
}, { timestamps: false, tableName: 'cargas' })

module.exports = Carga
