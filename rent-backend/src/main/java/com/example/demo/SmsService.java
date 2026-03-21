package com.example.demo;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Service
@EnableScheduling
public class SmsService {

    private final RoomRepository repository;

    // In a real SaaS, this would be moved to application.properties or a Vault
    private final String API_KEY = "Wsc9kOKjMUb0fpGBgICFEZL4qiyNX7uRax6ltrmYew1HP3TdnDCa2qDsbjnMUSTweG8pRrH5gtuyiK3Z";

    public SmsService(RoomRepository repository) {
        this.repository = repository;
    }

    // Add this inside SmsService.java
    public void sendManualReminder(String roomId) throws Exception {
        // FIX: Parse the String roomId into a Long
        Long id = Long.parseLong(roomId);

        Room room = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Unit not found"));

        if (Boolean.TRUE.equals(room.getIsOccupied()) && room.getTenantPhone() != null) {
            String houseName = (room.getHouseName() != null) ? room.getHouseName() : "NoMadNest";
            String message = houseName + ": Rent for Unit " + room.getUnitNumber() +
                    " (Rs." + room.getMonthlyRent() + ") is due. Please clear ASAP.";

            sendSms(room.getTenantPhone(), message);

            room.setLastReminderSent(LocalDateTime.now());
            repository.save(room);
        } else {
            throw new Exception("Unit is vacant or has no phone number attached.");
        }
    }

    /**
     * Runs every day at 3:02 AM to check for due rents
     */
    @Scheduled(cron = "0 2 3 * * *")
    public void sendAutomaticReminders() {
        List<Room> rooms = repository.findAll();
        System.out.println("🔍 NoMadNest: Checking " + rooms.size() + " total units for rent reminders...");

        for (Room room : rooms) {
            // Only send if occupied, has a phone, and belongs to a house
            if (Boolean.TRUE.equals(room.getIsOccupied()) && room.getTenantPhone() != null) {
                try {
                    // DYNAMIC MESSAGE: Uses the specific House Name (e.g., LIG-941 or NoMadNest
                    // Banjara)
                    String houseName = (room.getHouseName() != null) ? room.getHouseName() : "NoMadNest";

                    String message = houseName + ": Rent for Unit " + room.getUnitNumber() +
                            " (Rs." + room.getMonthlyRent() + ") is due. Please clear by 10th.";

                    sendSms(room.getTenantPhone(), message);

                    // Update the last reminder time in the database
                    room.setLastReminderSent(LocalDateTime.now());
                    repository.save(room);

                    System.out.println("✅ Reminder sent for " + houseName + " - Unit " + room.getUnitNumber());
                } catch (Exception e) {
                    System.err.println("❌ Failed for Unit " + room.getUnitNumber() + ": " + e.getMessage());
                }
            }
        }
    }

    private void sendSms(String phoneNumber, String message) throws Exception {
        // 1. CLEAN THE NUMBER: Ensure it's 10 digits without +91 or spaces
        String cleanNumber = phoneNumber.replace("+", "").replace(" ", "").trim();
        if (cleanNumber.startsWith("91") && cleanNumber.length() > 10) {
            cleanNumber = cleanNumber.substring(2);
        }

        // 2. BUILD THE URL FOR FAST2SMS
        // Using UTF-8 for message encoding
        String encodedMessage = URLEncoder.encode(message, StandardCharsets.UTF_8.toString());

        String urlString = "https://www.fast2sms.com/dev/bulkV2?authorization=" + API_KEY +
                "&route=q" + // 'q' is for Quick SMS
                "&message=" + encodedMessage +
                "&flash=0&numbers=" + cleanNumber;

        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            System.out.println("📱 SMS successfully queued for " + cleanNumber);
        } else {
            System.out.println("⚠️ Fast2SMS Error. Code: " + responseCode + " for number: " + cleanNumber);
        }
        conn.disconnect();
    }
}