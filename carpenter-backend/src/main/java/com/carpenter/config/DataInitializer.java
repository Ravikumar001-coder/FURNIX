package com.carpenter.config;

import com.carpenter.model.Admin;
import com.carpenter.model.Product;
import com.carpenter.model.ProductCategory;
import com.carpenter.model.SiteSetting;
import com.carpenter.repository.AdminRepository;
import com.carpenter.repository.ProductRepository;
import com.carpenter.repository.SiteSettingRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Runs once when application starts.
 * Creates default admin + sample products + default CMS settings.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    @Value("${app.seed.reset-admin-password:false}")
    private boolean resetAdminPassword;

    private final AdminRepository adminRepository;
    private final ProductRepository productRepository;
    private final SiteSettingRepository settingRepository;
    private final PasswordEncoder passwordEncoder;

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
                    admin.setRole("ROLE_ADMIN");
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
        log.info("Default admin created: admin / admin123");
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
        log.info("{} sample products created", products.size());
    }

    private void createDefaultSettings() {
        Map<String, String> defaultSettingsMap = buildDefaultSettings();
        Set<String> existingKeys = settingRepository.findAll().stream()
                .map(SiteSetting::getSettingKey)
                .collect(Collectors.toSet());

        List<SiteSetting> missingSettings = defaultSettingsMap.entrySet().stream()
                .filter(entry -> !existingKeys.contains(entry.getKey()))
                .map(entry -> new SiteSetting(entry.getKey(), entry.getValue()))
                .toList();

        if (missingSettings.isEmpty()) {
            log.info("CMS settings already initialized");
            return;
        }

        settingRepository.saveAll(missingSettings);
        log.info("{} CMS setting keys initialized", missingSettings.size());
    }

    private Map<String, String> buildDefaultSettings() {
        Map<String, String> defaults = new LinkedHashMap<>();

        defaults.put("brand.name", "Furnix");
        defaults.put("brand.slogan", "Crafted for modern living. Built with precision.");
        defaults.put("brand.logo", "/assets/furnix-logo.png");

        defaults.put("hero.title", "Handcrafted Wooden Excellence");
        defaults.put("hero.subtitle", "Discover bespoke furniture tailored to your space, crafted with passion and precision.");

        defaults.put("contact.whatsapp", "919142081366");
        defaults.put("contact.phone", "+91 9142081366");
        defaults.put("contact.phone.primary", "+91 9142081366");
        defaults.put("contact.phone.support", "+91 9142081366");
        defaults.put("contact.email", "lxravi100@gmail.com");
        defaults.put("contact.email.primary", "lxravi100@gmail.com");
        defaults.put("contact.email.support", "lxravi100@gmail.com");

        defaults.put("location.address", "Dhowatand East, Near TOP, Exchange Road Dhanbad-826004, Jharkhand");
        defaults.put("location.city", "Dhanbad");
        defaults.put("location.region", "Jharkhand");
        defaults.put("location.mapEmbedUrl", "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7950.488101034907!2d86.41265449226158!3d23.78492443421252!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f6bccce36b0723%3A0xfa56614f5a66aaea!2sTelephone%20Exchange%20Rd%2C%20Dhanbad%2C%20Jharkhand%20826007!5e0!3m2!1sen!2sin!4v1777087059565!5m2!1sen!2sin");

        defaults.put("hours.weekdays", "Mon-Fri: 9:00 AM - 6:00 PM");
        defaults.put("hours.saturday", "Sat: 10:00 AM - 4:00 PM");
        defaults.put("hours.sunday", "Sun: Closed");
        defaults.put("hours.notes", "Visits by appointment only");

        defaults.put("social.instagram", "https://instagram.com/furnix");
        defaults.put("social.facebook", "https://facebook.com/furnix");
        defaults.put("social.whatsapp_link", "https://wa.me/919142081366");

        defaults.put("stats.homesFurnished", "500+");
        defaults.put("stats.deliveryReach", "300+");
        defaults.put("stats.warrantyYears", "5");
        defaults.put("stats.serviceArea", "India");

        defaults.put("trust.points", "Premium Joinery|Handcrafted|Solid Wood|Precision Engineering|Natural Finishes");

        defaults.put("seo.title", "Furnix | Premium Handcrafted Furniture");
        defaults.put("seo.description", "Furnix - Premium Handcrafted Furniture & Bespoke Woodworking services.");
        defaults.put("seo.keywords", "furnix, artisan furniture, bespoke furniture, handcrafted woodwork, custom furniture");
        defaults.put("og.title", "Furnix | Premium Handcrafted Furniture");
        defaults.put("og.description", "Furnix provides premium handcrafted bespoke furniture.");

        return defaults;
    }
}
