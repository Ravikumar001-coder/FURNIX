package com.carpenter.config;

import com.carpenter.model.*;
import com.carpenter.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;
import java.util.List;

/**
 * Runs once when application starts.
 * Creates default admin + sample products if DB is empty.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Value("${app.seed.reset-admin-password:false}")
    private boolean resetAdminPassword;

    private final AdminRepository    adminRepository;
    private final ProductRepository  productRepository;
    private final SiteSettingRepository settingRepository;
    private final PasswordEncoder    passwordEncoder;

    @Override
    public void run(String... args) {
        createDefaultAdmin();
        createSampleProducts();
        createDefaultSettings();
    }

    private void createDefaultAdmin() {
        if (adminRepository.existsByUsername("admin")) {
            if (resetAdminPassword) {
                adminRepository.findByUsername("admin").ifPresent(admin -> {
                    admin.setPassword(passwordEncoder.encode("admin123"));
                    admin.setRole("ROLE_ADMIN"); // ensure role is correct
                    adminRepository.save(admin);
                });
                log.warn("Admin password reset to default because app.seed.reset-admin-password=true");
                log.warn("Default credentials: admin / admin123");
                return;
            }

            log.info("Admin already exists, skipping creation");
            return;
        }

        Admin admin = Admin.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .role("ROLE_ADMIN")
                .build();

        adminRepository.save(admin);
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        log.info("✅ Default admin created");
        log.info("   Username: admin");
        log.info("   Password: admin123");
        log.info("⚠️  CHANGE PASSWORD IN PRODUCTION!");
        log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    private void createSampleProducts() {
        if (productRepository.count() > 0) {
            log.info("Products already exist, skipping sample data");
            return;
        }

        List<Product> products = List.of(
            Product.builder()
                .name("Classic Wooden Dining Chair")
                .description("Handcrafted solid teak wood dining chair with smooth sanded finish. Durable and elegant, perfect for any dining room.")
                .price(new BigDecimal("250.00"))
                .category(ProductCategory.CHAIR)
                .imageUrl("https://images.unsplash.com/photo-1592078615290-033ee584e267")
                .active(true)
                .build(),

            Product.builder()
                .name("6-Seater Mahogany Dining Table")
                .description("Solid mahogany wood dining table. Seats 6 comfortably. Hand-polished with natural oil finish that highlights wood grain.")
                .price(new BigDecimal("1200.00"))
                .category(ProductCategory.TABLE)
                .imageUrl("https://images.unsplash.com/photo-1555041469-a586c61ea9bc")
                .active(true)
                .build(),

            Product.builder()
                .name("King Size Wooden Bed Frame")
                .description("King size bed frame crafted from solid oak. Features elegant headboard with carved details. Supports up to 500kg.")
                .price(new BigDecimal("1800.00"))
                .category(ProductCategory.BED)
                .imageUrl("https://images.unsplash.com/photo-1505693314120-0d443867891c")
                .active(true)
                .build(),

            Product.builder()
                .name("4-Door Wooden Wardrobe")
                .description("Spacious 4-door wardrobe with 3 internal shelves and hanging rail. Built from pine wood with walnut finish.")
                .price(new BigDecimal("950.00"))
                .category(ProductCategory.WARDROBE)
                .imageUrl("https://images.unsplash.com/photo-1558618666-fcd25c85cd64")
                .active(true)
                .build(),

            Product.builder()
                .name("Solid Wood Entrance Door")
                .description("Heavy-duty solid teak entrance door. Natural resistance to moisture and insects. Available in custom sizes.")
                .price(new BigDecimal("600.00"))
                .category(ProductCategory.DOOR)
                .imageUrl("https://images.unsplash.com/photo-1558618047-3c8c76ca7d13")
                .active(true)
                .build()
        );

        productRepository.saveAll(products);
        log.info("✅ {} sample products created", products.size());
    }

    private void createDefaultSettings() {
        if (settingRepository.count() > 0) {
            log.info("CMS settings already initialized");
            return;
        }

        List<SiteSetting> defaultSettings = List.of(
            new SiteSetting("hero.title", "Handcrafted Wooden Excellence"),
            new SiteSetting("hero.subtitle", "Discover bespoke furniture tailored to your space, crafted with passion and precision."),
            new SiteSetting("contact.phone", "+91 98765 43210"),
            new SiteSetting("contact.email", "hello@furnix.com"),
            new SiteSetting("seo.description", "Furnix - Premium Handcrafted Furniture & Bespoke Woodworking services.")
        );

        settingRepository.saveAll(defaultSettings);
        log.info("✅ Default CMS settings initialized");
    }
}