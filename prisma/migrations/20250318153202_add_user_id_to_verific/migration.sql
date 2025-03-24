-- CreateTable
CREATE TABLE "ATS" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "positionApplied" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "recruitmentStatus" TEXT NOT NULL,
    "guarantors" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ATS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SLA" (
    "id" TEXT NOT NULL,
    "slaId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "agreementType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "keyTerms" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "supportingDocs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "SLA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientInformation" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "contractType" TEXT,
    "documents" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ClientInformation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ATS_candidateId_idx" ON "ATS"("candidateId");

-- CreateIndex
CREATE INDEX "ATS_fullName_idx" ON "ATS"("fullName");

-- CreateIndex
CREATE INDEX "SLA_slaId_idx" ON "SLA"("slaId");

-- CreateIndex
CREATE INDEX "SLA_clientName_idx" ON "SLA"("clientName");

-- CreateIndex
CREATE INDEX "ClientInformation_clientId_idx" ON "ClientInformation"("clientId");

-- CreateIndex
CREATE INDEX "ClientInformation_clientName_idx" ON "ClientInformation"("clientName");
