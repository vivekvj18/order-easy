package com.ordereasy.auth_service.service;

import com.twilio.Twilio;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.rest.verify.v2.service.VerificationCheck;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TwilioService {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.auth-token}")
    private String authToken;

    @Value("${twilio.verify-service-sid}")
    private String verifyServiceSid;

    // Initialize Twilio SDK once when Spring starts
    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }

    /**
     * Sends an OTP to the given phone number via Twilio Verify SMS.
     * Indian numbers are stored as 10 digits → prefixes +91 for Twilio's E.164 format.
     *
     * @param phoneNumber 10-digit Indian phone number (e.g. "9876543210")
     */
    public void sendOtp(String phoneNumber) {
        String e164Phone = "+91" + phoneNumber;

        Verification verification = Verification.creator(
                verifyServiceSid,
                e164Phone,
                "sms"           // channel: sms | call | whatsapp
        ).create();

        // Twilio returns "pending" on success
        if (!"pending".equals(verification.getStatus())) {
            throw new RuntimeException("Failed to send OTP. Please try again.");
        }
    }

    /**
     * Verifies the OTP entered by the user against Twilio Verify.
     *
     * @param phoneNumber 10-digit Indian phone number
     * @param otp         6-digit OTP entered by the user
     * @return true if OTP is correct and not expired, false otherwise
     */
    public boolean verifyOtp(String phoneNumber, String otp) {
        String e164Phone = "+91" + phoneNumber;

        try {
            VerificationCheck check = VerificationCheck.creator(
                    verifyServiceSid
            )
            .setTo(e164Phone)
            .setCode(otp)
            .create();

            // Twilio returns "approved" only if OTP is correct and not expired
            return "approved".equals(check.getStatus());

        } catch (Exception e) {
            // Twilio throws exception if OTP already used or expired
            return false;
        }
    }
}
