/*
  Warnings:

  - You are about to drop the column `visitStatus` on the `appointment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Appointment_visitStatus_idx` ON `appointment`;

-- AlterTable
ALTER TABLE `appointment` DROP COLUMN `visitStatus`;

-- AlterTable
ALTER TABLE `patient` ADD COLUMN `doctor_id` VARCHAR(191) NULL,
    ADD COLUMN `visitStatus` ENUM('REGISTERED', 'VITALS_TAKEN', 'ASSIGNED_TO_DOCTOR', 'EXAMINED', 'LAB_ORDERED', 'PAID_FOR_LAB', 'ASSIGNED_TO_LAB', 'LAB_COMPLETED', 'FINALIZED') NULL DEFAULT 'REGISTERED';

-- CreateIndex
CREATE INDEX `Patient_doctor_id_idx` ON `Patient`(`doctor_id`);

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
