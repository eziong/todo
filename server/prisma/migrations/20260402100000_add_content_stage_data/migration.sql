-- CreateTable
CREATE TABLE "content_stage_data" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "description" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_stage_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_stage_data_content_id_idx" ON "content_stage_data"("content_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_stage_data_content_id_stage_key" ON "content_stage_data"("content_id", "stage");

-- Migrate existing description data to content_stage_data (stage='idea')
INSERT INTO "content_stage_data" ("id", "content_id", "stage", "description", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'idea', "description", "created_at", "updated_at"
FROM "contents"
WHERE "description" IS NOT NULL AND "description" != '';

-- Drop description column from contents
ALTER TABLE "contents" DROP COLUMN "description";

-- AddForeignKey
ALTER TABLE "content_stage_data" ADD CONSTRAINT "content_stage_data_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
