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
    import com.smartbackend.smart_control_system.repository.ApiRepository;
    import com.smartbackend.smart_control_system.repository.ApiSubscriptionRepository;
    import com.smartbackend.smart_control_system.dto.UserProfileDto;
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
        private final ApiRepository apiRepository;
        private final ApiSubscriptionRepository apiSubscriptionRepository;

        public UserService(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtService jwtService,
                           NotificationService notificationService,
                           EmailService emailService,
                           ApiRepository apiRepository,
                           ApiSubscriptionRepository apiSubscriptionRepository) {
            this.userRepository = userRepository;
            this.passwordEncoder = passwordEncoder;
            this.jwtService = jwtService;
            this.notificationService = notificationService;
            this.emailService = emailService;
            this.apiRepository = apiRepository;
            this.apiSubscriptionRepository = apiSubscriptionRepository;
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

        public UserProfileDto getUserProfile(Long userId) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            UserProfileDto dto = new UserProfileDto();
            dto.setId(user.getId());
            dto.setName(user.getName());
            dto.setEmail(user.getEmail());
            dto.setPhone(user.getPhone());
            dto.setUserId("USR-" + user.getId());
            dto.setPhoto(user.getPhotoUrl());
            dto.setCompany(user.getCompany());
            dto.setAddress(user.getAddress());
            dto.setDateOfBirth(user.getDateOfBirth());
            dto.setRole(user.getRole().name());

            if (user.getRole() == UserRole.API_PROVIDER) {
                int totalApis = apiRepository.findByProvider_Id(user.getId()).size();
                dto.setTotalApis(totalApis);
                dto.setProviderId("PRV-" + user.getId());
            } else {
                int totalSubs = (int) apiSubscriptionRepository.findByConsumer_Id(user.getId()).size();
                dto.setTotalSubscriptions(totalSubs);
                dto.setConsumerId("CON-" + user.getId());
                dto.setSubscriptionPlan("Free Plan"); // Placeholder plan
            }

            return dto;
        }

        public UserProfileDto updateUserProfile(Long userId, UserProfileDto request) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            if (request.getName() != null) user.setName(request.getName());
            if (request.getEmail() != null) user.setEmail(request.getEmail());
            if (request.getPhone() != null) user.setPhone(request.getPhone());
            if (request.getPhoto() != null) user.setPhotoUrl(request.getPhoto());
            if (request.getCompany() != null) user.setCompany(request.getCompany());
            if (request.getAddress() != null) user.setAddress(request.getAddress());
            if (request.getDateOfBirth() != null) user.setDateOfBirth(request.getDateOfBirth());
            
            userRepository.save(user);
            return getUserProfile(userId);
        }

        public void deleteUser(Long userId) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            userRepository.delete(user);
        }
    }