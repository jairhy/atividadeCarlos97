iniciarPagina('inicio')

;(async () => {
    try {
        const { funcionario } = await api('/auth/me')
        document.getElementById('boas-vindas').textContent = `Bem-vindo(a), ${funcionario.nome} (${funcionario.email}).`
        const [mot, car, ent] = await Promise.all([api('/motoristas'), api('/cargas'), api('/entregas')])
        document.getElementById('n-mot').textContent = mot.length
        document.getElementById('n-car').textContent = car.length
        document.getElementById('n-tra').textContent = ent.filter(e => e.status === 'TRANSITO').length
        document.getElementById('n-ent').textContent = ent.filter(e => e.status === 'ENTREGUE').length
    } catch (err) { mostrarMsg(err.message, 'erro') }
})()
