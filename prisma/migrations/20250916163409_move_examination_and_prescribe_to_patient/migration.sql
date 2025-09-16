/*
  Warnings:

  - You are about to drop the column `attachments` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `examination` on the `appointment` table. All the data in the column will be lost.
  - You are about to drop the column `prescription` on the `appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `attachments`,
    DROP COLUMN `examination`,
    DROP COLUMN `prescription`;

-- AlterTable
ALTER TABLE `patient` ADD COLUMN `attachments` JSON NULL,
    ADD COLUMN `examination` JSON NULL,
    ADD COLUMN `prescription` JSON NULL;
