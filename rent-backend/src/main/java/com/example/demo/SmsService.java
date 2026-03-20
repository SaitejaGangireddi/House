package com.example.demo;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.List;

@Service
@EnableScheduling
public class SmsService {

    private java.time.LocalDateTime lastReminderSent;

    private final RoomRepository repository;
    private final String API_KEY = "Wsc9kOKjMUb0fpGBgICFEZL4qiyNX7uRax6ltrmYew1HP3TdnDCa2qDsbjnMUSTweG8pRrH5gtuyiK3Z";

    public SmsService(RoomRepository repository) {
        this.repository = repository;
    }

    public java.time.LocalDateTime getLastReminderSent() {
        return lastReminderSent;
    }

    public void setLastReminderSent(java.time.LocalDateTime lastReminderSent) {
        this.lastReminderSent = lastReminderSent;
    }

    // Inside SmsService.java
    // @Scheduled(cron = "0 0 9 5 * ?")
    @Scheduled(cron = "0 27 16 * * *")
    public void sendAutomaticReminders() {
        List<Room> rooms = repository.findAll();
        System.out.println("🔍 Checking " + rooms.size() + " rooms for reminders...");

        for (Room room : rooms) {
            if (Boolean.TRUE.equals(room.getIsOccupied()) && room.getTenantPhone() != null) {
                try {
                    String message = "LIG-941: Rent for Unit " + room.getUnitNumber() +
                            " (Rs." + room.getMonthlyRent() + ") is due. Please clear by 10th.";

                    // CRITICAL: You must call the sendSms method here!
                    sendSms(room.getTenantPhone(), message);

                    room.setLastReminderSent(java.time.LocalDateTime.now());
                    repository.save(room);
                    System.out.println("✅ Success for Unit " + room.getUnitNumber());
                } catch (Exception e) {
                    System.out.println("❌ Error sending to " + room.getUnitNumber() + ": " + e.getMessage());
                }
            }
        }
    }

    private void sendSms(String phoneNumber, String message) throws Exception {
        // 1. CLEAN THE NUMBER: Remove '+' and any spaces
        String cleanNumber = phoneNumber.replace("+", "").replace(" ", "").trim();

        // 2. BUILD THE URL
        String urlString = "https://www.fast2sms.com/dev/bulkV2?authorization=" + API_KEY +
                "&route=q" +
                "&message=" + URLEncoder.encode(message, "UTF-8") +
                "&flash=0&numbers=" + cleanNumber;

        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");

        int responseCode = conn.getResponseCode();
        if (responseCode == 200) {
            System.out.println("✅ Quick SMS triggered for " + cleanNumber);
        } else {
            // This will help us see exactly what Fast2SMS is complaining about
            System.out.println("❌ Fast2SMS rejected the request. Code: " + responseCode);
            if (responseCode == 400) {
                System.out
                        .println("👉 Hint: Check if the number " + cleanNumber + " is valid for your Fast2SMS route.");
            }
        }
    }
}