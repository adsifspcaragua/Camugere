-- Backup automático configurado pela tela de Configurações (linha única)
CREATE TABLE `ConfiguracaoBackup` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `automatico` BOOLEAN NOT NULL DEFAULT false,
    `diasSemana` VARCHAR(20) NOT NULL DEFAULT '5',
    `horario` VARCHAR(5) NOT NULL DEFAULT '17:00',
    `agendaDesde` DATETIME(3) NULL,
    `pastaCopia` VARCHAR(500) NULL,
    `manter` INTEGER NOT NULL DEFAULT 10,
    `ultimoEm` DATETIME(3) NULL,
    `ultimoOk` BOOLEAN NULL,
    `ultimaMensagem` VARCHAR(1000) NULL,
    `ultimoDestino` VARCHAR(500) NULL,
    `ultimoSucessoEm` DATETIME(3) NULL,
    `atualizadoEm` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
