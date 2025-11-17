/*
  Warnings:

  - Made the column `cancelUrl` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `goods` on table `Order` required. This step will fail if there are existing NULL values in that column.
  - Made the column `returnUrl` on table `Order` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "cancelUrl" SET NOT NULL,
ALTER COLUMN "goods" SET NOT NULL,
ALTER COLUMN "returnUrl" SET NOT NULL;
