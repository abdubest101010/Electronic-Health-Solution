/*
  Warnings:

  - You are about to drop the column `appointmentId` on the `laborder` table. All the data in the column will be lost.
  - Added the required column `patientId` to the `LabOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `laborder` DROP FOREIGN KEY `LabOrder_appointmentId_fkey`;

-- DropIndex
DROP INDEX `LabOrder_appointmentId_idx` ON `laborder`;

-- AlterTable
ALTER TABLE `laborder` DROP COLUMN `appointmentId`,
    ADD COLUMN `patientId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `LabOrder_patientId_idx` ON `LabOrder`(`patientId`);

-- AddForeignKey
ALTER TABLE `LabOrder` ADD CONSTRAINT `LabOrder_patientId_fkey` FOREIGN KEY (`patientId`) REFERENCES `Patient`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
