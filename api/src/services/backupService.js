// Backup pela tela de Configurações: agenda semanal, pasta extra, "fazer agora" e o resultado do último backup.
// O backup-camugere.bat usa esta mesma configuração e também registra o resultado aqui.
import path from "node:path";
import fs from "node:fs";
import { prisma } from "../lib/prisma.js";
import { badRequest, conflict } from "../lib/httpError.js";
import { PASTA_BACKUPS, fazerBackup, listarBackups } from "../cli/backup.js";

const PADRAO = { automatico: false, diasSemana: "5", horario: "17:00", agendaDesde: null, pastaCopia: null, manter: 10 };
const UM_MINUTO = 60 * 1000;
const UMA_HORA = 60 * UM_MINUTO;

const lerDias = (texto) =>
  [...new Set(String(texto ?? "").split(",").map(Number))].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort((a, b) => a - b);

async function lerLinha() {
  return prisma.configuracaoBackup.findUnique({ where: { id: 1 } });
}

/** Configuração em uso: a da tela; sem ela, a pasta extra e a quantidade do .env. */
export async function obterConfig() {
  const salvo = await lerLinha();
  if (salvo) return { ...salvo, dias: lerDias(salvo.diasSemana), origemPasta: salvo.pastaCopia ? "tela" : null };
  const pastaEnv = process.env.BACKUP_COPIA_PARA || null;
  return {
    ...PADRAO,
    dias: lerDias(PADRAO.diasSemana),
    pastaCopia: pastaEnv,
    origemPasta: pastaEnv ? "env" : null,
    manter: Number(process.env.BACKUP_MANTER) || PADRAO.manter,
  };
}

/**
 * Último horário agendado que já passou (até 7 dias atrás), ou null.
 * Horários anteriores a `agendaDesde` (quando a agenda foi salva) não contam.
 */
export function ultimoHorarioAgendado({ dias, horario, agendaDesde }, agora = new Date()) {
  if (!dias?.length) return null;
  const [h, m] = horario.split(":").map(Number);
  for (let voltar = 0; voltar <= 7; voltar++) {
    const slot = new Date(agora);
    slot.setDate(slot.getDate() - voltar);
    slot.setHours(h, m, 0, 0);
    if (slot > agora || !dias.includes(slot.getDay())) continue;
    return agendaDesde && slot < new Date(agendaDesde) ? null : slot;
  }
  return null;
}

/** Próximo horário agendado, para mostrar na tela. */
export function proximoHorario({ dias, horario }, agora = new Date()) {
  if (!dias?.length) return null;
  const [h, m] = horario.split(":").map(Number);
  for (let avancar = 0; avancar <= 7; avancar++) {
    const slot = new Date(agora);
    slot.setDate(slot.getDate() + avancar);
    slot.setHours(h, m, 0, 0);
    if (slot > agora && dias.includes(slot.getDay())) return slot;
  }
  return null;
}

/**
 * Hora de fazer o backup automático? Sim quando um horário agendado passou sem backup bem-sucedido depois dele
 * (inclusive se o computador estava desligado na hora). Depois de uma falha, espera 1 hora para tentar de novo.
 */
export function deveExecutar(config, agora = new Date()) {
  if (!config.automatico) return false;
  const slot = ultimoHorarioAgendado(config, agora);
  if (!slot) return false;
  if (config.ultimoSucessoEm && new Date(config.ultimoSucessoEm) >= slot) return false;
  if (config.ultimoOk === false && config.ultimoEm && agora - new Date(config.ultimoEm) < UMA_HORA) return false;
  return true;
}

function pastaAcessivel(pasta) {
  try {
    return fs.statSync(pasta).isDirectory();
  } catch {
    return false;
  }
}

