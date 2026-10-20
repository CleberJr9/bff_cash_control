-- AlterTable
ALTER TABLE "expenses" ADD COLUMN "tx_title" TEXT;

-- Backfill: despesas existentes usam a descrição (ou a categoria) como título
UPDATE "expenses" SET "tx_title" = COALESCE("tx_description", "enum_category"::TEXT) WHERE "tx_title" IS NULL;

ALTER TABLE "expenses" ALTER COLUMN "tx_title" SET NOT NULL;
