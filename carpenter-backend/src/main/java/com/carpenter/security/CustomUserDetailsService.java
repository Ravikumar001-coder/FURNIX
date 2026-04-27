package com.carpenter.security;

import com.carpenter.model.Admin;
import com.carpenter.model.Customer;
import com.carpenter.repository.AdminRepository;
import com.carpenter.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.info("Attempting to load user by identifier: [{}]", username);
        // Try Admin first
        Optional<Admin> adminOpt = adminRepository.findByUsername(username);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            return User.builder()
                    .username(admin.getUsername())
                    .password(admin.getPassword())
                    .authorities(new SimpleGrantedAuthority(admin.getRole()))
                    .build();
        }

        // Try Customer (email as username)
        Optional<Customer> customerOpt = customerRepository.findByEmail(username);
        if (customerOpt.isEmpty()) {
            // If not found by email, try by phone
            customerOpt = customerRepository.findByPhone(username);
        }

        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            // Use phone as username if email is null
            String finalUsername = customer.getEmail() != null ? customer.getEmail() : customer.getPhone();
            return User.builder()
                    .username(finalUsername)
                    .password(customer.getPassword())
                    .authorities(new SimpleGrantedAuthority(customer.getRole()))
                    .build();
        }

        throw new UsernameNotFoundException("No user found with identifier: " + username);
    }
}