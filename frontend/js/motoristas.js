iniciarPagina('motoristas')

const $ = (id) => document.getElementById(id)
const campos = ['nome', 'cnh', 'cpf', 'telefone']

function resetForm() {
    $('form').reset(); $('cod').value = ''
    $('t-form').textContent = 'Novo motorista'
    $('btn-salvar').textContent = 'Cadastrar'
    $('btn-cancelar').hidden = true
}

function editar(m) {
    limparMsg()
    $('cod').value = m.codMotorista
    $('nome').value = m.nome; $('cnh').value = m.cnh
    $('cpf').value = fmtCPF(m.cpf); $('telefone').value = fmtTel(m.telefone)
    $('t-form').textContent = `Editar motorista #${m.codMotorista}`
    $('btn-salvar').textContent = 'Salvar alterações'
    $('btn-cancelar').hidden = false
    $('nome').focus()
}

async function excluir(m) {
    if (!confirm(`Excluir o motorista "${m.nome}"?`)) return
    try {
        const r = await api(`/motoristas/${m.codMotorista}`, { method: 'DELETE' })
        mostrarMsg(r.message); if ($('cod').value == m.codMotorista) resetForm()
        listar()
    } catch (err) { mostrarMsg(err.message, 'erro') }
}

async function listar() {
    const nome = $('busca').value.trim()
    try {
        const lista = await api('/motoristas' + (nome ? `?nome=${encodeURIComponent(nome)}` : ''))
        montarTabela($('tabela'), nome ? `Resultado da busca por "${nome}"` : 'Todos os motoristas', [
            { titulo: 'Cód.', render: m => m.codMotorista },
            { titulo: 'Nome', render: m => m.nome },
            { titulo: 'CNH', render: m => m.cnh },
            { titulo: 'CPF', render: m => fmtCPF(m.cpf) },
            { titulo: 'Telefone', render: m => fmtTel(m.telefone) },
            { titulo: 'Ações', render: m => h('div', { class: 'acoes', style: 'margin:0' },
                h('button', { class: 'btn sm', type: 'button', onclick: () => editar(m), 'aria-label': `Editar ${m.nome}` }, 'Editar'),
                h('button', { class: 'btn sm perigo', type: 'button', onclick: () => excluir(m), 'aria-label': `Excluir ${m.nome}` }, 'Excluir')) }
        ], lista, nome ? 'Nenhum motorista encontrado com esse nome.' : 'Nenhum motorista cadastrado.')
    } catch (err) { mostrarMsg(err.message, 'erro') }
}

$('form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); limparMsg()
    const body = Object.fromEntries(campos.map(c => [c, $(c).value.trim()]))
    if (campos.some(c => !body[c])) return mostrarMsg('Preencha todos os campos.', 'erro')
    const cod = $('cod').value
    try {
        const r = await api(cod ? `/motoristas/${cod}` : '/motoristas', { method: cod ? 'PUT' : 'POST', body })
        mostrarMsg(r.message); resetForm(); listar()
    } catch (err) { mostrarMsg(err.message, 'erro') }
})
$('btn-cancelar').addEventListener('click', () => { resetForm(); limparMsg() })
$('form-busca').addEventListener('submit', (ev) => { ev.preventDefault(); limparMsg(); listar() })
$('btn-limpar').addEventListener('click', () => { $('busca').value = ''; limparMsg(); listar() })

listar()
