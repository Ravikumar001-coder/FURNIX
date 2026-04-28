package com.carpenter.config;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;
import java.math.BigDecimal;

@Data
@Component
@Validated
@ConfigurationProperties(prefix = "furnix.tax")
public class TaxConfigurationProperties {

    @NotNull
    @DecimalMin(value = "0.00", message = "GST rate must be >= 0")
    private BigDecimal gstRate;
}
