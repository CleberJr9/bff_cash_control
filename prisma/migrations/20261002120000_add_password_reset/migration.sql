-- CreateTable
CREATE TABLE "password_resets" (
    "passwordReset_id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tx_codeHash" TEXT NOT NULL,
    "num_attempts" INTEGER NOT NULL DEFAULT 0,
    "dt_expiresAt" TIMESTAMP(3) NOT NULL,
    "dt_usedAt" TIMESTAMP(3),
    "dt_createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("passwordReset_id")
);

-- CreateIndex
CREATE INDEX "password_resets_userId_idx" ON "password_resets"("userId");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

