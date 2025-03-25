-- CreateTable
CREATE TABLE "KanoComplianceDocument" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "issuingBody" TEXT NOT NULL,
    "dateIssued" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "companyName" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "approvalStatus" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "KanoComplianceDocument_pkey" PRIMARY KEY ("id")
);
