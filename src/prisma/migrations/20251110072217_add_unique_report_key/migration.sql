/*
  Warnings:

  - A unique constraint covering the columns `[reportType,reportDate]` on the table `Report` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Report_reportType_reportDate_key" ON "Report"("reportType", "reportDate");
