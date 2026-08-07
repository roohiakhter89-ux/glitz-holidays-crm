-- SEO module: SeoSite + SeoAudit.

CREATE TABLE "SeoSite" (
  "id"         TEXT PRIMARY KEY,
  "name"       TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "crawlPaths" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "isActive"   BOOLEAN NOT NULL DEFAULT true,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "SeoSite_url_key" ON "SeoSite"("url");
CREATE INDEX "SeoSite_isActive_idx" ON "SeoSite"("isActive");

CREATE TABLE "SeoAudit" (
  "id"         TEXT PRIMARY KEY,
  "siteId"     TEXT NOT NULL,
  "runId"      TEXT NOT NULL,
  "url"        TEXT NOT NULL,
  "score"      INTEGER NOT NULL DEFAULT 0,
  "perfScore"  INTEGER,
  "a11yScore"  INTEGER,
  "bpScore"    INTEGER,
  "seoScore"   INTEGER,
  "lcpMs"      INTEGER,
  "clsX1k"     INTEGER,
  "inpMs"      INTEGER,
  "checks"     JSONB,
  "tasks"      JSONB,
  "errors"     TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SeoAudit_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "SeoSite"("id") ON DELETE CASCADE
);
CREATE INDEX "SeoAudit_siteId_createdAt_idx" ON "SeoAudit"("siteId", "createdAt");
CREATE INDEX "SeoAudit_runId_idx" ON "SeoAudit"("runId");
