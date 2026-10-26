const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Entrega = db.define('entrega',{
    codEntrega: {
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement: true
    },
    cidadeDestino: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
     idCarga: {
        type: DataTypes.INTEGER,
        references: {
            model: 'cargas',
            key: 'codCarga'
        },
        allowNull: false
    },
    idFuncionario: {
        type: DataTypes.INTEGER,
        references: {
            model: 'funcionarios',
            key: 'codFuncionario'
        },
        allowNull: false
    },
    idMotorista: {
        type: DataTypes.INTEGER,
        references: {
            model: 'motoristas',
            key: 'codMotorista'
        },
        allowNull: false
    },
    
    status: {
        type: DataTypes.ENUM('ENTREGUE','TRANSITO'),
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    hora: {
        type: DataTypes.TIME,
        allowNull: false
    },
    codCarga: {
         type: DataTypes.INTEGER,
        allowNull: false
    }
   
    
    
},{
    timestamps: false,
    tableName: 'entregas'
})

module.exports = Entrega