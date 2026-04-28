-- Flyway V2: critical indexes and constraints for production hardening
-- MySQL 8.0 online DDL with ALGORITHM=INPLACE, LOCK=NONE where supported

SET @db := DATABASE();

-- Business: enforce exactly-once inquiry ingestion by rejecting duplicate idempotency keys
SET @idx_exists := (
        SELECT COUNT(1)
        FROM (
                SELECT index_name
                FROM information_schema.statistics
                WHERE table_schema = @db
                    AND table_name = 'inquiries'
                GROUP BY index_name
                HAVING SUM(CASE WHEN seq_in_index = 1 AND column_name = 'idempotency_key' THEN 1 ELSE 0 END) = 1
                     AND COUNT(*) = 1
                     AND MAX(non_unique) = 0
        ) idx
);
SET @sql := IF(
    @idx_exists = 0,
    'ALTER TABLE inquiries ADD CONSTRAINT uq_inquiries_idempotency_key UNIQUE (idempotency_key), ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Business: optimize OTP verification lookup by phone_number + used + newest created_at
SET @idx_exists := (
        SELECT COUNT(1)
        FROM (
                SELECT index_name
                FROM information_schema.statistics
                WHERE table_schema = @db
                    AND table_name = 'otp_codes'
                GROUP BY index_name
                HAVING SUM(CASE WHEN seq_in_index = 1 AND column_name = 'phone_number' THEN 1 ELSE 0 END) = 1
                     AND SUM(CASE WHEN seq_in_index = 2 AND column_name = 'used' THEN 1 ELSE 0 END) = 1
                     AND SUM(CASE WHEN seq_in_index = 3 AND column_name = 'created_at' THEN 1 ELSE 0 END) = 1
                     AND COUNT(*) = 3
        ) idx
);
SET @sql := IF(
    @idx_exists = 0,
    'ALTER TABLE otp_codes ADD INDEX idx_otp_codes_phone_used_created (phone_number, used, created_at DESC) USING BTREE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Business: speed customer inquiry history and pagination for customer dashboards
SET @idx_exists := (
        SELECT COUNT(1)
        FROM (
                SELECT index_name
                FROM information_schema.statistics
                WHERE table_schema = @db
                    AND table_name = 'inquiries'
                GROUP BY index_name
                HAVING SUM(CASE WHEN seq_in_index = 1 AND column_name = 'customer_id' THEN 1 ELSE 0 END) = 1
                     AND COUNT(*) = 1
        ) idx
);
SET @sql := IF(
    @idx_exists = 0,
    'ALTER TABLE inquiries ADD INDEX idx_inquiries_customer_id (customer_id) USING BTREE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Business: optimize admin pipeline filtering by status_v2 and stage management
SET @idx_exists := (
        SELECT COUNT(1)
        FROM (
                SELECT index_name
                FROM information_schema.statistics
                WHERE table_schema = @db
                    AND table_name = 'inquiries'
                GROUP BY index_name
                HAVING SUM(CASE WHEN seq_in_index = 1 AND column_name = 'status_v2' THEN 1 ELSE 0 END) = 1
                     AND COUNT(*) = 1
        ) idx
);
SET @sql := IF(
    @idx_exists = 0,
    'ALTER TABLE inquiries ADD INDEX idx_inquiries_status_v2 (status_v2) USING BTREE, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
