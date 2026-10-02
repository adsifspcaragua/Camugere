/*
  Warnings:

  - The primary key for the `cdd` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `capa` on the `obra` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.
  - A unique constraint covering the columns `[nome,sobrenome]` on the table `Autor` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[numeroInventario]` on the table `Exemplar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[isbn]` on the table `Obra` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `obra` DROP FOREIGN KEY `Obra_id_cdd_fkey`;

-- DropIndex
DROP INDEX `Obra_id_cdd_fkey` ON `obra`;

-- AlterTable
ALTER TABLE `autor` MODIFY `nome` VARCHAR(80) NOT NULL,
    MODIFY `sobrenome` VARCHAR(80) NOT NULL;

-- AlterTable
ALTER TABLE `cdd` DROP PRIMARY KEY,
    MODIFY `id` VARCHAR(15) NOT NULL,
    MODIFY `descricao` VARCHAR(150) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `exemplar` MODIFY `numeroInventario` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `obra` ADD COLUMN `anoPublicacao` INTEGER NULL,
    ADD COLUMN `capaUrl` VARCHAR(500) NULL,
    ADD COLUMN `isbn` VARCHAR(20) NULL,
    ADD COLUMN `localPublicacao` VARCHAR(100) NULL,
    ADD COLUMN `resumo` TEXT NULL,
    MODIFY `numeroPaginas` INTEGER NOT NULL DEFAULT 0,
    MODIFY `capa` VARCHAR(20) NULL,
    MODIFY `id_cdd` VARCHAR(6) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Autor_nome_sobrenome_key` ON `Autor`(`nome`, `sobrenome`);

-- CreateIndex
CREATE UNIQUE INDEX `Exemplar_numeroInventario_key` ON `Exemplar`(`numeroInventario`);

-- CreateIndex
CREATE INDEX `Exemplar_id_obra_disponivel_idx` ON `Exemplar`(`id_obra`, `disponivel`);

-- CreateIndex
CREATE UNIQUE INDEX `Obra_isbn_key` ON `Obra`(`isbn`);

-- CreateIndex
CREATE INDEX `Obra_titulo_idx` ON `Obra`(`titulo`);

-- CreateIndex
CREATE INDEX `Obra_isbn_idx` ON `Obra`(`isbn`);

-- AddForeignKey
ALTER TABLE `Obra` ADD CONSTRAINT `Obra_id_cdd_fkey` FOREIGN KEY (`id_cdd`) REFERENCES `Cdd`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
