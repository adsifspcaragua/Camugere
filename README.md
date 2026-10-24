# Biblioteca Camugerê

Sistema de gestão da biblioteca comunitária do Espaço Cultural Casa da Democracia: acervo, leitores, empréstimos, devoluções e relatórios.

| Pasta | Stack |
| --- | --- |
| `api/` | Node 20+, Express 5, Prisma (MySQL), Zod, JWT |
| `frontend/` | React 19, Vite, Tailwind CSS 4 |

## Rodando localmente

```bash
# API
cd api
cp .env.sample .env          # preencha DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate reset     # cria o banco do zero e aplica a migration
npm run seed                 # dados de exemplo + login admin@camugere.org / camugere123
npm run dev                  # http://localhost:3000

# Frontend (outro terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

> Depois de atualizar o código, rode `npx prisma migrate dev` para aplicar a migration de suspensões, endereço e lembretes.
>
> **Banco já existente:** as três migrations antigas foram substituídas por uma única `baseline`
> (a antiga `init` recriava tabelas e quebrava em banco novo). Em ambiente de desenvolvimento,
> rode `npx prisma migrate reset` uma vez.

## Arquitetura da API

```
src/
  app.js              monta middlewares e rotas
  config/env.js       variáveis de ambiente validadas
  lib/                prisma (instância única) e HttpError
  middlewares/        auth (Bearer JWT), validação Zod, tratamento de erros
  schemas/            validação de entrada por entidade
  services/           regras de negócio e acesso ao banco
  controllers/        fábrica CRUD que conecta rota -> service
  routes/             definição das rotas
```

- Erros viram respostas consistentes: `400` validação, `401` sem token, `404` não encontrado, `409` conflito (ex.: exemplar já emprestado).
- Empréstimo e devolução rodam em transação: o exemplar nunca fica com status errado.
- O token vai em `Authorization: Bearer <token>` (o header antigo `jwt_token` ainda é aceito).

### Rotas principais

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/login` | `{ email, senha }` → token |
| GET | `/me` | perfil do bibliotecário logado |
| GET/POST/PUT/DELETE | `/obra/list`, `/obra/create`, `/obra/update/:id`, `/obra/delete/:id` | acervo |
| POST | `/exemplar/create` | `{ id_obra }` gera o próximo nº de inventário |
| * | `/leitor/...` | mesmo padrão CRUD |
| POST | `/emprestimo/create` | `{ id_leitor, id_exemplar, diasLocacao, enviarNotificacao }` |
| PATCH | `/emprestimo/devolver/:id` | registra devolução |
| PATCH | `/emprestimo/renovar/:id` | `{ dias }` |
| POST | `/upload/capa` | arquivo (`capa`) ou `{ url }` |
| GET | `/leitor/:id/emprestimos` | histórico completo do leitor |
| POST | `/leitor/:id/suspender` | `{ motivo, dias }` (`dias` nulo = indeterminado) |
| PATCH | `/leitor/suspensao/:id/encerrar` | libera o leitor antes do prazo |
| GET | `/leitor/:id/suspensoes` | histórico de suspensões |
| POST | `/bibliotecario/cadastrar` | `{ nome, email, senha }` cria um novo acesso |
| GET / POST | `/emprestimo/lembretes`, `/emprestimo/lembretes/enviar` | status e envio manual dos lembretes |

### Lembretes automáticos

Ao subir, a API verifica de hora em hora os empréstimos que vencem nos próximos `LEMBRETE_DIAS_ANTES` dias (padrão 2)
e envia um e-mail a cada leitor, uma vez por prazo. Desligue com `LEMBRETES_AUTOMATICOS=false`.
Sem SMTP configurado, os e-mails vão para uma caixa de teste do Ethereal (o link aparece no console).

## Testes

```bash
cd api && npm test
cd frontend && npm test
```
