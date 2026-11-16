-- Versão do token: trocar a senha invalida as sessões abertas
ALTER TABLE `Usuario` ADD COLUMN `versaoToken` INTEGER NOT NULL DEFAULT 0;

-- Pedidos de redefinição de senha ("esqueci minha senha")
CREATE TABLE `RedefinicaoSenha` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `usadoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `RedefinicaoSenha_tokenHash_key`(`tokenHash`),
    INDEX `RedefinicaoSenha_id_usuario_idx`(`id_usuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RedefinicaoSenha` ADD CONSTRAINT `RedefinicaoSenha_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
