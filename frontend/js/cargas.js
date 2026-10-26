iniciarPagina('cargas')
const $ = (id) => document.getElementById(id)
const campos = ['descricao', 'peso', 'volume', 'codigoRastreio', 'codigoMotorista']

function resetForm() {
    $('form').reset(); $('cod').value = ''
    $('t-form').textContent = 'Nova carga'; $('btn-salvar').textContent = 'Cadastrar'; $('btn-cancelar').hidden = true
}

function editar(c) {
    limparMsg()
    $('cod').value = c.codCarga
    campos.forEach(k => { $(k).value = c[k] })
    $('t-form').textContent = `Editar carga #${c.codCarga}`
    $('btn-salvar').textContent = 'Salvar alterações'; $('btn-cancelar').hidden = false
    $('descricao').focus()
}

async function excluir(c) {
    if (!confirm(`Excluir a carga "${c.descricao}" (rastreio ${c.codigoRastreio})?`)) return
    try {
        const r = await api(`/cargas/${c.codCarga}`, { method: 'DELETE' })
        mostrarMsg(r.message); if ($('cod').value == c.codCarga) resetForm()
        listar()
    } catch (err) { mostrarMsg(err.message, 'erro') }
}

async function carregarMotoristas() {
    const lista = await api('/motoristas')
    lista.forEach(m => $('codigoMotorista').append(h('option', { value: m.codMotorista }, m.nome)))
}

async function listar() {
    try {
        const lista = await api('/cargas')
        montarTabela($('tabela'), 'Cargas e motoristas responsáveis', [
            { titulo: 'Cód.', render: c => c.codCarga },
            { titulo: 'Descrição', render: c => c.descricao },
            { titulo: 'Peso (kg)', render: c => fmtNum(c.peso) },
            { titulo: 'Volume (m³)', render: c => fmtNum(c.volume, 3) },
            { titulo: 'Rastreio', render: c => c.codigoRastreio },
            { titulo: 'Motorista', render: c => c.motorista ? c.motorista.nome : '—' },
            { titulo: 'Ações', render: c => h('div', { class: 'acoes', style: 'margin:0' },
                h('button', { class: 'btn sm', type: 'button', onclick: () => editar(c), 'aria-label': `Editar carga ${c.codigoRastreio}` }, 'Editar'),
                h('button', { class: 'btn sm perigo', type: 'button', onclick: () => excluir(c), 'aria-label': `Excluir carga ${c.codigoRastreio}` }, 'Excluir')) }
        ], lista, 'Nenhuma carga cadastrada.')
    } catch (err) { mostrarMsg(err.message, 'erro') }
}

$('form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); limparMsg()
    const body = Object.fromEntries(campos.map(c => [c, $(c).value.trim()]))
    if (campos.some(c => !body[c])) return mostrarMsg('Preencha todos os campos.', 'erro')
    if (!/^\d{11}$/.test(body.codigoRastreio)) return mostrarMsg('O código de rastreio deve ter exatamente 11 dígitos.', 'erro')
    const cod = $('cod').value
    try {
        const r = await api(cod ? `/cargas/${cod}` : '/cargas', { method: cod ? 'PUT' : 'POST', body })
        mostrarMsg(r.message); resetForm(); listar()
    } catch (err) { mostrarMsg(err.message, 'erro') }
})
$('btn-cancelar').addEventListener('click', () => { resetForm(); limparMsg() })

carregarMotoristas().then(listar).catch(err => mostrarMsg(err.message, 'erro'))
