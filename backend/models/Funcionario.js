const { DataTypes } = require('sequelize')
const db = require('../db/conn')

const Funcionario = db.define('funcionario',{
    codFuncionario: {
        type: DataTypes.INTEGER,
        primaryKey:true,
        autoIncrement: true
    },
    nome: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    senha: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
 
   
    
    
},{
    timestamps: false,
    tableName: 'funcionarios'
})

module.exports = Funcionario