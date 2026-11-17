// Último recurso quando ninguém consegue entrar e o e-mail não está configurado.
// Uso, na pasta api do computador da biblioteca: npm run redefinir-senha
import readline from "node:readline";
import { prisma } from "../lib/prisma.js";
import { hashSenha } from "../services/usuarioService.js";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
const linhas = rl[Symbol.asyncIterator]();
let ocultar = false;
// Em terminal, troca o que é digitado na senha por asteriscos.
if (process.stdin.isTTY) {
  const escrever = rl._writeToOutput.bind(rl);
  rl._writeToOutput = (s) => (ocultar && !/[\r\n]/.test(s) ? rl.output.write("*".repeat(s.length)) : escrever(s));
}

async function perguntar(texto, { oculto = false } = {}) {
  process.stdout.write(texto);
  ocultar = oculto;
  const { value, done } = await linhas.next();
  ocultar = false;
  if (!process.stdin.isTTY) process.stdout.write("\n");
  if (done) throw new Error("entrada encerrada.");
  return value.trim();
}

async function main() {
  console.info("Redefinir a senha de um bibliotecário da Biblioteca Comunitária\n");
  const email = (await perguntar("E-mail da conta: ")).toLowerCase();
  const usuario = await prisma.usuario.findUnique({ where: { email }, include: { bibliotecarios: { take: 1 } } });
  if (!usuario?.bibliotecarios.length) throw new Error("nenhum bibliotecário cadastrado com este e-mail.");

  const senha = await perguntar("Nova senha (mínimo de 6 caracteres): ", { oculto: true });
  if (senha.length < 6 || senha.length > 72) throw new Error("a senha precisa ter entre 6 e 72 caracteres.");
  if ((await perguntar("Repita a nova senha: ", { oculto: true })) !== senha) throw new Error("as senhas não conferem.");

  await prisma.usuario.update({ where: { id: usuario.id }, data: { hash: await hashSenha(senha), versaoToken: { increment: 1 } } });
  console.info(`\nPronto. ${usuario.nome} já pode entrar com a nova senha.`);
}

main()
  .catch((error) => {
    console.error(`\nNão foi possível redefinir a senha: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await prisma.$disconnect();
  });
