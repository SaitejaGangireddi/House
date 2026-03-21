package com.example.demo;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Autowired;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final RoomRepository repository;
    private final SmsService smsService; // Link to your existing SMS logic

    @Autowired
    public NotificationService(RoomRepository repository, SmsService smsService) {
        this.repository = repository;
        this.smsService = smsService;
    }

    /**
     * CRON: 0 0 9 5 * ? -> 9:00 AM on the 5th of every month
     * This is the "Grand Reminder Day" for all NoMadNest properties.
     */
    @Scheduled(cron = "0 0 9 5 * ?")
    public void triggerMonthlyRentReminders() {
        System.out.println("🚀 NoMadNest Global Notification Engine: Starting Monthly Run...");
        
        // 1. Fetch every room across all owners/houses
        List<Room> allRooms = repository.findAll();

        for (Room room : allRooms) {
            // 2. Logic: Only notify if occupied and a phone number exists
            if (Boolean.TRUE.equals(room.getIsOccupied()) && room.getTenantPhone() != null) {
                try {
                    // 3. Trigger the SMS via your SmsService
                    // It will automatically use the correct House Name (LIG-941, etc.)
                    smsService.sendAutomaticReminders(); 
                    
                    System.out.println("✅ Notification sequence initiated for: " + room.getUnitNumber());
                } catch (Exception e) {
                    System.err.println("❌ Critical Failure in Notification Service for " + room.getUnitNumber() + ": " + e.getMessage());
                }
            }
        }
    }

    /**
     * Heartbeat to ensure the SaaS scheduling engine is alive
     * Runs every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    public void heartbeat() {
        long count = repository.count();
        System.out.println("💓 NoMadNest Heartbeat [" + LocalDateTime.now() + "] - Managing " + count + " units.");
    }
}