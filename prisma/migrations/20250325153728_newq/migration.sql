-- CreateTable
CREATE TABLE "OnboardedStaff" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "resumptionForm" TEXT NOT NULL,
    "bankAccountDetails" JSONB NOT NULL,
    "bvn" TEXT NOT NULL,
    "pfaDetails" JSONB NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "officialPhone" TEXT NOT NULL,
    "emergencyContact" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OnboardedStaff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardedStaff_staffId_key" ON "OnboardedStaff"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardedStaff_officialEmail_key" ON "OnboardedStaff"("officialEmail");

-- CreateIndex
CREATE INDEX "OnboardedStaff_staffId_idx" ON "OnboardedStaff"("staffId");

-- CreateIndex
CREATE INDEX "OnboardedStaff_fullName_idx" ON "OnboardedStaff"("fullName");

-- CreateIndex
CREATE INDEX "OnboardedStaff_officialEmail_idx" ON "OnboardedStaff"("officialEmail");
