# Carpenter API

Spring Boot backend for a carpenter product and order management system.

## Package Structure

- `com.carpenter.config` - security, cloudinary, and bootstrap configuration
- `com.carpenter.controller` - REST endpoints
- `com.carpenter.service` - business logic
- `com.carpenter.repository` - Spring Data JPA repositories
- `com.carpenter.model` - entities and enums
- `com.carpenter.dto` - request/response DTOs
- `com.carpenter.security` - JWT and user details components
- `com.carpenter.exception` - custom exceptions and global handler

## Run

```bash
./mvnw spring-boot:run
```
