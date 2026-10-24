import { prisma } from "../lib/prisma.js";
import { emprestimoSelect } from "./selects.js";
import { dataPrevistaDevolucao } from "../utils/dates.js";
import { enviarLembreteDevolucao } from "./emailService.js";

export const DIAS_ANTES = Number(process.env.LEMBRETE_DIAS_ANTES || 2);

/** Empréstimos ativos que vencem entre hoje e `diasAntes` dias e ainda não receberam lembrete. */
export function filtrarPendentes(emprestimos, diasAntes = DIAS_ANTES, agora = new Date()) {
  const limite = new Date(agora);
  limite.setDate(limite.getDate() + diasAntes);
  limite.setHours(23, 59, 59, 999);
  return emprestimos.filter((e) => {
    if (e.statusDevolucao || e.lembreteEnviadoEm) return false;
    const prevista = dataPrevistaDevolucao(e);
    return prevista >= agora && prevista <= limite;
  });
}

export async function listarPendentes(diasAntes = DIAS_ANTES) {
  const ativos = await prisma.emprestimo.findMany({
    where: { statusDevolucao: false, lembreteEnviadoEm: null },
    select: emprestimoSelect,
  });
  return filtrarPendentes(ativos, diasAntes);
}

export async function enviarLembretes(diasAntes = DIAS_ANTES) {
  const pendentes = await listarPendentes(diasAntes);
  const resultado = { diasAntes, verificados: pendentes.length, enviados: 0, falhas: [] };

  for (const emprestimo of pendentes) {
    try {
      const envio = await enviarLembreteDevolucao(emprestimo);
      if (!envio.enviado) throw new Error(envio.motivo);
      await prisma.emprestimo.update({ where: { id: emprestimo.id }, data: { lembreteEnviadoEm: new Date() } });
      resultado.enviados += 1;
    } catch (error) {
      resultado.falhas.push({ id: emprestimo.id, erro: error.message });
    }
  }
  return resultado;
}

const UMA_HORA = 60 * 60 * 1000;

/** Verifica de hora em hora (e na inicialização). Desligue com LEMBRETES_AUTOMATICOS=false. */
export function agendarLembretes() {
  if (process.env.LEMBRETES_AUTOMATICOS === "false") return null;
  const executar = () =>
    enviarLembretes()
      .then((r) => r.enviados && console.info(`[lembretes] ${r.enviados} lembrete(s) enviado(s).`))
      .catch((error) => console.error("[lembretes] falha:", error.message));
  setTimeout(executar, 10_000);
  return setInterval(executar, UMA_HORA);
}
