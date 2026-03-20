package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    private final RoomRepository repository;

    public DataSeeder(RoomRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        // We remove the "if count == 0" check so it updates every time the app starts
        
        // 1. Ground Floor
        saveOrUpdateRoom("Shutter", "GROUND", "COMMERCIAL", 5000, false, null, null);
        
        // 2. First Floor
        saveOrUpdateRoom("101", "FIRST", "RESIDENTIAL", 5000, false, null, null);
        saveOrUpdateRoom("102", "FIRST", "RESIDENTIAL", 5000, false, null, null);
        
        // 3. Second Floor
        saveOrUpdateRoom("201", "SECOND", "RESIDENTIAL", 12000, true, "Saiteja", "917989919631");
        
        System.out.println("✅ LIG-941 Database sync completed with updated rentals.");
    }

    private void saveOrUpdateRoom(String num, String floor, String type, int rent, boolean occupied, String name, String phone) {
        // Check if room already exists by Unit Number
        Room room = repository.findByUnitNumber(num).orElse(new Room());
        
        room.setUnitNumber(num);
        room.setFloor(floor);
        room.setUnitType(type);
        room.setMonthlyRent(rent); // Update to the new rent
        room.setIsOccupied(occupied);
        room.setTenantName(name);
        room.setTenantPhone(phone);
        
        repository.save(room);
    }
}