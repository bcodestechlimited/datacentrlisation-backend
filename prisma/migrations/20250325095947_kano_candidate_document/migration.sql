-- CreateTable
CREATE TABLE "KanoCandidateDocument" (
    "id" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "applicationID" TEXT NOT NULL,
    "jobTitleAppliedFor" TEXT NOT NULL,
    "resumeCV" TEXT NOT NULL,
    "educationalCertificates" TEXT[],
    "referenceLetters" TEXT[],
    "backgroundCheckReports" TEXT[],
    "recruitmentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KanoCandidateDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KanoCandidateDocument_applicationID_idx" ON "KanoCandidateDocument"("applicationID");

-- CreateIndex
CREATE INDEX "KanoCandidateDocument_candidateName_idx" ON "KanoCandidateDocument"("candidateName");

-- CreateIndex
CREATE INDEX "KanoCandidateDocument_recruitmentStatus_idx" ON "KanoCandidateDocument"("recruitmentStatus");
