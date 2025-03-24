-- CreateTable
CREATE TABLE "JobPortal" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "applicationDeadline" TIMESTAMP(3) NOT NULL,
    "numberOfApplicants" INTEGER NOT NULL,
    "jobStatus" TEXT NOT NULL,
    "postingPlatform" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "JobPortal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppStatus" (
    "id" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "datePosted" TIMESTAMP(3) NOT NULL,
    "engagement" JSONB NOT NULL,
    "numberOfApplicants" INTEGER NOT NULL,
    "recruiterContact" TEXT NOT NULL,
    "applicationLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WhatsAppStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referredCandidate" TEXT NOT NULL,
    "referringPerson" TEXT NOT NULL,
    "jobTitleApplied" TEXT NOT NULL,
    "referringContact" TEXT NOT NULL,
    "candidateContact" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "recruitmentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobPortal_jobId_idx" ON "JobPortal"("jobId");

-- CreateIndex
CREATE INDEX "JobPortal_jobTitle_idx" ON "JobPortal"("jobTitle");

-- CreateIndex
CREATE INDEX "WhatsAppStatus_jobTitle_idx" ON "WhatsAppStatus"("jobTitle");

-- CreateIndex
CREATE INDEX "WhatsAppStatus_companyName_idx" ON "WhatsAppStatus"("companyName");

-- CreateIndex
CREATE INDEX "Referral_referredCandidate_idx" ON "Referral"("referredCandidate");

-- CreateIndex
CREATE INDEX "Referral_referringPerson_idx" ON "Referral"("referringPerson");
