package com.carpenter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ENTRY POINT of the entire application.
 *
 * @SpringBootApplication is a combination of:
 *   @Configuration      → This class can define Spring beans
 *   @EnableAutoConfiguration → Spring Boot auto-configures based on dependencies
 *   @ComponentScan      → Scans com.carpenter package for all @Component, @Service,
 *                         @Repository, @Controller annotations
 *
 * When you run this class, Spring Boot:
 * 1. Starts embedded Tomcat server on port 8080
 * 2. Scans all packages for Spring components
 * 3. Connects to MySQL database
 * 4. Creates tables from your Entity classes
 * 5. Runs DataInitializer (seed data)
 * 6. Starts listening for HTTP requests
 */
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class CarpenterApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarpenterApiApplication.class, args);
    }
}