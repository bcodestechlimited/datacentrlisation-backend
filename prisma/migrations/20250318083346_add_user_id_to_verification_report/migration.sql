/*
  Warnings:

  - Added the required column `userId` to the `ICUCostReduction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `ImpressAnalysis` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `PreEmploymentMedical` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `VerificationReport` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ICUCostReduction" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ImpressAnalysis" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PreEmploymentMedical" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "VerificationReport" ADD COLUMN     "userId" TEXT NOT NULL;
