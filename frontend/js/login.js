if (Sessao.valida()) location.replace('index.html')

const motivos = {
    expirada: ['Sua sessão expirou (limite de 180 minutos). Faça login novamente.', 'erro'],
    saiu: ['Você saiu do sistema com segurança.', 'ok']
}
const m = motivos[new URLSearchParams(location.search).get('motivo')]
if (m) mostrarMsg(m[0], m[1])

document.getElementById('form-login').addEventListener('submit', async (ev) => {
    ev.preventDefault()
    limparMsg()
    const email = document.getElementById('email').value.trim()
    const senha = document.getElementById('senha').value
    if (!email || !senha) return mostrarMsg('Informe e-mail e senha.', 'erro')
    try {
        const dados = await api('/auth/login', { method: 'POST', body: { email, senha } })
        Sessao.salvar(dados)
        location.replace('index.html')
    } catch (err) {
        mostrarMsg(err.message, 'erro')
    }
})
