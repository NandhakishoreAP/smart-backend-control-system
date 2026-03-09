package com.smartbackend.smart_control_system.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendAlert(String subject, String message) {

        SimpleMailMessage mail = new SimpleMailMessage();

        mail.setTo("admin@system.com");
        mail.setSubject(subject);
        mail.setText(message);

        mailSender.send(mail);
    }
}