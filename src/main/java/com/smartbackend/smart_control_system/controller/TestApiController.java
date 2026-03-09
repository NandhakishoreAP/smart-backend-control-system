package com.smartbackend.smart_control_system.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestApiController {

    @GetMapping("/api/test")
    public String testApi() {
        return "API Gateway Working!";
    }
}