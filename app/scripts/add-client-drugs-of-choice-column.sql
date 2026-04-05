-- Run once on existing databases. Adds JSON array storage for drug-of-choice lookup ids (like `benefits`).
ALTER TABLE clients ADD COLUMN drugsOfChoice TEXT NULL;

-- Optional: copy legacy single id into the new column (MySQL 5.7+ / MariaDB 10.2+).
-- UPDATE clients
-- SET drugsOfChoice = JSON_ARRAY(drugOfChoiceId)
-- WHERE drugOfChoiceId IS NOT NULL AND (drugsOfChoice IS NULL OR drugsOfChoice = '');
