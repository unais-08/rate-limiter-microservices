-- CreateTable
CREATE TABLE "request_logs" (
    "id" SERIAL NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "rate_limit_hit" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_key_metrics" (
    "id" SERIAL NOT NULL,
    "api_key" VARCHAR(255) NOT NULL,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "total_rate_limited" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_request_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_key_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endpoint_metrics" (
    "id" SERIAL NOT NULL,
    "endpoint" VARCHAR(500) NOT NULL,
    "method" VARCHAR(10) NOT NULL,
    "total_requests" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_request_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoint_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "request_logs_api_key_idx" ON "request_logs"("api_key");

-- CreateIndex
CREATE INDEX "request_logs_endpoint_idx" ON "request_logs"("endpoint");

-- CreateIndex
CREATE INDEX "request_logs_timestamp_idx" ON "request_logs"("timestamp");

-- CreateIndex
CREATE INDEX "request_logs_rate_limit_hit_idx" ON "request_logs"("rate_limit_hit");

-- CreateIndex
CREATE UNIQUE INDEX "api_key_metrics_api_key_key" ON "api_key_metrics"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "endpoint_metrics_endpoint_method_key" ON "endpoint_metrics"("endpoint", "method");
