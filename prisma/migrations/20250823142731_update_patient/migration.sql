/*
  Warnings:

  - You are about to drop the column `email` on the `patient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `Patient_email_idx` ON `patient`;

-- DropIndex
DROP INDEX `Patient_email_key` ON `patient`;

-- AlterTable
ALTER TABLE `patient` DROP COLUMN `email`;

-- CreateIndex
CREATE UNIQUE INDEX `Patient_name_key` ON `Patient`(`name`);
