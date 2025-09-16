/*
  Warnings:

  - You are about to drop the column `vitals` on the `appointment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `vitals`;

-- AlterTable
ALTER TABLE `patient` ADD COLUMN `vitals` JSON NULL;
