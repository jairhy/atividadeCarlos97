iniciarPagina('entregas')
const $ = (id) => document.getElementById(id)

function agoraLocal() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0')
    return { data: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, hora: `${p(d.getHours())}:${p(d.getMinutes())}` }
}

function resetForm() {
    $('form').reset(); $('cod').value = ''
    const n = agoraLocal(); $('data').value = n.data; $('hora').value = n.hora
    $('idCarga').disabled = false
    $('t-form').textContent = 'Nova entrega'; $('btn-salvar').textContent = 'Cadastrar'; $('btn-cancelar').hidden = true
}

// Só cargas ainda sem entrega aparecem para novo cadastro
async function carregarCargas(incluirCodigo) {
    const [cargas, entregas] = await Promise.all([api('/cargas'), api('/entregas')])
    const usadas = new Set(entregas.map(e => e.idCarga))
    $('idCarga').replaceChildren(h('option', { value: '' }, 'Selecione…'))
    cargas.filter(c => !usadas.has(c.codCarga) || c.codCarga === incluirCodigo).forEach(c =>
        $('idCarga').append(h('option', { value: c.codCarga }, `#${c.codCarga} — ${c.descricao} (rastreio ${c.codigoRastreio})`)))
}

async function editar(e) {
    limparMsg()
    await carregarCargas(e.idCarga)
    $('cod').value = e.codEntrega
    $('idCarga').value = e.idCarga; $('idCarga').disabled = true   // a carga da entrega não muda
    $('cidadeDestino').value = e.cidadeDestino; $('status').value = e.status
    $('data').value = e.data; $('hora').value = fmtHora(e.hora)
    $('t-form').textContent = `Atualizar entrega #${e.codEntrega}`
    $('btn-salvar').textContent = 'Salvar alterações'; $('btn-cancelar').hidden = false
    $('status').focus()
}

async function excluir(e) {
    if (!confirm(`Excluir a entrega #${e.codEntrega} (${e.cidadeDestino})?`)) return
    try {
        const r = await api(`/entregas/${e.codEntrega}`, { method: 'DELETE' })
        mostrarMsg(r.message); resetForm(); await carregarCargas(); listar()
    } catch (err) { mostrarMsg(err.message, 'erro') }
}

function filtroQuery() {
    const q = new URLSearchParams({ ordem: $('f-ordem').value })
    if ($('f-ini').value) q.set('dataInicial', $('f-ini').value)
    if ($('f-fim').value) q.set('dataFinal', $('f-fim').value)
    if ($('f-status').value) q.set('status', $('f-status').value)
    if ($('f-cidade').value.trim()) q.set('cidade', $('f-cidade').value.trim())
    return q.toString()
}

async function listar() {
    try {
        const lista = await api('/entregas?' + filtroQuery())
        const asc = $('f-ordem').value === 'asc'
        montarTabela($('tabela'), `Entregas ordenadas por data (${asc ? 'mais antigas' : 'mais recentes'} primeiro)`, [
            { titulo: 'Cód.', render: e => e.codEntrega },
            { titulo: 'Data', render: e => fmtData(e.data) },
            { titulo: 'Hora', render: e => fmtHora(e.hora) },
            { titulo: 'Cidade destino', render: e => e.cidadeDestino },
            { titulo: 'Status', render: e => h('span', { class: `badge ${e.status}` }, e.status) },
            { titulo: 'Carga / rastreio', render: e => e.carga ? `${e.carga.descricao} (${e.carga.codigoRastreio})` : '—' },
            { titulo: 'Motorista', render: e => (e.carga && e.carga.motorista) || '—' },
            { titulo: 'Ações', render: e => h('div', { class: 'acoes', style: 'margin:0' },
                h('button', { class: 'btn sm', type: 'button', onclick: () => editar(e), 'aria-label': `Atualizar entrega ${e.codEntrega}` }, 'Atualizar'),
                h('button', { class: 'btn sm perigo', type: 'button', onclick: () => excluir(e), 'aria-label': `Excluir entrega ${e.codEntrega}` }, 'Excluir')) }
        ], lista, 'Nenhuma entrega encontrada.')
    } catch (err) { mostrarMsg(err.message, 'erro') }
}

$('form').addEventListener('submit', async (ev) => {
    ev.preventDefault(); limparMsg()
    const cod = $('cod').value
    const body = { cidadeDestino: $('cidadeDestino').value.trim(), status: $('status').value, data: $('data').value, hora: $('hora').value }
    if (!cod) body.idCarga = $('idCarga').value
    if (!body.cidadeDestino || !body.data || !body.hora || (!cod && !body.idCarga)) return mostrarMsg('Preencha todos os campos.', 'erro')
    try {
        const r = await api(cod ? `/entregas/${cod}` : '/entregas', { method: cod ? 'PUT' : 'POST', body })
        mostrarMsg(r.message); resetForm(); await carregarCargas(); listar()
    } catch (err) { mostrarMsg(err.message, 'erro') }
})
$('btn-cancelar').addEventListener('click', async () => { resetForm(); limparMsg(); await carregarCargas() })
$('form-filtro').addEventListener('submit', (ev) => { ev.preventDefault(); limparMsg(); listar() })
$('btn-limpar').addEventListener('click', () => { $('form-filtro').reset(); limparMsg(); listar() })

resetForm()
carregarCargas().then(listar).catch(err => mostrarMsg(err.message, 'erro'))
