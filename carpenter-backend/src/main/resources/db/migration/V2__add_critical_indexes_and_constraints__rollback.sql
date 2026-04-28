-- Rollback for Flyway V2: remove indexes and constraints added for production hardening
-- MySQL 8.0 online DDL with ALGORITHM=INPLACE, LOCK=NONE where supported

SET @db := DATABASE();

-- Rollback: remove admin pipeline status_v2 index
SET @idx_exists := (
        SELECT COUNT(1)
        FROM information_schema.statistics
        WHERE table_schema = @db
            AND table_name = 'inquiries'
            AND index_name = 'idx_inquiries_status_v2'
);
SET @sql := IF(
    @idx_exists = 1,
    'ALTER TABLE inquiries DROP INDEX idx_inquiries_status_v2, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rollback: remove customer inquiry history index
SET @idx_exists := (
        SELECT COUNT(1)
        FROM information_schema.statistics
        WHERE table_schema = @db
            AND table_name = 'inquiries'
            AND index_name = 'idx_inquiries_customer_id'
);
SET @sql := IF(
    @idx_exists = 1,
    'ALTER TABLE inquiries DROP INDEX idx_inquiries_customer_id, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rollback: remove OTP verification composite index
SET @idx_exists := (
        SELECT COUNT(1)
        FROM information_schema.statistics
        WHERE table_schema = @db
            AND table_name = 'otp_codes'
            AND index_name = 'idx_otp_codes_phone_used_created'
);
SET @sql := IF(
    @idx_exists = 1,
    'ALTER TABLE otp_codes DROP INDEX idx_otp_codes_phone_used_created, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Rollback: remove unique idempotency constraint/index
SET @idx_exists := (
        SELECT COUNT(1)
        FROM information_schema.statistics
        WHERE table_schema = @db
            AND table_name = 'inquiries'
            AND index_name = 'uq_inquiries_idempotency_key'
);
SET @sql := IF(
    @idx_exists = 1,
    'ALTER TABLE inquiries DROP INDEX uq_inquiries_idempotency_key, ALGORITHM=INPLACE, LOCK=NONE',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
