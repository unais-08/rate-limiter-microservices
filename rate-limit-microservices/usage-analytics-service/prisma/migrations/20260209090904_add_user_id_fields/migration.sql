/*
  Warnings:

  - A unique constraint covering the columns `[user_id,api_key]` on the table `api_key_metrics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,endpoint,method]` on the table `endpoint_metrics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `api_key_metrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `endpoint_metrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `request_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "api_key_metrics_api_key_key";

-- DropIndex
DROP INDEX "endpoint_metrics_endpoint_method_key";

-- AlterTable
ALTER TABLE "api_key_metrics" ADD COLUMN     "user_id" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "endpoint_metrics" ADD COLUMN     "user_id" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "request_logs" ADD COLUMN     "user_id" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX "api_key_metrics_user_id_idx" ON "api_key_metrics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_metrics_user_id_api_key_key" ON "api_key_metrics"("user_id", "api_key");

-- CreateIndex
CREATE INDEX "endpoint_metrics_user_id_idx" ON "endpoint_metrics"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "endpoint_metrics_user_id_endpoint_method_key" ON "endpoint_metrics"("user_id", "endpoint", "method");

-- CreateIndex
CREATE INDEX "request_logs_user_id_idx" ON "request_logs"("user_id");

-- CreateIndex
CREATE INDEX "request_logs_user_id_api_key_idx" ON "request_logs"("user_id", "api_key");
