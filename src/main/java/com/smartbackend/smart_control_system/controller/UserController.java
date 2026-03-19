package com.smartbackend.smart_control_system.controller;

import com.smartbackend.smart_control_system.dto.UserLoginRequest;
import com.smartbackend.smart_control_system.dto.UserLoginResponse;
import com.smartbackend.smart_control_system.dto.UserRegisterRequest;
import com.smartbackend.smart_control_system.dto.UserResponse;
import com.smartbackend.smart_control_system.service.UserService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public UserResponse registerUser(
            @RequestBody UserRegisterRequest request) {

        return userService.registerUser(request);
    }

    @PostMapping("/login")
    public UserLoginResponse loginUser(
            @RequestBody UserLoginRequest request) {

        return userService.loginUser(request);
    }
}