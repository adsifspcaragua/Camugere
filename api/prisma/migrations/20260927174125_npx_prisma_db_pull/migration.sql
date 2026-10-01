-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(20) NOT NULL,
    `email` VARCHAR(40) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Leitor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `cpf` VARCHAR(14) NOT NULL,
    `telefone` VARCHAR(11) NULL,

    UNIQUE INDEX `Leitor_cpf_key`(`cpf`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bibliotecario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Obra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(200) NOT NULL,
    `subtitulo` VARCHAR(200) NULL,
    `editora` VARCHAR(100) NULL,
    `edicao` VARCHAR(20) NULL,
    `numeroPaginas` INTEGER NOT NULL,
    `capa` VARCHAR(191) NULL,
    `ativa` BOOLEAN NOT NULL DEFAULT true,
    `notaMedia` DOUBLE NULL,
    `id_cdd` VARCHAR(6) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ObraAutor` (
    `id_obra` INTEGER NOT NULL,
    `id_autor` INTEGER NOT NULL,

    PRIMARY KEY (`id_obra`, `id_autor`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Autor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `sobrenome` VARCHAR(40) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cdd` (
    `id` VARCHAR(6) NOT NULL,
    `descricao` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Clube` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(40) NOT NULL,
    `descricao` VARCHAR(191) NULL,
    `dataCriacao` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeitorClube` (
    `id_leitor` INTEGER NOT NULL,
    `id_clube` INTEGER NOT NULL,

    PRIMARY KEY (`id_leitor`, `id_clube`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Exemplar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_obra` INTEGER NOT NULL,
    `numeroInventario` VARCHAR(6) NOT NULL,
    `disponivel` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Emprestimo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataInicio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `diasLocacao` INTEGER NOT NULL,
    `statusDevolucao` BOOLEAN NOT NULL DEFAULT false,
    `dataDevolucao` DATETIME(3) NULL,
    `id_leitor` INTEGER NOT NULL,
    `id_exemplar` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataReserva` DATETIME(3) NOT NULL,
    `id_obra` INTEGER NOT NULL,
    `id_leitor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comentario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataPublicacao` DATETIME(3) NOT NULL,
    `texto` VARCHAR(1000) NULL,
    `nota` INTEGER NULL,
    `curtidas` INTEGER NOT NULL DEFAULT 0,
    `moderado` BOOLEAN NOT NULL DEFAULT false,
    `id_obra` INTEGER NOT NULL,
    `id_leitor` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Leitor` ADD CONSTRAINT `Leitor_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bibliotecario` ADD CONSTRAINT `Bibliotecario_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Obra` ADD CONSTRAINT `Obra_id_cdd_fkey` FOREIGN KEY (`id_cdd`) REFERENCES `Cdd`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObraAutor` ADD CONSTRAINT `ObraAutor_id_obra_fkey` FOREIGN KEY (`id_obra`) REFERENCES `Obra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ObraAutor` ADD CONSTRAINT `ObraAutor_id_autor_fkey` FOREIGN KEY (`id_autor`) REFERENCES `Autor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeitorClube` ADD CONSTRAINT `LeitorClube_id_leitor_fkey` FOREIGN KEY (`id_leitor`) REFERENCES `Leitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeitorClube` ADD CONSTRAINT `LeitorClube_id_clube_fkey` FOREIGN KEY (`id_clube`) REFERENCES `Clube`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Exemplar` ADD CONSTRAINT `Exemplar_id_obra_fkey` FOREIGN KEY (`id_obra`) REFERENCES `Obra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Emprestimo` ADD CONSTRAINT `Emprestimo_id_leitor_fkey` FOREIGN KEY (`id_leitor`) REFERENCES `Leitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Emprestimo` ADD CONSTRAINT `Emprestimo_id_exemplar_fkey` FOREIGN KEY (`id_exemplar`) REFERENCES `Exemplar`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_id_obra_fkey` FOREIGN KEY (`id_obra`) REFERENCES `Obra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_id_leitor_fkey` FOREIGN KEY (`id_leitor`) REFERENCES `Leitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comentario` ADD CONSTRAINT `Comentario_id_obra_fkey` FOREIGN KEY (`id_obra`) REFERENCES `Obra`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comentario` ADD CONSTRAINT `Comentario_id_leitor_fkey` FOREIGN KEY (`id_leitor`) REFERENCES `Leitor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
