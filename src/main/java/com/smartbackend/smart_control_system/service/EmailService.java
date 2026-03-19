package com.smartbackend.smart_control_system.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.smartbackend.smart_control_system.entity.NotificationType;
import com.smartbackend.smart_control_system.entity.UserRole;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.annotation.PostConstruct;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    private final String defaultRecipient;
    private final String mailPassword;

    public EmailService(JavaMailSender mailSender,
                        @Value("${spring.mail.username:}") String defaultRecipient,
                        @Value("${spring.mail.password:}") String mailPassword) {
        this.mailSender = mailSender;
        this.defaultRecipient = defaultRecipient;
        this.mailPassword = mailPassword;
    }

    @PostConstruct
    public void logMailConfig() {
        boolean hasUser = defaultRecipient != null && !defaultRecipient.isBlank();
        boolean hasPassword = mailPassword != null && !mailPassword.isBlank();
        String maskedUser = hasUser ? maskEmail(defaultRecipient) : "missing";
        logger.info("SMTP config - username: {}, password set: {}", maskedUser, hasPassword);
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) {
            return "***";
        }
        String prefix = email.substring(0, 1);
        String domain = email.substring(at);
        return prefix + "***" + domain;
    }

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendAlert(String subject, String body) {
        sendEmail(defaultRecipient, subject, body);
    }

    public void sendNotificationEmail(String to, NotificationType type, String message) {
        String title = type == null ? "Notification" : (type.name() + " Notification");
        String subject = "Smart Control System | " + title;
        String html = buildNotificationHtml(title, message);
        sendHtmlEmail(to, subject, html);
    }

    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
        } catch (MessagingException ex) {
            throw new RuntimeException("Failed to send email", ex);
        }
    }

    public void sendTestEmail() {
        sendEmail(defaultRecipient, "Smart Control Test Email", "Test email from Smart Control System.");
    }

        public void sendWelcomeEmail(String to, String name, UserRole role) {
                if (to == null || to.isBlank()) {
                        return;
                }
                String roleLabel = role == UserRole.API_PROVIDER ? "Publisher" : "Subscriber";
                String subject = "Welcome to API Platform";
                String headline = role == UserRole.API_PROVIDER
                                ? "Welcome, Publisher"
                                : "Welcome, Subscriber";
                String subcopy = role == UserRole.API_PROVIDER
                                ? "Publish APIs, manage versions, and reach new consumers."
                                : "Explore APIs, subscribe, and start building quickly.";
                String html = """
                                <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#111;\">
                                    <div style=\"padding:20px;border-radius:14px;background:linear-gradient(135deg,#e6fff4,#f1f7ff);\">
                                        <p style=\"margin:0 0 6px;color:#3b4a5a;text-transform:uppercase;letter-spacing:0.18em;font-size:11px;\">Smart Control System</p>
                                        <h1 style=\"margin:0 0 6px;font-size:22px;\">%s</h1>
                                        <p style=\"margin:0;color:#425466;\">%s</p>
                                    </div>
                                    <div style=\"margin-top:16px;padding:14px;border:1px solid #eee;border-radius:10px;background:#fff;\">
                                        <p style=\"margin:0 0 10px;\">Hello %s,</p>
                                        <p style=\"margin:0 0 10px;\">Welcome! You can now explore APIs and start building.</p>
                                        <p style=\"margin:0;\">Role: <strong>%s</strong></p>
                                    </div>
                                    <p style=\"margin:16px 0 0;color:#666;font-size:12px;\">If you did not create this account, please ignore this email.</p>
                                </div>
                                """.formatted(headline, subcopy, name == null ? "there" : name, roleLabel);
                sendHtmlEmail(to, subject, html);
        }

    private String buildNotificationHtml(String title, String message) {
        String safeTitle = escapeHtml(title);
        String safeMessage = escapeHtml(message).replace("\n", "<br>");
        return """
                <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#111;\">
                  <h2 style=\"margin:0 0 8px;\">%s</h2>
                  <p style=\"margin:0 0 12px;color:#444;\">Smart Control System notification</p>
                  <div style=\"padding:12px 14px;border:1px solid #eee;border-radius:8px;background:#fafafa;\">%s</div>
                  <p style=\"margin:16px 0 0;color:#666;font-size:12px;\">If you did not expect this email, please ignore it.</p>
                </div>
                """.formatted(safeTitle, safeMessage);
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}