/*
  Warnings:

  - You are about to drop the column `notifyUrl` on the `OnchainOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OnchainOrder" DROP COLUMN "notifyUrl",
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "subMerchantId" TEXT;
