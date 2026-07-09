-- CreateEnum
CREATE TYPE "Category" AS ENUM ('FOOD', 'TRANSPORT', 'HOUSING', 'LEISURE', 'SHOPPING', 'HEALTH');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('terms_of_use', 'privacy_policy');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD', 'EUR');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "tx_name" TEXT NOT NULL,
    "tx_email" TEXT NOT NULL,
    "tx_passwordHash" TEXT NOT NULL,
    "num_monthlyBudget" INTEGER NOT NULL DEFAULT 0,
    "enum_currency" "Currency" NOT NULL DEFAULT 'BRL',
    "bool_notifications" BOOLEAN NOT NULL DEFAULT true,
    "dt_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dt_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "expense_id" TEXT NOT NULL,
    "num_amount" INTEGER NOT NULL,
    "enum_category" "Category" NOT NULL,
    "tx_description" TEXT,
    "dt_date" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "dt_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dt_updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "legal_id" TEXT NOT NULL,
    "enum_type" "LegalDocumentType" NOT NULL,
    "tx_version" TEXT NOT NULL,
    "tx_content" TEXT,
    "tx_url" TEXT,
    "dt_publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bool_isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("legal_id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "userContesent_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "bool_accepted" BOOLEAN NOT NULL DEFAULT true,
    "dt_acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tx_ipAddress" TEXT,
    "tx_userAgent" TEXT,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("userContesent_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_tx_email_key" ON "users"("tx_email");

-- CreateIndex
CREATE INDEX "expenses_userId_dt_createdAt_idx" ON "expenses"("userId", "dt_createdAt");

-- CreateIndex
CREATE INDEX "legal_documents_enum_type_bool_isActive_idx" ON "legal_documents"("enum_type", "bool_isActive");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_enum_type_tx_version_key" ON "legal_documents"("enum_type", "tx_version");

-- CreateIndex
CREATE INDEX "user_consents_userId_documentId_idx" ON "user_consents"("userId", "documentId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "legal_documents"("legal_id") ON DELETE RESTRICT ON UPDATE CASCADE;
