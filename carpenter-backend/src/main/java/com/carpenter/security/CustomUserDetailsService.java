package com.carpenter.security;

import com.carpenter.model.Admin;
import com.carpenter.model.Customer;
import com.carpenter.repository.AdminRepository;
import com.carpenter.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final CustomerRepository customerRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
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
        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            return User.builder()
                    .username(customer.getEmail())
                    .password(customer.getPassword())
                    .authorities(new SimpleGrantedAuthority(customer.getRole()))
                    .build();
        }

        throw new UsernameNotFoundException("No user found with identifier: " + username);
    }
}