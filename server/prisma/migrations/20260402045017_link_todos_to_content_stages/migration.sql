/*
  Warnings:

  - You are about to drop the `content_checklists` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "content_checklists" DROP CONSTRAINT "content_checklists_content_id_fkey";

-- AlterTable
ALTER TABLE "todos" ADD COLUMN     "content_id" TEXT,
ADD COLUMN     "content_stage" TEXT;

-- DropTable
DROP TABLE "content_checklists";

-- CreateIndex
CREATE INDEX "todos_content_id_idx" ON "todos"("content_id");

-- AddForeignKey
ALTER TABLE "todos" ADD CONSTRAINT "todos_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
