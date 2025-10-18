-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BlobStorage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    CONSTRAINT "BlobStorage_id_fkey" FOREIGN KEY ("id") REFERENCES "Blob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BlobStorage" ("data", "id") SELECT "data", "id" FROM "BlobStorage";
DROP TABLE "BlobStorage";
ALTER TABLE "new_BlobStorage" RENAME TO "BlobStorage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
