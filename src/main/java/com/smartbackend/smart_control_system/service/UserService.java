    package com.smartbackend.smart_control_system.service;

    import com.smartbackend.smart_control_system.dto.UserLoginRequest;
    import com.smartbackend.smart_control_system.dto.UserLoginResponse;
    import com.smartbackend.smart_control_system.dto.UserRegisterRequest;
    import com.smartbackend.smart_control_system.dto.UserResponse;
    import com.smartbackend.smart_control_system.entity.User;
    import com.smartbackend.smart_control_system.entity.UserRole;
import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.service.NotificationService;
import com.smartbackend.smart_control_system.service.EmailService;
    import com.smartbackend.smart_control_system.repository.UserRepository;
    import com.smartbackend.smart_control_system.security.JwtService;
    import org.springframework.security.crypto.password.PasswordEncoder;
    import org.springframework.stereotype.Service;

    import java.util.Optional;

    @Service
    public class UserService {

        private final UserRepository userRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final NotificationService notificationService;
        private final EmailService emailService;

        public UserService(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           NotificationService notificationService,
                           EmailService emailService) {
            this.userRepository = userRepository;
            this.passwordEncoder = passwordEncoder;
            this.jwtService = jwtService;
            this.notificationService = notificationService;
            this.emailService = emailService;
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
                user.setRole(UserRole.API_CONSUMER);
            } else {
                user.setRole(request.getRole());
            }

            // encrypt password
            user.setPassword(passwordEncoder.encode(request.getPassword()));

            User savedUser = userRepository.save(user);

            // create notification
        String welcomeMessage = savedUser.getRole() == UserRole.API_PROVIDER
                ? "Welcome to the platform! You can now publish APIs and reach new consumers."
                : "Welcome to the platform! You can now explore APIs and start building.";

        notificationService.createNotification(welcomeMessage, NotificationType.INFO, savedUser);
        emailService.sendWelcomeEmail(savedUser.getEmail(), savedUser.getName(), savedUser.getRole());
            return new UserResponse(
                    savedUser.getId(),
                    savedUser.getName(),
                    savedUser.getEmail()
            );
        }

        public UserLoginResponse loginUser(UserLoginRequest request) {
            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

            if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Invalid email or password");
            }

            String token = jwtService.generateToken(user);
            return new UserLoginResponse(token, user.getId(), user.getRole().name());
        }
    }