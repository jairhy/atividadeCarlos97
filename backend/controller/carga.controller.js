const Carga = require('../models/Carga')
const CryptoJS = require('crypto-js')
const CHAVE_SECRETA = 'segredo'

const cadastrar = async ( req, res ) => {
    const valores = req.body

    if (!valores.peso || !valores.volume || !valores.codigoRastreio || !valores.codigoMotorista){
        return res.status(400).json({message: 'Todos os campos são obrigatórios!!!'})

    }

    if (valores.codigoRastreio.length !== 11) {
        return res.status(400).json({ message: `O código de rastreio deve conter exatamente 11 dígitos!` })
    }

    try {
        const criptografada = CryptoJS.AES.encrypt(valores.codigoRastreio,CHAVE_SECRETA).toString()

        await Carga.create({
            descricao: valores.descricao,
            peso: valores.peso,
            volume: valores.volume,
            codigoRastreio: valores.codigoRastreio,
            codigoMotorista: valores.codigoMotorista
        })

        return res.status(201).json({ message: 'Carga cadastrada com sucesso!!' })
    } catch (err) {
        console.error('Erro ao cadastrar ciclista: ', err)
        return res.status(500).json({ message: 'Erro ao cadastrar ciclista!'})

    }
}


// //     descricao: {
//         type: DataTypes.STRING(100),
//         allowNull: false
//     },
//     peso: {
//         type: DataTypes.FLOAT,
//         allowNull: false
//     },
//     volume: {
//         type: DataTypes.FLOAT,
//         allowNull: false
//     },
//     codigoRastreio: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//     },
//     codigoMotorista: {
//         type: DataTypes.INTEGER,
//         allowNull: false
//     } 
    