package com.carpenter.service;

import com.carpenter.config.TaxConfigurationProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class TaxConfigurationService {

    private static final int SCALE = 2;

    private final TaxConfigurationProperties properties;

    public BigDecimal getGstRate() {
        return properties.getGstRate().setScale(SCALE, RoundingMode.HALF_UP);
    }
}
