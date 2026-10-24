// Popula o banco com dados de exemplo. Uso: npm run seed (após `npx prisma migrate reset`).
import bcrypt from "bcrypt";
import { prisma } from "./lib/prisma.js";
import { gerarInventarios } from "./services/inventario.js";

const BIBLIOTECARIA = { nome: "Ana Bibliotecária", email: "admin@camugere.org", senha: "camugere123" };

const CDDS = [
  { id: "869.3", descricao: "Literatura brasileira — ficção" },
  { id: "869.1", descricao: "Literatura brasileira — poesia" },
  { id: "981", descricao: "História do Brasil" },
  { id: "305.8", descricao: "Grupos étnicos e raciais" },
  { id: "320", descricao: "Ciência política" },
];

const OBRAS = [
  { titulo: "Dom Casmurro", autor: "Machado de Assis", cdd: "869.3", ano: 1899, editora: "Garnier", numeroPaginas: 256, isbn: "9788535910667", capaUrl: "https://covers.openlibrary.org/b/id/647501-L.jpg", exemplares: 3 },
  { titulo: "Quarto de Despejo", autor: "Carolina Maria de Jesus", cdd: "869.3", ano: 1960, editora: "Ática", numeroPaginas: 200, isbn: "9788508171279", capaUrl: "https://covers.openlibrary.org/b/id/10590366-L.jpg", exemplares: 4 },
  { titulo: "Vidas Secas", autor: "Graciliano Ramos", cdd: "869.3", ano: 1938, editora: "Record", numeroPaginas: 176, isbn: "9788501012074", capaUrl: "https://covers.openlibrary.org/b/id/8231990-L.jpg", exemplares: 2 },
  { titulo: "Torto Arado", autor: "Itamar Vieira Junior", cdd: "869.3", ano: 2019, editora: "Todavia", numeroPaginas: 264, isbn: "9786580309313", capaUrl: "https://covers.openlibrary.org/b/id/10389354-L.jpg", exemplares: 3 },
  { titulo: "Sentimento do Mundo", autor: "Carlos Drummond de Andrade", cdd: "869.1", ano: 1940, editora: "Companhia das Letras", numeroPaginas: 176, isbn: "9788535920550", capaUrl: "https://covers.openlibrary.org/b/id/12648655-L.jpg", exemplares: 2 },
  { titulo: "Raízes do Brasil", autor: "Sérgio Buarque de Holanda", cdd: "981", ano: 1936, editora: "Companhia das Letras", numeroPaginas: 256, isbn: "9788535925487", capaUrl: "https://covers.openlibrary.org/b/id/8235116-L.jpg", exemplares: 2 },
  { titulo: "O Povo Brasileiro", autor: "Darcy Ribeiro", cdd: "981", ano: 1995, editora: "Companhia de Bolso", numeroPaginas: 440, isbn: "9788535907667", capaUrl: "https://covers.openlibrary.org/b/id/10521270-L.jpg", exemplares: 2 },
  { titulo: "Pequeno Manual Antirracista", autor: "Djamila Ribeiro", cdd: "305.8", ano: 2019, editora: "Companhia das Letras", numeroPaginas: 136, isbn: "9788535932874", capaUrl: "https://covers.openlibrary.org/b/id/10584915-L.jpg", exemplares: 3 },
  { titulo: "Como as Democracias Morrem", autor: "Steven Levitsky, Daniel Ziblatt", cdd: "320", ano: 2018, editora: "Zahar", numeroPaginas: 272, isbn: "9788537818008", capaUrl: "https://covers.openlibrary.org/b/id/8751962-L.jpg", exemplares: 2 },
];

// CPFs válidos de teste (gerados, não pertencem a ninguém)
const LEITORES = [
  { nome: "Joana Silva", email: "joana@example.com", cpf: "52998224725", telefone: "21987654321", cep: "20040002", logradouro: "Rua da Assembleia", numero: "10", bairro: "Centro", cidade: "Rio de Janeiro", uf: "RJ" },
  { nome: "Carlos Souza", email: "carlos@example.com", cpf: "11144477735", telefone: "21976543210" },
  { nome: "Beatriz Lima", email: "beatriz@example.com", cpf: "39053344705", telefone: null },
  { nome: "Rafael Gomes", email: "rafael@example.com", cpf: "15350946056", telefone: "2133334444" },
];

