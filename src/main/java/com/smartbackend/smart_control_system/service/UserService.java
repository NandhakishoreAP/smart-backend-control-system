    package com.smartbackend.smart_control_system.service;

    import com.smartbackend.smart_control_system.dto.UserRegisterRequest;
    import com.smartbackend.smart_control_system.dto.UserResponse;
    import com.smartbackend.smart_control_system.entity.User;
    import com.smartbackend.smart_control_system.entity.UserRole;
import com.smartbackend.smart_control_system.events.NotificationEvent;
import com.smartbackend.smart_control_system.entity.NotificationType;
    import com.smartbackend.smart_control_system.repository.UserRepository;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.stereotype.Service;
    import org.springframework.context.ApplicationEventPublisher;

    import java.util.Optional;

    @Service
    public class UserService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final ApplicationEventPublisher eventPublisher;

        public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, ApplicationEventPublisher eventPublisher) {
            this.userRepository = userRepository;
            this.passwordEncoder = passwordEncoder;
            this.eventPublisher = eventPublisher;
        }

        public UserResponse registerUser(UserRegisterRequest request) {

            Optional<User> existingUser =
                    userRepository.findByEmail(request.getEmail());

            if (existingUser.isPresent()) {
                throw new IllegalArgumentException("Email already exists");
            }

            User user = new User();

            user.setName(request.getName());
            user.setEmail(request.getEmail());
            if (request.getRole() == null) {
                user.setRole(UserRole.API_USER);
            } else {
                user.setRole(request.getRole());
            }

            // encrypt password
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            User savedUser = userRepository.save(user);

            // create notification
        eventPublisher.publishEvent(
            new NotificationEvent(
                "User Registered",
                "Welcome to the platform!",
                NotificationType.USER,
                savedUser
            )
        );
            return new UserResponse(
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail()
            );
        }
    }