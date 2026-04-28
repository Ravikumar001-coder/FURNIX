package com.carpenter.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Catches ALL exceptions from ALL controllers.
 * Converts them to clean, consistent JSON responses.
 *
 * Without this: client gets ugly HTML error pages or raw stack traces.
 * With this: client always gets a predictable JSON structure.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ─── Validation Errors ───────────────────────────────────────

    /**
     * Triggered when @Valid fails on a @RequestBody.
     * Returns ALL field errors at once.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
        public ProblemDetail handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> errors = new HashMap<>();

        ex.getBindingResult().getAllErrors().forEach(error -> {
            String field = ((FieldError) error).getField();
            String msg   = error.getDefaultMessage();
            errors.put(field, msg);
        });

        log.warn("Validation failed: {}", errors);

        ProblemDetail problem = buildProblem(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                "Please fix the validation errors",
                request
        );
        problem.setProperty("errors", errors);
        return problem;
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request) {
        return buildProblem(
                HttpStatus.BAD_REQUEST,
                "Invalid parameter",
                "Invalid value for parameter '%s': %s".formatted(ex.getName(), ex.getValue()),
                request
        );
    }

    // ─── Business Logic Errors ────────────────────────────────────

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        log.warn("Resource not found: {}", ex.getMessage());
        return buildProblem(HttpStatus.NOT_FOUND, "Resource not found", ex.getMessage(), request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ProblemDetail handleBadRequest(
            BadRequestException ex,
            HttpServletRequest request) {

        log.warn("Bad request: {}", ex.getMessage());
        return buildProblem(HttpStatus.BAD_REQUEST, "Bad request", ex.getMessage(), request);
    }

    @ExceptionHandler(InvalidQuoteException.class)
    public ProblemDetail handleInvalidQuote(
            InvalidQuoteException ex,
            HttpServletRequest request) {

        log.warn("Invalid quote: {}", ex.getMessage());
        return buildProblem(HttpStatus.BAD_REQUEST, "Invalid quote", ex.getMessage(), request);
    }

    // ─── Security Errors ─────────────────────────────────────────

    @ExceptionHandler(BadCredentialsException.class)
        public ProblemDetail handleBadCredentials(
            BadCredentialsException ex,
            HttpServletRequest request) {

        log.warn("Failed login attempt - invalid credentials");
        return buildProblem(
            HttpStatus.UNAUTHORIZED,
            "Authentication failed",
            "Invalid username or password",
            request
        );
    }

    @ExceptionHandler(DisabledException.class)
        public ProblemDetail handleDisabled(
            DisabledException ex,
            HttpServletRequest request) {

        return buildProblem(
            HttpStatus.UNAUTHORIZED,
            "Authentication failed",
            "Account is disabled. Contact support.",
            request
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
        public ProblemDetail handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request) {

        log.warn("Access denied attempt");
        return buildProblem(
            HttpStatus.FORBIDDEN,
            "Access denied",
            "Access denied. Admin privileges required.",
            request
        );
    }

    // ─── File Upload Error ────────────────────────────────────────

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleFileTooLarge(
            MaxUploadSizeExceededException ex,
            HttpServletRequest request) {

        return buildProblem(
                HttpStatus.PAYLOAD_TOO_LARGE,
                "Payload too large",
                "File is too large. Maximum size is 10MB.",
                request
        );
    }

    // ─── Catch-All ───────────────────────────────────────────────

    /**
     * Catches any unhandled exception.
     * Prevents raw stack traces from reaching the client.
     * Always logs the full error internally.
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);

        return buildProblem(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error",
                "Something went wrong on our end. Please try again later.",
                request
        );
    }

    private ProblemDetail buildProblem(
            HttpStatus status,
            String title,
            String detail,
            HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(title);
        problem.setType(URI.create("https://api.carpenter.local/problems/" + status.value()));
        problem.setProperty("timestamp", Instant.now().toString());
        problem.setProperty("path", request.getRequestURI());
        return problem;
    }
}