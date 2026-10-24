-- Endereço do leitor
ALTER TABLE `Leitor`
    ADD COLUMN `cep` VARCHAR(8) NULL,
    ADD COLUMN `logradouro` VARCHAR(150) NULL,
    ADD COLUMN `numero` VARCHAR(20) NULL,
    ADD COLUMN `complemento` VARCHAR(80) NULL,
    ADD COLUMN `bairro` VARCHAR(80) NULL,
    ADD COLUMN `cidade` VARCHAR(80) NULL,
    ADD COLUMN `uf` CHAR(2) NULL;

-- Controle de lembrete de devolução (evita reenvio)
ALTER TABLE `Emprestimo` ADD COLUMN `lembreteEnviadoEm` DATETIME(3) NULL;

-- Suspensões de leitores
CREATE TABLE `Suspensao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_leitor` INTEGER NOT NULL,
    `motivo` VARCHAR(500) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataFim` DATETIME(3) NULL,
    `dataEncerramento` DATETIME(3) NULL,
    `id_bibliotecario` INTEGER NULL,
    INDEX `Suspensao_id_leitor_idx`(`id_leitor`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Suspensao` ADD CONSTRAINT `Suspensao_id_leitor_fkey` FOREIGN KEY (`id_leitor`) REFERENCES `Leitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Suspensao` ADD CONSTRAINT `Suspensao_id_bibliotecario_fkey` FOREIGN KEY (`id_bibliotecario`) REFERENCES `Bibliotecario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
