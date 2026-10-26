const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Motorista = db.define('motorista', {
    codMotorista: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    // CNH e CPF ficam criptografados (AES-256-GCM) no banco
    cnh: { type: DataTypes.STRING(255), allowNull: false },
    cpf: { type: DataTypes.STRING(255), allowNull: false },
    // HMAC do CPF: permite impedir duplicidade sem guardar o CPF em claro
    cpfHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    telefone: { type: DataTypes.STRING(20), allowNull: false }
}, { timestamps: false, tableName: 'motoristas' })

module.exports = Motorista
