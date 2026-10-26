const Carga = require('./Carga')
const Motorista = require('./Motorista')
const Funcionario = require('./Funcionario')
const Entrega = require('./Entrega')

// Motorista 1 --- N Carga  (não apaga motorista que possui cargas)
Motorista.hasMany(Carga, { foreignKey: { name: 'codigoMotorista', allowNull: false }, as: 'cargas', onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
Carga.belongsTo(Motorista, { foreignKey: 'codigoMotorista', as: 'motorista' })

// Carga 1 --- 0..1 Entrega
Carga.hasOne(Entrega, { foreignKey: { name: 'idCarga', allowNull: false }, as: 'entrega', onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
Entrega.belongsTo(Carga, { foreignKey: 'idCarga', as: 'carga' })

// Funcionario 1 --- N Entrega (responsável pelo registro)
Funcionario.hasMany(Entrega, { foreignKey: { name: 'idFuncionario', allowNull: false }, as: 'entregas', onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
Entrega.belongsTo(Funcionario, { foreignKey: 'idFuncionario', as: 'funcionario' })

module.exports = { Carga, Motorista, Funcionario, Entrega }
