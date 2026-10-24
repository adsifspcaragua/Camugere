# O que mudou nesta refatoração

## Bugs corrigidos

**Quebravam o projeto**
- `frontend/src/App.jsx`: merge mal resolvido, com handlers duplicados e chaves sobrando. O arquivo nem compilava.
- `api/src/Model/LeitorModel.js`: merge quebrado (objetos `select` aninhados errado e variáveis `transaction`, `nome` e `contato` que não existiam). Não era possível listar nem atualizar leitores.
- Migrations: a `init` rodava depois da `db pull` e recriava as mesmas tabelas, então `migrate deploy` falhava em banco novo. Agora é uma baseline única.

**Lógica**
- A lista de atrasados incluía empréstimos já devolvidos.
- A devolução fazia dois `PUT` seguidos no frontend. O status do exemplar podia ficar inconsistente.
- Dois empréstimos ao mesmo tempo podiam pegar o mesmo exemplar. Agora a reserva é atômica, numa transação.
- `getObraAutorByIdObraController` usava uma variável inexistente (`id_autor`), e a exclusão de ObraAutor nunca funcionava.
- `createUsuario` não tinha `await` e devolvia uma Promise. `updateUsuario` exigia a senha em toda edição.
- Os números de inventário eram gerados com `Date.now().slice(-4)` e colidiam. Agora seguem o formato `0012-03` (obra-sequência).
- `listExemplaresIndisponiveis` chamava a rota de disponíveis.
- O campo `nome` do usuário tinha só 20 caracteres, e nomes completos de leitor eram recusados. Agora são 80.
- `id_cdd` tinha 6 caracteres, menos que os 15 do `Cdd.id`. Um código como "005.133" não cabia.
- Todo erro voltava como 500. Agora vêm 400, 401, 404 e 409 com mensagens claras.

**Segurança**
- O `JWT_SECRET` estava commitado no `frontend/.env`. Esse arquivo foi removido. **Troquem o secret em produção.**
- O login dizia se o e-mail existia ou não. Agora a mensagem é a mesma para os dois casos.
- Nome e título iam para o HTML do e-mail sem escape. Agora são escapados.
- O CORS pode ser restrito por `CORS_ORIGIN`.

## Clean code
- Backend: saem cerca de 50 controllers quase idênticos e entra uma fábrica CRUD com services por entidade. Há um único `PrismaClient`, validação Zod via middleware e tratamento de erro centralizado.
- Frontend: todo acesso a dados está no `LibraryContext`. As telas não fazem mais `fetch`, e acabou o N+1 de requisições (o `RecentMovements` fazia 3 chamadas por linha).
- Há um cliente HTTP único (`lib/api.js`) e as regras de prazo e atraso viraram funções puras testáveis (`lib/loans.js`, `lib/reports.js`).
- Foram removidos `mockData.js`, os relatórios de coverage e mutação versionados, a pasta `.netlify` com caminho local do Windows e os assets do template Vite.

## Design
- Identidade editorial: Fraunces (títulos) + Inter, cores de papel, tinta, verde-floresta e terracota, bordas finas, tabelas densas e sem gradientes nem emojis.
- Tema escuro com tokens semânticos, layout responsivo (menu lateral vira gaveta no celular) e diálogos de confirmação próprios no lugar de `alert`.
- A tela de configurações agora funciona: o prazo padrão, os dias de renovação e o envio de e-mail ficam salvos e são usados nos fluxos.

## Funcionalidades novas

- **Vários bibliotecários.** Em Configurações, a seção "Equipe" cadastra pessoas novas com e-mail e senha e remove acessos. O sistema não deixa remover o próprio acesso nem o último bibliotecário.
- **Endereço do leitor.** CEP, logradouro, número, complemento, bairro, cidade e UF. Ao digitar o CEP, o endereço é preenchido pelo ViaCEP.
- **Suspensão de leitores.** No detalhe do leitor, dá pra suspender com motivo e prazo (7, 15, 30 ou 90 dias, ou indeterminado) e liberar antes do prazo. Leitor suspenso não consegue pegar livro: a API recusa e o formulário avisa.
- **Histórico de suspensões.** Cada suspensão aparece como ativa, cumprida ou encerrada, com o motivo e quem aplicou.
- **Histórico por leitor.** Clicando no nome do leitor, aparecem os empréstimos em andamento, todos os empréstimos e as suspensões.
- **Relatório de atrasos.** Em Relatórios, a aba "Atrasos" lista os em aberto e os devolvidos fora do prazo no período, com contato do leitor, dias de atraso e exportação em CSV.
- **Lembrete antes do vencimento.** E-mail automático X dias antes do prazo, uma vez por prazo; renovar gera um lembrete novo. Também dá pra enviar os pendentes na hora pela tela de Configurações.
- Já existiam desde a refatoração: upload de capa, ranking de quem mais atrasa, filtro de ano e mês nos rankings e e-mail ao registrar o empréstimo.
