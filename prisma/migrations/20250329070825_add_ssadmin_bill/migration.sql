/*
  Warnings:

  - Added the required column `userId` to the `ssadminBill` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ssadminBill" ADD COLUMN     "userId" TEXT NOT NULL;