/** O que a tela mostra. */
export async function obterParaTela() {
  const c = await obterConfig();
  const guardados = listarBackups(PASTA_BACKUPS);
  return {
    automatico: c.automatico,
    dias: c.dias,
    horario: c.horario,
    pastaCopia: c.pastaCopia,
    origemPasta: c.origemPasta,
    pastaCopiaAcessivel: c.pastaCopia ? pastaAcessivel(c.pastaCopia) : null,
    manter: c.manter,
    proximo: c.automatico ? proximoHorario(c) : null,
    pastaBackups: PASTA_BACKUPS,
    guardados: guardados.slice(0, 5),
    totalGuardados: guardados.length,
    emAndamento: Boolean(emAndamento),
    ultimo: c.ultimoEm
      ? { em: c.ultimoEm, ok: c.ultimoOk, mensagem: c.ultimaMensagem, destino: c.ultimoDestino, sucessoEm: c.ultimoSucessoEm }
      : null,
  };
}

export async function salvar({ automatico, dias, horario, pastaCopia, manter }) {
  const pasta = pastaCopia?.trim() || null;
  if (pasta && !path.isAbsolute(pasta)) {
    throw badRequest("Informe o caminho completo da pasta.", ["pastaCopia: informe o caminho completo, por exemplo E:\\Backup Camugere"]);
  }
  if (pasta && path.resolve(pasta).toLowerCase().startsWith(PASTA_BACKUPS.toLowerCase())) {
    throw badRequest("A cópia extra precisa ficar fora da pasta de backups.", ["pastaCopia: escolha uma pasta fora de " + PASTA_BACKUPS]);
  }
  const atual = await lerLinha();
  const diasSemana = lerDias(dias.join(",")).join(",");
  const agendaMudou = !atual || atual.automatico !== automatico || atual.diasSemana !== diasSemana || atual.horario !== horario;
  const dados = {
    automatico,
    diasSemana,
    horario,
    pastaCopia: pasta,
    manter,
    // Ao ligar ou mudar a agenda, só contam os horários daqui para frente.
    ...(agendaMudou && { agendaDesde: new Date() }),
  };
  if (atual) await prisma.configuracaoBackup.update({ where: { id: 1 }, data: dados });
  else await prisma.configuracaoBackup.create({ data: { id: 1, ...dados } });
  return obterParaTela();
}

async function registrar(resultado) {
  const dados = { ultimoEm: new Date(), ...resultado };
  // A linha pode não existir ainda (backup pelo atalho antes de configurar a tela).
  await prisma.configuracaoBackup.upsert({ where: { id: 1 }, update: dados, create: { id: 1, ...dados } });
}

let emAndamento = null;

/** Faz o backup com a configuração atual e registra o resultado. Um de cada vez. */
export async function executarBackup({ origem = "tela", log = () => {} } = {}) {
  if (emAndamento) throw conflict("Já existe um backup em andamento. Aguarde terminar.");
  emAndamento = (async () => {
    let config;
    try {
      config = await obterConfig();
    } catch {
      // Sem acesso ao banco para ler a configuração: segue com o .env (o mysqldump vai dizer o que houve).
      config = { pastaCopia: process.env.BACKUP_COPIA_PARA, manter: process.env.BACKUP_MANTER };
    }
    try {
      const r = await fazerBackup({ pastaCopia: config.pastaCopia, manter: config.manter, log });
      const mensagem = r.avisoCopia ?? (r.copia ? `Cópia extra em ${r.copia}.` : null);
      await registrar({ ultimoOk: true, ultimaMensagem: mensagem, ultimoDestino: r.destino, ultimoSucessoEm: new Date() }).catch(() => {});
      console.info(`[backup] (${origem}) concluído em ${r.destino}`);
      return r;
    } catch (error) {
      await registrar({ ultimoOk: false, ultimaMensagem: error.message.slice(0, 1000), ultimoDestino: null }).catch(() => {});
      console.error(`[backup] (${origem}) falhou: ${error.message}`);
      throw badRequest(`O backup não foi feito: ${error.message}`);
    }
  })();
  try {
    return await emAndamento;
  } finally {
    emAndamento = null;
  }
}

/** Confere a agenda a cada minuto (e logo ao iniciar, para recuperar um horário perdido). */
export function agendarBackup() {
  const verificar = () =>
    obterConfig()
      .then((c) => !emAndamento && deveExecutar(c) && executarBackup({ origem: "automático" }))
      .catch((error) => error.status !== 400 && console.error("[backup] falha ao verificar a agenda:", error.message));
  setTimeout(verificar, 15_000);
  return setInterval(verificar, UM_MINUTO);
}
