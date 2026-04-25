package com.carpenter.config;

import com.carpenter.security.AuthRateLimitFilter;
import com.carpenter.security.CustomUserDetailsService;
import com.carpenter.security.JwtAuthenticationFilter;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthRateLimitFilter authRateLimitFilter;
    private final CustomUserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/auth/me", "/api/v1/auth/me", "/api/v2/auth/me").authenticated()

                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/v1/auth/**", "/api/v2/auth/**").permitAll()

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/actuator/health",
                                "/actuator/info")
                        .permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/products/**", "/api/v2/products/**").permitAll()

                        .requestMatchers(HttpMethod.POST, "/api/orders").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/orders", "/api/v2/orders").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/settings", "/api/v1/settings").permitAll()

                        .requestMatchers(HttpMethod.GET,
                                "/api/orders/my-orders",
                                "/api/v1/orders/my-orders",
                                "/api/v2/orders/my-orders").hasAuthority("ROLE_USER")

                        .requestMatchers(HttpMethod.POST, "/api/products", "/api/products/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/products", "/api/products/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/products", "/api/products/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/products", "/api/products/**").hasAuthority("ROLE_ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/api/v1/products", "/api/v1/products/**",
                                "/api/v2/products", "/api/v2/products/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT,
                                "/api/v1/products", "/api/v1/products/**",
                                "/api/v2/products", "/api/v2/products/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE,
                                "/api/v1/products", "/api/v1/products/**",
                                "/api/v2/products", "/api/v2/products/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PATCH,
                                "/api/v1/products", "/api/v1/products/**",
                                "/api/v2/products", "/api/v2/products/**").hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/orders", "/api/orders/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/images", "/api/images/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/admin", "/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/settings", "/api/v1/settings").hasAuthority("ROLE_ADMIN")

                        .requestMatchers("/api/v1/orders", "/api/v1/orders/**", "/api/v2/orders", "/api/v2/orders/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/v1/images", "/api/v1/images/**", "/api/v2/images", "/api/v2/images/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/v1/admin", "/api/v1/admin/**", "/api/v2/admin", "/api/v2/admin/**").hasAuthority("ROLE_ADMIN")

                        .anyRequest().authenticated())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(
                "http://localhost:3000",
                "http://localhost:3001",
                "http://localhost:5173",
                "http://localhost:5174",
                "https://your-app.vercel.app"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
