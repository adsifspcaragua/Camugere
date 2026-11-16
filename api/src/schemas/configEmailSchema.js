import z from "zod";

const texto = (max, msg) => z.string().trim().min(1, msg).max(max);

export const configEmailSchema = z.object({
  host: texto(255, "informe o servidor de e-mail"),
  porta: z.coerce.number().int("porta inválida").min(1, "porta inválida").max(65535, "porta inválida"),
  seguro: z.boolean().optional(),
  usuario: texto(255, "informe o e-mail ou usuário da conta"),
  // Em branco ao editar = manter a senha já salva.
  senha: z.string().max(200).optional().or(z.literal("")),
  nomeRemetente: z.string().trim().max(100).optional().or(z.literal("")),
});
