package com.example.drainadoption.config;
import com.example.drainadoption.model.User;
import com.example.drainadoption.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
@Configuration
public class BootstrapAdmin {
    @Bean CommandLineRunner adminBootstrap(UserRepository users,PasswordEncoder encoder,
        @Value("${aad.bootstrap-admin-email}") String email,@Value("${aad.bootstrap-admin-password}") String password) {
        return args -> {
            if(!email.isBlank() && users.findByEmail(email).isEmpty()) {
                if(password.length()<12) throw new IllegalArgumentException("Administrator password must have at least 12 characters");
                User user=new User();user.setEmail(email);user.setName("Study coordinator");
                user.setPassword(encoder.encode(password));user.setRole(User.UserRole.ADMIN);users.save(user);
            }
        };
    }
}
