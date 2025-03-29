-- CreateTable
CREATE TABLE "ssadminHSEReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "incidentType" TEXT NOT NULL,
    "dateOfIncident" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "personsInvolved" TEXT NOT NULL,
    "correctiveAction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ssadminHSEReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ssadminAdminMonthlyReport" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "monthYear" TEXT NOT NULL,
    "keyActivities" TEXT NOT NULL,
    "performanceSummary" TEXT NOT NULL,
    "budgetExpenses" TEXT NOT NULL,
    "challenges" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ssadminAdminMonthlyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ssadminHSEReport_reportId_key" ON "ssadminHSEReport"("reportId");

-- CreateIndex
CREATE INDEX "ssadminHSEReport_reportId_idx" ON "ssadminHSEReport"("reportId");

-- CreateIndex
CREATE INDEX "ssadminHSEReport_incidentType_idx" ON "ssadminHSEReport"("incidentType");

-- CreateIndex
CREATE UNIQUE INDEX "ssadminAdminMonthlyReport_reportId_key" ON "ssadminAdminMonthlyReport"("reportId");

-- CreateIndex
CREATE INDEX "ssadminAdminMonthlyReport_reportId_idx" ON "ssadminAdminMonthlyReport"("reportId");

-- CreateIndex
CREATE INDEX "ssadminAdminMonthlyReport_monthYear_idx" ON "ssadminAdminMonthlyReport"("monthYear");
