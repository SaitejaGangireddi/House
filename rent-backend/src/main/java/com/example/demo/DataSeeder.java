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
        // Only seeds if the Aiven database is empty
        if (repository.count() == 0) {
            
            // 1. Ground Floor - Shutter (Vacant by default)
            saveRoom("Shutter", "GROUND", "COMMERCIAL", 15000, false, null, null);
            
            // 2. First Floor - Rooms (Vacant by default)
            saveRoom("101", "FIRST", "RESIDENTIAL", 12000, false, null, null);
            saveRoom("102", "FIRST", "RESIDENTIAL", 12000, false, null, null);
            
            // 3. Second Floor - Saiteja (Occupied)
            saveRoom("201", "SECOND", "RESIDENTIAL", 10000, true, "Saiteja", "917989919631");
            
            System.out.println("✅ LIG-941 Database seeded successfully.");
        }
    }

    private void saveRoom(String num, String floor, String type, int rent, boolean occupied, String name, String phone) {
        Room room = new Room();
        room.setUnitNumber(num);
        room.setFloor(floor);
        room.setUnitType(type);
        room.setMonthlyRent(rent);
        room.setIsOccupied(occupied); // The important field
        room.setTenantName(name);     // New field
        room.setTenantPhone(phone);   // New field
        
        repository.save(room);
    }
}