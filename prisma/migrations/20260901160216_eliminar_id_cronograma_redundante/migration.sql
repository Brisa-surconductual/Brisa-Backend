/*
  Warnings:

  - You are about to drop the column `id_cronograma` on the `contenidos_cronograma` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_unidad_temporal,orden_contenido]` on the table `contenidos_cronograma` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "cronograma"."contenidos_cronograma" DROP COLUMN "id_cronograma";

-- CreateIndex
CREATE UNIQUE INDEX "uq_contenido_orden_en_unidad_temporal" ON "cronograma"."contenidos_cronograma"("id_unidad_temporal", "orden_contenido") WHERE (orden_contenido IS NOT NULL);
