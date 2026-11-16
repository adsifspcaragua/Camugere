import z from "zod";

export const configBackupSchema = z.object({
  automatico: z.boolean(),
  dias: z.array(z.number().int().min(0).max(6)).max(7),
  horario: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "horário inválido (use HH:MM)"),
  pastaCopia: z.string().trim().max(500, "caminho muito longo").optional().nullable().or(z.literal("")),
  manter: z.coerce.number().int("informe um número inteiro").min(1, "guarde pelo menos 1 backup").max(100, "no máximo 100 backups"),
}).refine((v) => !v.automatico || v.dias.length > 0, { message: "escolha pelo menos um dia da semana", path: ["dias"] });
