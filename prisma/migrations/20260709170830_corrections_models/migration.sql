/*
  Warnings:

  - The values [alimentacao,transporte,moradia,lazer,compras,saude] on the enum `Category` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `expenses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `amount` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `expenses` table. All the data in the column will be lost.
  - The primary key for the `legal_documents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `content` on the `legal_documents` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `legal_documents` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `legal_documents` table. All the data in the column will be lost.
  - You are about to drop the column `publishedAt` on the `legal_documents` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `legal_documents` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `legal_documents` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `legal_documents` table. All the data in the column will be lost.
  - The primary key for the `user_consents` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accepted` on the `user_consents` table. All the data in the column will be lost.
  - You are about to drop the column `acceptedAt` on the `user_consents` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `user_consents` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `user_consents` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `user_consents` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyBudget` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `notifications` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[enum_type,tx_version]` on the table `legal_documents` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tx_email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dt_date` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dt_updatedAt` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enum_category` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - The required column `expense_id` was added to the `expenses` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `num_amount` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `enum_type` to the `legal_documents` table without a default value. This is not possible if the table is not empty.
  - The required column `legal_id` was added to the `legal_documents` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `tx_version` to the `legal_documents` table without a default value. This is not possible if the table is not empty.
  - The required column `userContesent_id` was added to the `user_consents` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `dt_updatedAt` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tx_email` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tx_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tx_passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.
  - The required column `user_id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('BRL', 'USD', 'EUR');

-- AlterEnum
BEGIN;
CREATE TYPE "Category_new" AS ENUM ('FOOD', 'TRANSPORT', 'HOUSING', 'LEISURE', 'SHOPPING', 'HEALTH');
ALTER TABLE "expenses" ALTER COLUMN "enum_category" TYPE "Category_new" USING ("enum_category"::text::"Category_new");
ALTER TYPE "Category" RENAME TO "Category_old";
ALTER TYPE "Category_new" RENAME TO "Category";
DROP TYPE "public"."Category_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_consents" DROP CONSTRAINT "user_consents_documentId_fkey";

-- DropForeignKey
ALTER TABLE "user_consents" DROP CONSTRAINT "user_consents_userId_fkey";

-- DropIndex
DROP INDEX "expenses_userId_date_idx";

-- DropIndex
DROP INDEX "legal_documents_type_isActive_idx";

-- DropIndex
DROP INDEX "legal_documents_type_version_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_pkey",
DROP COLUMN "amount",
DROP COLUMN "category",
DROP COLUMN "createdAt",
DROP COLUMN "date",
DROP COLUMN "description",
DROP COLUMN "id",
DROP COLUMN "updatedAt",
ADD COLUMN     "dt_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dt_date" DATE NOT NULL,
ADD COLUMN     "dt_updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "enum_category" "Category" NOT NULL,
ADD COLUMN     "expense_id" TEXT NOT NULL,
ADD COLUMN     "num_amount" INTEGER NOT NULL,
ADD COLUMN     "tx_description" TEXT,
ADD CONSTRAINT "expenses_pkey" PRIMARY KEY ("expense_id");

-- AlterTable
ALTER TABLE "legal_documents" DROP CONSTRAINT "legal_documents_pkey",
DROP COLUMN "content",
DROP COLUMN "id",
DROP COLUMN "isActive",
DROP COLUMN "publishedAt",
DROP COLUMN "type",
DROP COLUMN "url",
DROP COLUMN "version",
ADD COLUMN     "bool_isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dt_publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "enum_type" "LegalDocumentType" NOT NULL,
ADD COLUMN     "legal_id" TEXT NOT NULL,
ADD COLUMN     "tx_content" TEXT,
ADD COLUMN     "tx_url" TEXT,
ADD COLUMN     "tx_version" TEXT NOT NULL,
ADD CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("legal_id");

-- AlterTable
ALTER TABLE "user_consents" DROP CONSTRAINT "user_consents_pkey",
DROP COLUMN "accepted",
DROP COLUMN "acceptedAt",
DROP COLUMN "id",
DROP COLUMN "ipAddress",
DROP COLUMN "userAgent",
ADD COLUMN     "bool_accepted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dt_acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tx_ipAddress" TEXT,
ADD COLUMN     "tx_userAgent" TEXT,
ADD COLUMN     "userContesent_id" TEXT NOT NULL,
ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("userContesent_id");

-- AlterTable
ALTER TABLE "users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "currency",
DROP COLUMN "email",
DROP COLUMN "id",
DROP COLUMN "monthlyBudget",
DROP COLUMN "name",
DROP COLUMN "notifications",
DROP COLUMN "passwordHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "bool_notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "dt_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dt_updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "enum_currency" "Currency" NOT NULL DEFAULT 'BRL',
ADD COLUMN     "num_monthlyBudget" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tx_email" TEXT NOT NULL,
ADD COLUMN     "tx_name" TEXT NOT NULL,
ADD COLUMN     "tx_passwordHash" TEXT NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("user_id");

-- CreateIndex
CREATE INDEX "expenses_userId_dt_createdAt_idx" ON "expenses"("userId", "dt_createdAt");

-- CreateIndex
CREATE INDEX "legal_documents_enum_type_bool_isActive_idx" ON "legal_documents"("enum_type", "bool_isActive");

-- CreateIndex
CREATE UNIQUE INDEX "legal_documents_enum_type_tx_version_key" ON "legal_documents"("enum_type", "tx_version");

-- CreateIndex
CREATE UNIQUE INDEX "users_tx_email_key" ON "users"("tx_email");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "legal_documents"("legal_id") ON DELETE RESTRICT ON UPDATE CASCADE;
