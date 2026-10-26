# Logística Express — Sistema de Gestão e Rastreamento de Encomendas

Sistema interno (Node.js + Express + Sequelize + MySQL) com frontend em HTML/CSS/JS.

```
backend/        API, regras de negócio, testes (npm test)
frontend/       telas (login, principal, motoristas, cargas, entregas)
database/       script_db_logistica.sql (estrutura + 3 registros por tabela)
diagramas_UML/  diagrama de classes e modelo lógico
docs/           DOCUMENTACAO.md (RF, RNF, RN, infraestrutura, rotas, testes)
```

## Início rápido
```bash
cd backend
npm install
# ajuste usuário/senha do banco em config/config.js
npm run sync && npm run seed
npm start                   # http://localhost:3000
```
Login de teste: `carlos@logisticaexpress.com` / `Senha@123`

Testes: `npm test` (usa o banco separado `db_logistica_test`).

Documentação completa: [docs/DOCUMENTACAO.md](docs/DOCUMENTACAO.md)
