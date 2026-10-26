const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Carga = db.define('carga',{
    codCarga: {
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement: true
    },
    descricao: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    peso: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    volume: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    codigoRastreio: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    codigoMotorista: {
        type: DataTypes.INTEGER,
        allowNull: false
    } 
    
    
},{
    timestamps: false,
    tableName: 'cargas'
})

module.exports = Carga