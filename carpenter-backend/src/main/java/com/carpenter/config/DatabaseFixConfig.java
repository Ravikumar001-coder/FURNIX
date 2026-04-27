package com.carpenter.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseFixConfig implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            log.info("Checking and fixing database column lengths...");
            
            // Fix provider column in customers table
            jdbcTemplate.execute("ALTER TABLE customers MODIFY COLUMN provider VARCHAR(50)");
            log.info("Successfully updated customers.provider column length.");

            // Make email nullable in customers table
            jdbcTemplate.execute("ALTER TABLE customers MODIFY COLUMN email VARCHAR(100) NULL");
            log.info("Successfully made customers.email nullable.");

            // Add unique constraint to phone if not exists (handling common MySQL version differences)
            try {
                jdbcTemplate.execute("ALTER TABLE customers ADD UNIQUE (phone)");
                log.info("Successfully added unique constraint to customers.phone.");
            } catch (Exception e) {
                log.info("Unique constraint on phone already exists or skipped: {}", e.getMessage());
            }
            
            // Fix setting_value in site_settings just in case
            jdbcTemplate.execute("ALTER TABLE site_settings MODIFY COLUMN setting_value TEXT");
            log.info("Successfully updated site_settings.setting_value column type.");
            
        } catch (Exception e) {
            log.warn("Database fix failed or already applied: {}", e.getMessage());
        }
    }
}
