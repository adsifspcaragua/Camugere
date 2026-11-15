-- Servidor de e-mail configurado pela tela de Configurações (linha única)
CREATE TABLE `ConfiguracaoEmail` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `host` VARCHAR(255) NOT NULL,
    `porta` INTEGER NOT NULL,
    `seguro` BOOLEAN NOT NULL DEFAULT false,
    `usuario` VARCHAR(255) NOT NULL,
    `senhaCifrada` TEXT NOT NULL,
    `nomeRemetente` VARCHAR(100) NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
