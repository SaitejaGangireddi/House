package com.example.demo;

import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

@Service
public class NotificationService {
    private final RoomRepository repository;

    public NotificationService(RoomRepository repository) {
        this.repository = repository;
    }

    @Scheduled(cron = "0 0 9 5 * ?")
    public void logStatus() {
        System.out.println("Notification Service Heartbeat: Active");
    }
}