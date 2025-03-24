-- CreateTable
CREATE TABLE "BusinessPerformanceReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "totalExpenses" DOUBLE PRECISION NOT NULL,
    "netProfitLoss" DOUBLE PRECISION NOT NULL,
    "keyPerformanceIndicators" JSONB NOT NULL,
    "topPerformingServices" JSONB NOT NULL,
    "clientAcquisitionCount" INTEGER NOT NULL,
    "operationalChallenges" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "BusinessPerformanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecruitmentReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "reportingPeriod" TEXT NOT NULL,
    "totalJobOpenings" INTEGER NOT NULL,
    "applicationsReceived" INTEGER NOT NULL,
    "candidatesInterviewed" INTEGER NOT NULL,
    "candidatesHired" INTEGER NOT NULL,
    "timeToFill" INTEGER NOT NULL,
    "candidateSourceBreakdown" JSONB NOT NULL,
    "recruitmentChallenges" TEXT NOT NULL,
    "generatedBy" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RecruitmentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BusinessPerformanceReport_reportId_idx" ON "BusinessPerformanceReport"("reportId");

-- CreateIndex
CREATE INDEX "BusinessPerformanceReport_reportingPeriod_idx" ON "BusinessPerformanceReport"("reportingPeriod");

-- CreateIndex
CREATE INDEX "RecruitmentReport_reportId_idx" ON "RecruitmentReport"("reportId");

-- CreateIndex
CREATE INDEX "RecruitmentReport_reportingPeriod_idx" ON "RecruitmentReport"("reportingPeriod");
