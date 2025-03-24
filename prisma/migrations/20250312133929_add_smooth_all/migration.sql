-- CreateTable
CREATE TABLE "ImpressAnalysis" (
    "id" TEXT NOT NULL,
    "regionName" TEXT NOT NULL,
    "officeName" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "budgetAllocated" DOUBLE PRECISION NOT NULL,
    "amountSpent" DOUBLE PRECISION NOT NULL,
    "variance" DOUBLE PRECISION NOT NULL,
    "expenseCategories" JSONB NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImpressAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICUCostReduction" (
    "id" TEXT NOT NULL,
    "businessUnit" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "costSavingAreas" JSONB NOT NULL,
    "reductionStrategies" JSONB NOT NULL,
    "projectedSavings" DOUBLE PRECISION NOT NULL,
    "actualSavings" DOUBLE PRECISION NOT NULL,
    "implementationStatus" TEXT NOT NULL,
    "challenges" JSONB,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICUCostReduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreEmploymentMedical" (
    "id" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "jobPosition" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "medicalFacility" TEXT NOT NULL,
    "testsConducted" JSONB NOT NULL,
    "medicalStatus" TEXT NOT NULL,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreEmploymentMedical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationReport" (
    "id" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "jobPosition" TEXT NOT NULL,
    "verificationType" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL,
    "verificationDate" TIMESTAMP(3) NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "reportSummary" TEXT NOT NULL,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImpressAnalysis_regionName_idx" ON "ImpressAnalysis"("regionName");

-- CreateIndex
CREATE INDEX "ICUCostReduction_businessUnit_idx" ON "ICUCostReduction"("businessUnit");

-- CreateIndex
CREATE INDEX "PreEmploymentMedical_candidateName_idx" ON "PreEmploymentMedical"("candidateName");

-- CreateIndex
CREATE INDEX "PreEmploymentMedical_department_idx" ON "PreEmploymentMedical"("department");

-- CreateIndex
CREATE INDEX "VerificationReport_candidateName_idx" ON "VerificationReport"("candidateName");

-- CreateIndex
CREATE INDEX "VerificationReport_verificationType_idx" ON "VerificationReport"("verificationType");
