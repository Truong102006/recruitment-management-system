-- BR18 repair for rows written before BE1 normalized ordinary text.
-- One statement is atomic: storage/constraint failures roll back the whole repair.
-- Preserve business state, publication times, credentials, and BE2 snapshots.
DO $repair$
DECLARE
  -- ECMAScript String.trim whitespace, including BOM; PostgreSQL btrim defaults
  -- to ASCII space only. U+0085 is deliberately absent, matching JavaScript.
  whitespace CONSTANT text := U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
BEGIN
  UPDATE "user_account"
  SET "full_name" = normalize(btrim("full_name", whitespace), NFC),
      "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
  WHERE "full_name" IS DISTINCT FROM normalize(btrim("full_name", whitespace), NFC);

  UPDATE "company"
  SET "name" = normalize(btrim("name", whitespace), NFC),
      "address" = normalize(btrim("address", whitespace), NFC),
      "website" = normalize(btrim("website", whitespace), NFC),
      "description" = normalize(btrim("description", whitespace), NFC),
      "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
  WHERE ("name", "address", "website", "description") IS DISTINCT FROM (
    normalize(btrim("name", whitespace), NFC),
    normalize(btrim("address", whitespace), NFC),
    normalize(btrim("website", whitespace), NFC),
    normalize(btrim("description", whitespace), NFC)
  );

  UPDATE "job_post"
  SET "title" = normalize(btrim("title", whitespace), NFC),
      "description" = normalize(btrim("description", whitespace), NFC),
      "location" = normalize(btrim("location", whitespace), NFC),
      "close_reason" = normalize(btrim("close_reason", whitespace), NFC),
      "version" = "version" + 1, "updated_at" = CURRENT_TIMESTAMP
  WHERE ("title", "description", "location", "close_reason") IS DISTINCT FROM (
    normalize(btrim("title", whitespace), NFC),
    normalize(btrim("description", whitespace), NFC),
    normalize(btrim("location", whitespace), NFC),
    normalize(btrim("close_reason", whitespace), NFC)
  );
END
$repair$;
