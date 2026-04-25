package com.carpenter.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Pattern PROTECTED_AUTH_PATH = Pattern.compile(
            "^/api(?:/v1|/v2)?/auth/(login|register|google|social-login|refresh)$");

    private static final String RATE_LIMIT_RESPONSE =
            "{\"success\":false,\"message\":\"Too many authentication attempts. Please try again shortly.\"}";

    private final Map<String, ConcurrentLinkedDeque<Long>> requestsPerKey = new ConcurrentHashMap<>();

    @Value("${app.auth.rate-limit.max-attempts:10}")
    private int maxAttempts;

    @Value("${app.auth.rate-limit.window-seconds:60}")
    private long windowSeconds;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (HttpMethod.OPTIONS.matches(request.getMethod())) {
            return true;
        }
        return !PROTECTED_AUTH_PATH.matcher(request.getRequestURI()).matches();
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String clientIp = extractClientIp(request);
        String rateLimitKey = request.getRequestURI() + "|" + clientIp;
        long now = System.currentTimeMillis();

        if (!isAllowed(rateLimitKey, now)) {
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write(RATE_LIMIT_RESPONSE);
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isAllowed(String key, long now) {
        long windowStart = now - (windowSeconds * 1000);
        ConcurrentLinkedDeque<Long> timestamps = requestsPerKey.computeIfAbsent(key, ignored -> new ConcurrentLinkedDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }

            if (timestamps.size() >= maxAttempts) {
                return false;
            }

            timestamps.addLast(now);
            return true;
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String[] addresses = forwardedFor.split(",");
            if (addresses.length > 0 && !addresses[0].isBlank()) {
                return addresses[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}
