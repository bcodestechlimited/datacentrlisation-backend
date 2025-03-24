-- CreateTable
CREATE TABLE "weekly_incomes" (
    "id" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "income" DOUBLE PRECISION NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "weekly_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edit_logs" (
    "id" TEXT NOT NULL,
    "weeklyIncomeId" TEXT NOT NULL,
    "editedById" TEXT NOT NULL,
    "oldIncome" DOUBLE PRECISION NOT NULL,
    "newIncome" DOUBLE PRECISION NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "edit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "edit_logs" ADD CONSTRAINT "edit_logs_weeklyIncomeId_fkey" FOREIGN KEY ("weeklyIncomeId") REFERENCES "weekly_incomes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
