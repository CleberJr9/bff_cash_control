-- CreateEnum
CREATE TYPE "Category" AS ENUM ('alimentacao', 'transporte', 'moradia', 'lazer', 'compras', 'saude');

-- CreateEnum
CREATE TYPE "LegalDocumentType" AS ENUM ('terms_of_use', 'privacy_policy');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "monthlyBudget" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "notifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "category" "Category" NOT NULL,
    "description" TEXT,
    "date" DATE NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_consents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT true,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "expenses_userId_date_idx" ON "expenses"("userId", "date");

-- CreateIndex
CREATE INDEX "legal_documents_type_isActive_idx" ON "legal_documents"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_type_version_key" ON "legal_documents"("type", "version");

-- CreateIndex
CREATE INDEX "user_consents_userId_documentId_idx" ON "user_consents"("userId", "documentId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "legal_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
