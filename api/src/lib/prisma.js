import { PrismaClient } from "@prisma/client";

// Uma única instância compartilhada evita abrir um pool de conexões por arquivo.
export const prisma = new PrismaClient();
