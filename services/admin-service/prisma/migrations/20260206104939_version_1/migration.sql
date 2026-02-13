-- CreateTable
CREATE TABLE "api_keys" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(255),
    "tier" VARCHAR(50) NOT NULL DEFAULT 'free',
    "tokens_per_window" INTEGER NOT NULL DEFAULT 100,
    "refill_rate" INTEGER NOT NULL DEFAULT 10,
    "max_burst" INTEGER NOT NULL DEFAULT 100,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_used" TIMESTAMP(3),
    "description" TEXT,
    "allowed_ips" TEXT[],

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_key_idx" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "api_keys_enabled_idx" ON "api_keys"("enabled");

-- CreateIndex
CREATE INDEX "api_keys_user_id_idx" ON "api_keys"("user_id");

-- CreateIndex
CREATE INDEX "api_keys_tier_idx" ON "api_keys"("tier");

-- CreateIndex
CREATE INDEX "api_keys_created_at_idx" ON "api_keys"("created_at");
