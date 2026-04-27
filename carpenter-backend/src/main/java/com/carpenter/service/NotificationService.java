package com.carpenter.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final JavaMailSender mailSender;

    /**
     * Send an email asynchronously.
     */
    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            log.info("Sending async email to: {}", to);
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent successfully to {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    @Value("${app.whatsapp.provider:placeholder}")
    private String whatsappProvider;

    @Value("${app.whatsapp.api-key:}")
    private String whatsappApiKey;

    @Value("${app.whatsapp.twilio.sid:}")
    private String twilioSid;

    @Value("${app.whatsapp.twilio.token:}")
    private String twilioToken;

    @Value("${app.whatsapp.twilio.from:}")
    private String twilioFrom;

    /**
     * Send a WhatsApp message asynchronously.
     */
    @Async
    public void sendWhatsApp(String phone, String message) {
        log.info("Sending async WhatsApp to: {} | Provider: {}", phone, whatsappProvider);
        
        // Ensure phone has country code if missing (default to +91 for India as per user context)
        String formattedPhone = phone;
        if (!phone.startsWith("+")) {
            formattedPhone = "+91" + phone;
        }

        if ("twilio".equalsIgnoreCase(whatsappProvider)) {
            sendViaTwilio(formattedPhone, message);
        } else {
            // Placeholder/Logger for local development
            log.warn("REAL WHATSAPP NOT CONFIGURED. Message content for {}: {}", formattedPhone, message);
            try {
                Thread.sleep(500);
                log.info("WhatsApp simulation complete for {}", formattedPhone);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    private void sendViaTwilio(String phone, String message) {
        try {
            log.info("Sending WhatsApp via Twilio to: {}", phone);
            Twilio.init(twilioSid, twilioToken);
            
            Message.creator(
                    new PhoneNumber("whatsapp:" + phone),
                    new PhoneNumber(twilioFrom),
                    message)
                .create();
                
            log.info("Twilio WhatsApp message sent successfully to {}", phone);
        } catch (Exception e) {
            log.error("Twilio WhatsApp delivery failed: {}", e.getMessage());
        }
    }

    public void notifyInquiryReceived(String customerEmail, String customerName) {
        String subject = "We've Received Your Inquiry - Furnix Bespoke";
        String body = String.format("Hi %s,\n\nThank you for reaching out to Furnix. We have received your project inquiry and our master craftsman will review it shortly.\n\nYou can track your inquiry status on our website.\n\nBest regards,\nFurnix Team", customerName);
        sendEmail(customerEmail, subject, body);
    }

    public void notifyQuoteSent(String customerEmail, String customerName, Long quoteId) {
        String subject = "Your Custom Furniture Quote is Ready - Furnix";
        String body = String.format("Hi %s,\n\nExciting news! Your custom furniture quote (#%d) is ready for review. Please log in to your account to view the details and accept the quote.\n\nBest regards,\nFurnix Team", customerName, quoteId);
        sendEmail(customerEmail, subject, body);
    }

    public void notifyStatusUpdate(String customerEmail, String status) {
        String subject = "Update on Your Furnix Project";
        String body = String.format("Hi,\n\nYour project status has been updated to: %s.\n\nLog in to see the latest production photos and timeline updates.\n\nBest regards,\nFurnix Team", status.replace("_", " "));
        sendEmail(customerEmail, subject, body);
    }
}
