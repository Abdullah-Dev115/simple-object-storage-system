-- CreateTable
CREATE TABLE "Blob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "size" INTEGER NOT NULL,
    "storageBackend" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BlobStorage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "data" BLOB NOT NULL,
    CONSTRAINT "BlobStorage_id_fkey" FOREIGN KEY ("id") REFERENCES "Blob" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
