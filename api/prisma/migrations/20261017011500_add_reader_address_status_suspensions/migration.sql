-- Add structured address and borrowing status to existing readers.
ALTER TABLE `Leitor`
    ADD COLUMN `cep` VARCHAR(8) NULL,
    ADD COLUMN `logradouro` VARCHAR(150) NULL,
    ADD COLUMN `numero` VARCHAR(20) NULL,
    ADD COLUMN `complemento` VARCHAR(100) NULL,
    ADD COLUMN `bairro` VARCHAR(100) NULL,
    ADD COLUMN `cidade` VARCHAR(100) NULL,
    ADD COLUMN `estado` VARCHAR(2) NULL,
    ADD COLUMN `podeEmprestar` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `suspensoAte` DATETIME(3) NULL,
    ADD COLUMN `motivoSuspensao` VARCHAR(255) NULL;

CREATE TABLE `SuspensaoLeitor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_leitor` INTEGER NOT NULL,
    `id_bibliotecario` INTEGER NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `dataInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dataFim` DATETIME(3) NULL,
    `dataReativacao` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SuspensaoLeitor_id_leitor_dataInicio_idx`(`id_leitor`, `dataInicio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `SuspensaoLeitor`
    ADD CONSTRAINT `SuspensaoLeitor_id_leitor_fkey`
        FOREIGN KEY (`id_leitor`) REFERENCES `Leitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `SuspensaoLeitor_id_bibliotecario_fkey`
        FOREIGN KEY (`id_bibliotecario`) REFERENCES `Bibliotecario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
