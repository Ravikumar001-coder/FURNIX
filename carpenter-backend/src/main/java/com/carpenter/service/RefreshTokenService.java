package com.carpenter.service;

import com.carpenter.exception.BadRequestException;
import com.carpenter.model.RefreshToken;
import com.carpenter.repository.RefreshTokenRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RefreshTokenService {

    @Value("${jwt.refresh-expiration-ms:${app.jwt.refreshExpiration:604800000}}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(String username) {
        refreshTokenRepository.deleteByUsername(username);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUsername(username);
        refreshToken.setExpiryDate(Instant.now().plusMillis(refreshTokenDurationMs));
        refreshToken.setToken(UUID.randomUUID().toString());

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            throw new BadRequestException("Refresh token was expired. Please sign in again");
        }
        return token;
    }

    public long getRefreshTokenDurationSeconds() {
        return refreshTokenDurationMs / 1000;
    }

    @Transactional
    public int deleteByUsername(String username) {
        return refreshTokenRepository.deleteByUsername(username);
    }

    @Transactional
    public int deleteByToken(String token) {
        return refreshTokenRepository.deleteByToken(token);
    }
}
