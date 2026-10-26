const Carga = require('./Carga')
const Motorista = require('./Motorista')
const Funcionario = require('./Funcionario')
const Entrega = require('./Entrega')


Carga.hasMany(Entrega, {
    foreignKey: 'idCarga',
    as: 'cargas',
    onDelete: 'CASCADE',
})

Entrega.belongsTo(Carga, {
    foreignKey: 'idCarga',
    as: 'cargas',
    allowNull: false
})

Motorista.hasMany(Entrega, {
    foreignKey: 'idMotorista',
    as: 'motoristas',
    onDelete: 'CASCADE'
})

Entrega.belongsTo(Motorista, {
    foreignKey: 'idMotorista',
    as: 'motoristas',
    allowNull: false
})

Funcionario.hasMany(Entrega, {
    foreignKey: 'idFuncionario',
    as: 'funcionarios',
    onDelete: 'CASCADE'
})

Entrega.belongsTo(Funcionario, {
    foreignKey: 'idFuncionario',
    as: 'funcionarios',
    allowNull: false
})



module.exports = { Carga, Motorista, Funcionario, Entrega  }