BEGIN TRANSACTION;

UPDATE dashboard
SET tombstone = TRUE
WHERE type is NULL;

COMMIT;
