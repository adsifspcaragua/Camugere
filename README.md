# Biblioteca Camugerê

Sistema de gestão da biblioteca comunitária do Espaço Cultural Casa da Democracia: acervo, leitores, empréstimos, devoluções e relatórios.

| Pasta | Stack |
| --- | --- |
| `api/` | Node 20+, Express 5, Prisma (MySQL), Zod, JWT |
| `frontend/` | React 19, Vite, Tailwind CSS 4 |

O sistema roda em um único computador da biblioteca. A API também entrega o site, então tudo fica num só endereço: **http://localhost:3000**.

## Instalação no computador da biblioteca

### 1. Programas necessários

| Programa | Versão | Observação |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 20 ou mais recente (LTS) | Instalar com as opções padrão |
| [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) | 8 | Instalar como serviço do Windows, para iniciar junto com o computador |
| [Git](https://git-scm.com/) | qualquer | Só para baixar e atualizar o código |

### 2. Banco de dados

No MySQL (pelo MySQL Workbench ou pelo terminal `mysql -u root -p`), crie o banco e um usuário só para o sistema. Troque a senha do exemplo:

```sql
CREATE DATABASE camugere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'camugere'@'localhost' IDENTIFIED BY 'troque-esta-senha';
GRANT ALL PRIVILEGES ON camugere.* TO 'camugere'@'localhost';
```

### 3. Configuração

```bash
git clone https://github.com/adsifspcaragua/Camugere.git
cd Camugere/api
copy .env.sample .env
```

Abra `api/.env` num editor de texto e preencha:

| Variável | O que colocar |
| --- | --- |
| `DATABASE_URL` | `mysql://camugere:troque-esta-senha@localhost:3306/camugere` (usuário e senha do passo 2) |
| `JWT_SECRET` | Uma frase longa e aleatória, só deste computador. Para gerar: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |

### 4. Preparar o sistema

Na pasta raiz do projeto (`Camugere`):

```bash
npm run preparar
```

O comando instala as dependências, cria as tabelas no banco vazio e gera o site. Ele não cria nenhuma conta nem dado de exemplo.

### 5. Primeiro acesso

1. Dê dois cliques em **`iniciar-camugere.bat`**, na pasta raiz. A janela preta é o sistema rodando: deixe-a aberta.
2. O navegador abre em http://localhost:3000 com a tela **Primeiro acesso**.
3. Informe nome, e-mail e senha de quem vai administrar a biblioteca. Essa tela só aparece enquanto não existe nenhuma conta.
4. Em **Configurações › E-mail da biblioteca**, configure a conta de e-mail (veja [E-mail](#e-mail)).
5. As outras pessoas da equipe são adicionadas em **Configurações › Equipe da biblioteca**.
6. Em **Configurações › Backup**, ligue o backup automático, informe a pasta da cópia extra (Google Drive ou pen drive) e clique em **Fazer backup agora** para conferir. Veja [Backup](#backup).

### Iniciar junto com o Windows (recomendado)

Aperte `Win + R`, digite `shell:startup` e crie nessa pasta um atalho para o `iniciar-camugere.bat`. Assim o sistema já está aberto quando alguém liga o computador, e o backup automático acontece mesmo que ninguém abra o sistema.

## Uso diário

- **Abrir o sistema:** `iniciar-camugere.bat`, ou acesse http://localhost:3000 se ele já estiver aberto.
- **Fechar:** feche a janela preta do sistema.
- **Backup:** automático, nos dias e no horário de Configurações › Backup. Confira lá se o último deu certo (veja [Backup](#backup)).
- **Trocar a própria senha:** Configurações › Equipe da biblioteca › Alterar minha senha.

### Esqueci minha senha

| Situação | O que fazer |
| --- | --- |
| E-mail configurado | Na tela de login, clique em **Esqueci minha senha**. Chega um link válido por 30 minutos. |
| E-mail não configurado | Outra pessoa da equipe define uma nova senha em **Configurações › Equipe da biblioteca** (ícone de chave). |
| Ninguém consegue entrar | Na pasta `api`, rode `npm run redefinir-senha` e siga as perguntas. |

Trocar ou redefinir a senha encerra as sessões abertas com a senha antiga.

## E-mail

O sistema envia três tipos de e-mail: comprovante de empréstimo, lembrete de devolução e link de "esqueci minha senha". A própria equipe configura em **Configurações › E-mail da biblioteca**:

1. Clique em **Configurar** e escolha o provedor (**Gmail** ou **Outro provedor**).
2. Informe o e-mail da biblioteca e a **senha de app**. No Gmail, ela é gerada em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), com a verificação em duas etapas ativada. A tela explica o passo a passo.
3. Salve e clique em **Enviar e-mail de teste**. O teste chega no e-mail de quem está logado. Se der erro, a tela explica o motivo (senha errada, servidor não encontrado etc.).

A senha fica guardada cifrada no banco, com uma chave derivada do `JWT_SECRET`. Ela nunca é mostrada de novo. Se o `JWT_SECRET` for trocado, basta salvar a senha outra vez.

Sem e-mail configurado, o sistema funciona normalmente, mas não envia e-mails: Configurações avisa, e o empréstimo informa que o comprovante não foi enviado.

**Alternativa pelo arquivo:** as variáveis `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM` no `api/.env` também funcionam. A configuração feita na tela tem prioridade.

Os lembretes saem automaticamente para empréstimos que vencem nos próximos `LEMBRETE_DIAS_ANTES` dias (padrão: 2), uma vez por prazo. Para desligar, use `LEMBRETES_AUTOMATICOS=false`.

## Backup

Cada backup cria a pasta `backups\camugere-AAAA-MM-DD_HHhMM`, ao lado da pasta `api`, com o banco (`camugere.sql`) e as capas (`uploads`). Os backups mais antigos são apagados: ficam só os 10 mais recentes, ou a quantidade definida na tela.

Tudo é configurado em **Configurações › Backup**:

| Opção | O que faz |
| --- | --- |
| **Backup automático** | Dias da semana e horário. O sistema precisa estar aberto. Se estiver fechado no horário, o backup é feito assim que ele abrir. Se falhar, tenta de novo depois de 1 hora. |
| **Copiar também para** | Pasta que recebe uma cópia de cada backup: um pen drive ou uma pasta do Google Drive para computador. Se ela não estiver acessível, o backup é feito mesmo assim e a tela avisa. |
| **Quantos backups guardar** | Vale para a pasta `backups` e para a pasta da cópia. |
| **Fazer backup agora** | Faz um backup na hora. |

A tela mostra quando foi o último backup, se deu certo e o motivo quando não deu. Também mostra os backups guardados e o próximo horário.

**Guarde uma cópia fora deste computador.** Se o computador quebrar, os backups dentro dele se perdem junto. A forma mais simples é a pasta do Google Drive para computador em "Copiar também para": cada backup vai para a nuvem sozinho.

**Pelo atalho:** dar dois cliques em **`backup-camugere.bat`**, na pasta raiz, faz um backup na hora com a mesma configuração, mesmo com o sistema fechado. O resultado também aparece na tela.

**Pelo arquivo:** sem configuração na tela, valem `BACKUP_COPIA_PARA` e `BACKUP_MANTER` do `api/.env`. Se o MySQL não for encontrado, informe o caminho do `mysqldump.exe` em `MYSQLDUMP`.

Para restaurar, com o sistema fechado:

1. Abra o **MySQL Command Line Client**, no menu Iniciar, e digite a senha do `root`.
2. Rode os comandos abaixo, trocando o caminho pelo do backup. Use barras `/`.

   ```sql
   DROP DATABASE camugere;
   CREATE DATABASE camugere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   USE camugere;
   SOURCE C:/Camugere/backups/camugere-AAAA-MM-DD_HHhMM/camugere.sql
   ```

   Os comandos apagam os dados atuais e põem os do backup no lugar. O usuário `camugere` continua com acesso.
3. Copie a pasta `uploads` do backup para `api\uploads`.

## Atualizar o sistema

Com o sistema fechado, na pasta raiz:

```bash
git pull
npm run preparar
```

`preparar` aplica as novas alterações de banco sem apagar dados.

## Desenvolvimento

```bash
# API
cd api
copy .env.sample .env        # preencha DATABASE_URL e JWT_SECRET; EMAIL_TESTE=true usa uma caixa de teste
npm install
npx prisma migrate reset     # cria o banco de desenvolvimento do zero
npm run seed:demo            # opcional: dados fictícios + login admin@camugere.org / camugere123
npm run dev                  # http://localhost:3000

# Frontend (outro terminal)
cd frontend
copy .env.example .env
npm install
npm run dev                  # http://localhost:5173
```

`seed:demo` cria leitores, obras e uma conta com senha conhecida. **Nunca rode no computador da biblioteca.** O comando se recusa a rodar se o banco já tiver bibliotecários reais.

Com `EMAIL_TESTE=true` e sem SMTP, os e-mails vão para uma caixa de teste do Ethereal, e o link de cada um aparece no console.

### Arquitetura da API

```
src/
  app.js              monta middlewares e rotas; serve o site (frontend/dist) quando ele existe
  config/env.js       variáveis de ambiente
  lib/                prisma (instância única) e HttpError
  middlewares/        auth (Bearer JWT), validação Zod, limite de tentativas, tratamento de erros
  schemas/            validação de entrada por entidade
  services/           regras de negócio e acesso ao banco
  controllers/        fábrica CRUD que conecta rota -> service
  routes/             definição das rotas
  cli/                comandos de manutenção (redefinir senha, backup)
```

- **Erros:** viram respostas consistentes. `400` validação, `401` sem token ou sessão encerrada, `404` não encontrado, `409` conflito (ex.: exemplar já emprestado), `429` tentativas demais.
- **Transações:** empréstimo e devolução rodam em transação, então o exemplar nunca fica com status errado.
- **Token:** o JWT carrega a versão da senha. Trocar a senha ou remover o acesso invalida as sessões abertas.

### Rotas principais

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/status` | verificação de funcionamento |
| GET / POST | `/primeiro-acesso` | situação / cria a primeira conta (só com o sistema vazio) |
| POST | `/login` | `{ email, senha }` → token |
| GET | `/me` | perfil do bibliotecário logado |
| PATCH | `/me/senha` | `{ senhaAtual, novaSenha }` → token novo |
| POST | `/senha/esqueci` | `{ email }` envia o link de redefinição |
| POST | `/senha/validar-link`, `/senha/redefinir` | `{ token }` / `{ token, novaSenha }` |
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
| PATCH | `/bibliotecario/:id/senha` | `{ novaSenha }` define a senha de um colega |
| GET / POST | `/emprestimo/lembretes`, `/emprestimo/lembretes/enviar` | status e envio manual dos lembretes |
| GET / PUT / DELETE | `/configuracao/email` | servidor de e-mail (a senha nunca é devolvida) |
| POST | `/configuracao/email/teste` | envia um e-mail de teste para quem está logado |
| GET / PUT | `/configuracao/backup` | agenda, pasta extra, último resultado e backups guardados |
| POST | `/configuracao/backup/executar` | faz um backup agora |

### Testes

```bash
cd api && npm test
cd frontend && npm test
```
