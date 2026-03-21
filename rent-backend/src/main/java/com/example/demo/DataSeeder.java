package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoomRepository repository;

    public DataSeeder(RoomRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        // We no longer hardcode rooms here.
        // The database will now only contain what the Owner adds via the Dashboard.
        System.out.println("🚀 NoMadNest Backend is Ready.");
        System.out.println("ℹ️ Total Rooms in Database: " + repository.count());
    }
}