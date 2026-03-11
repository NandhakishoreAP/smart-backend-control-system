package com.smartbackend.smart_control_system.controller;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/monitor")
public class MonitoringController {

    private final SimpMessagingTemplate messagingTemplate;

    public MonitoringController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/test")
    public String testMonitoring() {

        messagingTemplate.convertAndSend(
                "/topic/api-monitor",
                "Test API Monitoring Event"
        );

        return "Monitoring event sent";
    }
}