async function criarAutores(texto) {
  return Promise.all(
    texto.split(",").map((nomeCompleto) => {
      const [nome, ...resto] = nomeCompleto.trim().split(/\s+/);
      const sobrenome = resto.join(" ");
      return prisma.autor.upsert({
        where: { nome_sobrenome: { nome, sobrenome } },
        update: {},
        create: { nome, sobrenome },
      });
    }),
  );
}

async function main() {
  const hash = await bcrypt.hash(BIBLIOTECARIA.senha, 10);
  const admin = await prisma.usuario.upsert({
    where: { email: BIBLIOTECARIA.email },
    update: {},
    create: { nome: BIBLIOTECARIA.nome, email: BIBLIOTECARIA.email, hash },
  });
  if (!(await prisma.bibliotecario.findFirst({ where: { id_usuario: admin.id } }))) {
    await prisma.bibliotecario.create({ data: { id_usuario: admin.id } });
  }

  // Mantém também os logins de bibliotecário legados (user13@example.com a user17@example.com / hash13 a hash17)
  for (let i = 13; i <= 17; i++) {
    const emailLegado = `user${i}@example.com`;
    const hashLegado = await bcrypt.hash(`hash${i}`, 10);
    const uLegado = await prisma.usuario.upsert({
      where: { email: emailLegado },
      update: {},
      create: { nome: `Bibliotecário ${i}`, email: emailLegado, hash: hashLegado },
    });
    if (!(await prisma.bibliotecario.findFirst({ where: { id_usuario: uLegado.id } }))) {
      await prisma.bibliotecario.create({ data: { id_usuario: uLegado.id } });
    }
  }

  for (const cdd of CDDS) await prisma.cdd.upsert({ where: { id: cdd.id }, update: {}, create: cdd });

  const exemplares = [];
  for (const o of OBRAS) {
    if (await prisma.obra.findFirst({ where: { titulo: o.titulo } })) continue;
    const autores = await criarAutores(o.autor);
    const obra = await prisma.obra.create({
      data: {
        titulo: o.titulo,
        anoPublicacao: o.ano,
        editora: o.editora,
        numeroPaginas: o.numeroPaginas,
        isbn: o.isbn,
        capaUrl: o.capaUrl,
        id_cdd: o.cdd,
        autores: { create: autores.map((a) => ({ id_autor: a.id })) },
      },
    });
    for (const numeroInventario of gerarInventarios(obra.id, o.exemplares)) {
      exemplares.push(await prisma.exemplar.create({ data: { id_obra: obra.id, numeroInventario } }));
    }
  }

  const leitores = [];
  for (const l of LEITORES) {
    const existente = await prisma.leitor.findUnique({ where: { cpf: l.cpf } });
    if (existente) continue;
    leitores.push(
      await prisma.leitor.create({
        data: {
          ...Object.fromEntries(Object.entries(l).filter(([k]) => !["nome", "email"].includes(k))),
          usuario: { create: { nome: l.nome, email: l.email, hash: await bcrypt.hash(crypto.randomUUID(), 10) } },
        },
      }),
    );
  }

  // Alguns empréstimos: um em dia, um atrasado e um devolvido
  const hoje = new Date();
  const diasAtras = (n) => new Date(hoje.getTime() - n * 86_400_000);
  const cenarios = [
    { inicio: diasAtras(3), dias: 14, devolvido: false },
    { inicio: diasAtras(25), dias: 14, devolvido: false },
    { inicio: diasAtras(40), dias: 14, devolvido: true },
  ];
  for (const [i, c] of cenarios.entries()) {
    const exemplar = exemplares[i * 2];
    const leitor = leitores[i];
    if (!exemplar || !leitor) break;
    await prisma.emprestimo.create({
      data: {
        id_exemplar: exemplar.id,
        id_leitor: leitor.id,
        dataInicio: c.inicio,
        diasLocacao: c.dias,
        statusDevolucao: c.devolvido,
        dataDevolucao: c.devolvido ? diasAtras(28) : null,
      },
    });
    if (!c.devolvido) await prisma.exemplar.update({ where: { id: exemplar.id }, data: { disponivel: false } });
  }

  // Uma suspensão ativa de exemplo (leitor com atraso)
  if (leitores[1]) {
    await prisma.suspensao.create({
      data: { id_leitor: leitores[1].id, motivo: "Atraso recorrente na devolução", dataFim: new Date(hoje.getTime() + 7 * 86_400_000) },
    });
  }

  console.info(`Seed concluído. Login: ${BIBLIOTECARIA.email} / ${BIBLIOTECARIA.senha}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
