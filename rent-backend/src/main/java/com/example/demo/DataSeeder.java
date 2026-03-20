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
    // Remove the "if repository.count() == 0" check so this runs every time you deploy
    
    // Updated values
    saveOrUpdateRoom("Shutter", "GROUND", "COMMERCIAL", 5000, false, null, null);
    saveOrUpdateRoom("101", "FIRST", "RESIDENTIAL", 5000, false, null, null);
    saveOrUpdateRoom("102", "FIRST", "RESIDENTIAL", 5000, false, null, null);
    saveOrUpdateRoom("201", "SECOND", "RESIDENTIAL", 12000, true, "Saiteja", "917989919631");
    
    System.out.println("✅ Database updated with new rental values.");
}

private void saveOrUpdateRoom(String num, String floor, String type, int rent, boolean occupied, String name, String phone) {
    // 1. Try to find the room by its Unit Number
    Room room = repository.findByUnitNumber(num).orElse(new Room());
    
    // 2. Set all the values (this will overwrite the old rent with the new one)
    room.setUnitNumber(num);
    room.setFloor(floor);
    room.setUnitType(type);
    room.setMonthlyRent(rent); 
    room.setIsOccupied(occupied);
    room.setTenantName(name);
    room.setTenantPhone(phone);
    
    // 3. Save it - Spring JPA is smart enough to UPDATE if it exists, or INSERT if it's new
    repository.save(room);
}
}