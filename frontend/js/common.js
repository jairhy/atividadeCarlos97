// Funções compartilhadas: sessão, chamadas à API, cabeçalho/navegação e utilitários de DOM.
const API = '/api'
const MENU = [
    { href: 'index.html', texto: 'Início', id: 'inicio' },
    { href: 'motoristas.html', texto: 'Motoristas', id: 'motoristas' },
    { href: 'cargas.html', texto: 'Cargas', id: 'cargas' },
    { href: 'entregas.html', texto: 'Entregas', id: 'entregas' }
]

const Sessao = {
    salvar(d) {
        sessionStorage.setItem('token', d.token)
        sessionStorage.setItem('expiraEm', String(d.expiraEm))
        sessionStorage.setItem('funcionario', JSON.stringify(d.funcionario))
    },
    token: () => sessionStorage.getItem('token'),
    expiraEm: () => Number(sessionStorage.getItem('expiraEm') || 0),
    funcionario: () => { try { return JSON.parse(sessionStorage.getItem('funcionario')) } catch { return null } },
    limpar: () => sessionStorage.clear(),
    valida() { return !!this.token() && Date.now() < this.expiraEm() }
}

function irParaLogin(motivo) {
    Sessao.limpar()
    location.replace('login.html' + (motivo ? `?motivo=${motivo}` : ''))
}

async function api(caminho, { method = 'GET', body } = {}) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (Sessao.token()) headers.Authorization = `Bearer ${Sessao.token()}`

    const resp = await fetch(API + caminho, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    let dados = null
    try { dados = await resp.json() } catch { /* sem corpo */ }

    if (resp.status === 401 && !caminho.startsWith('/auth/login')) {
        irParaLogin('expirada')
        throw new Error('Sessão expirada')
    }
    if (!resp.ok) throw new Error((dados && dados.message) || 'Erro na requisição.')
    return dados
}

// Cria elementos sem innerHTML (evita XSS)
function h(tag, attrs = {}, ...filhos) {
    const e = document.createElement(tag)
    for (const [k, v] of Object.entries(attrs || {})) {
        if (v === false || v == null) continue
        if (k === 'class') e.className = v
        else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v)
        else e.setAttribute(k, v === true ? '' : v)
    }
    for (const f of filhos.flat()) if (f != null) e.append(f.nodeType ? f : document.createTextNode(String(f)))
    return e
}

// Guarda de página + cabeçalho com funcionário logado, navegação e logout
function iniciarPagina(ativo) {
    if (!Sessao.valida()) return irParaLogin(Sessao.token() ? 'expirada' : '')
    setTimeout(() => irParaLogin('expirada'), Math.max(Sessao.expiraEm() - Date.now(), 0))

    const f = Sessao.funcionario() || {}
    const hora = new Date(Sessao.expiraEm()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const nav = h('nav', { class: 'nav', 'aria-label': 'Navegação principal' },
        h('ul', {}, MENU.map(m => h('li', {}, h('a', { href: m.href, 'aria-current': m.id === ativo ? 'page' : false }, m.texto)))))

    const sair = h('button', { class: 'btn sec sm', type: 'button', onclick: logout }, 'Sair (logout)')
    const usuario = h('div', { class: 'usuario' },
        h('div', {}, h('span', {}, 'Funcionário: ', h('strong', { id: 'func-nome' }, f.nome || '—')), h('small', {}, `Sessão válida até ${hora}`)),
        sair)

    const topo = h('header', { class: 'topo' },
        h('div', { class: 'topo-in' }, h('a', { class: 'marca', href: 'index.html' }, '🚚 Logística Express'), nav, usuario))

    document.body.prepend(h('a', { class: 'skip', href: '#conteudo' }, 'Ir para o conteúdo'), topo)
    document.getElementById('conteudo')?.setAttribute('tabindex', '-1')
}

async function logout() {
    try { await api('/auth/logout', { method: 'POST' }) } catch { /* segue mesmo assim */ }
    irParaLogin('saiu')
}

// Mensagens (região aria-live)
function mostrarMsg(texto, tipo = 'ok') {
    const area = document.getElementById('mensagem')
    if (!area) return
    area.className = `msg ${tipo}`
    area.textContent = texto
    if (texto) area.scrollIntoView({ block: 'nearest' })
}
const limparMsg = () => { const a = document.getElementById('mensagem'); if (a) { a.textContent = ''; a.className = 'msg' } }

// Formatação
const soDigitos = (s) => String(s || '').replace(/\D/g, '')
const fmtCPF = (s) => soDigitos(s).replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
const fmtTel = (s) => { const d = soDigitos(s); return d.length === 11 ? d.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3') : d.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3') }
const fmtData = (s) => (s ? s.split('-').reverse().join('/') : '')
const fmtHora = (s) => (s ? s.slice(0, 5) : '')
const fmtNum = (n, c = 2) => Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: c })

// Monta uma tabela acessível. colunas: [{titulo, render(item)}]
function montarTabela(destino, legenda, colunas, itens, vazio) {
    destino.replaceChildren()
    if (!itens.length) { destino.append(h('p', { class: 'vazio' }, vazio)); return }
    const thead = h('thead', {}, h('tr', {}, colunas.map(c => h('th', { scope: 'col' }, c.titulo))))
    const tbody = h('tbody', {}, itens.map(i => h('tr', {}, colunas.map(c => h('td', {}, c.render(i))))))
    destino.append(h('table', {}, h('caption', {}, legenda), thead, tbody))
}
