-- CreateTable
CREATE TABLE "KanoApplicant" (
    "id" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "applicationID" TEXT NOT NULL,
    "jobTitleAppliedFor" TEXT NOT NULL,
    "dateOfApplication" TIMESTAMP(3) NOT NULL,
    "recruitmentStatus" TEXT NOT NULL,
    "assignedRecruiter" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KanoApplicant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KanoApplicant_applicationID_key" ON "KanoApplicant"("applicationID");

-- CreateIndex
CREATE INDEX "KanoApplicant_applicationID_idx" ON "KanoApplicant"("applicationID");

-- CreateIndex
CREATE INDEX "KanoApplicant_recruitmentStatus_idx" ON "KanoApplicant"("recruitmentStatus");

-- CreateIndex
CREATE INDEX "KanoApplicant_assignedRecruiter_idx" ON "KanoApplicant"("assignedRecruiter");
