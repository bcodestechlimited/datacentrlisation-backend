-- CreateTable
CREATE TABLE "Shared_Services_Admin_Vendor" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "serviceProvided" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "dept" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Shared_Services_Admin_Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shared_Services_Admin_Vendor_vendorId_key" ON "Shared_Services_Admin_Vendor"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Shared_Services_Admin_Vendor_email_key" ON "Shared_Services_Admin_Vendor"("email");

-- CreateIndex
CREATE INDEX "Shared_Services_Admin_Vendor_vendorId_idx" ON "Shared_Services_Admin_Vendor"("vendorId");

-- CreateIndex
CREATE INDEX "Shared_Services_Admin_Vendor_vendorName_idx" ON "Shared_Services_Admin_Vendor"("vendorName");

-- CreateIndex
CREATE INDEX "Shared_Services_Admin_Vendor_email_idx" ON "Shared_Services_Admin_Vendor"("email");
