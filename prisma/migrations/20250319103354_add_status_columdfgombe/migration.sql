-- CreateTable
CREATE TABLE "GombeCandidate" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "jobTitleApplied" TEXT NOT NULL,
    "applicationDate" TIMESTAMP(3) NOT NULL,
    "recruitmentStatus" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "resumeUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GombeCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GombeClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "emailAddress" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "clientStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GombeClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GombeOfficeAsset" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "deviceType" TEXT NOT NULL,
    "brandModel" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "GombeOfficeAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GombeCandidate_candidateId_idx" ON "GombeCandidate"("candidateId");

-- CreateIndex
CREATE INDEX "GombeCandidate_fullName_idx" ON "GombeCandidate"("fullName");

-- CreateIndex
CREATE INDEX "GombeClient_clientId_idx" ON "GombeClient"("clientId");

-- CreateIndex
CREATE INDEX "GombeClient_clientName_idx" ON "GombeClient"("clientName");

-- CreateIndex
CREATE INDEX "GombeOfficeAsset_assetId_idx" ON "GombeOfficeAsset"("assetId");

-- CreateIndex
CREATE INDEX "GombeOfficeAsset_deviceType_idx" ON "GombeOfficeAsset"("deviceType");
