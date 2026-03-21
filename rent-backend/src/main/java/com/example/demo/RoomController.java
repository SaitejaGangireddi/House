package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@CrossOrigin(origins = "*")// Allows your Codespace frontend to communicate with Render backend
public class RoomController {

    private final RoomRepository roomRepository;
    private final SmsService smsService;

    // Standard Constructor Injection (Recommended way)
    public RoomController(RoomRepository roomRepository, SmsService smsService) {
        this.roomRepository = roomRepository;
        this.smsService = smsService;
    }

    /**
     * 1. GET: Fetch rooms for a specific building and owner
     * This ensures Hostel A doesn't see Hostel B's rooms.
     */
    @GetMapping("/owner/{email}/house/{houseId}")
    public List<Room> getHouseRooms(@PathVariable String email, @PathVariable String houseId) {
        return roomRepository.findByOwnerEmailAndHouseId(email, houseId);
    }


    /**
 * NEW: Fetch ALL units for a specific owner across all houses.
 * Required for the Tenant Login/Access Gateway.
 */
@GetMapping("/owner/{email}")
public List<Room> getAllUnitsByOwner(@PathVariable String email) {
    // Make sure findByOwnerEmail is defined in your RoomRepository interface
    return roomRepository.findByOwnerEmail(email);
}

    /**
     * 2. POST: Create a NEW Unit
     * Forces the unit to be attached to the current active house.
     */
    @PostMapping
    public ResponseEntity<Room> createUnit(@RequestBody Room newRoom) {
        // Validation: Ensure we aren't saving a room without a house!
        if (newRoom.getHouseId() == null || newRoom.getHouseId().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (newRoom.getIsOccupied() == null) {
            newRoom.setIsOccupied(false);
        }

        Room savedRoom = roomRepository.save(newRoom);
        System.out.println("🏠 Saved Unit " + savedRoom.getUnitNumber() + " to House: " + savedRoom.getHouseId());
        return ResponseEntity.ok(savedRoom);
    }

    /**
     * 3. PUT: Update Unit Details
     * Manages Tenant info and auto-calculates Occupancy status.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Room> updateUnit(@PathVariable Long id, @RequestBody Room updatedData) {
        return roomRepository.findById(id)
                .map(room -> {
                    room.setTenantName(updatedData.getTenantName());
                    room.setTenantPhone(updatedData.getTenantPhone());
                    room.setMonthlyRent(updatedData.getMonthlyRent());

                    // Logic: If a name is present, mark as occupied
                    boolean hasTenant = updatedData.getTenantName() != null
                            && !updatedData.getTenantName().trim().isEmpty();
                    room.setIsOccupied(hasTenant);

                    return ResponseEntity.ok(roomRepository.save(room));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 4. POST: Trigger SMS Reminder
     * FIXED: Removed redundant /api/units from path.
     * Now reachable at: POST /api/units/{id}/sms
     */
    @PostMapping("/{id}/sms")
    public ResponseEntity<?> triggerManualSms(@PathVariable Long id) {
        try {
            // Convert the Long ID back to String because your Service currently expects
            // String
            smsService.sendManualReminder(String.valueOf(id));
            return ResponseEntity.ok().body("{\"status\": \"SMS Sent Successfully\"}");
        } catch (Exception e) {
            // This catches the "unreported exception" error
            return ResponseEntity.internalServerError().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * 5. DELETE: Remove a Unit
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUnit(@PathVariable Long id) {
        return roomRepository.findById(id)
                .map(room -> {
                    roomRepository.delete(room);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 6. GET ALL (Legacy/Internal use)
     */
    @GetMapping
    public List<Room> getAllUnits() {
        return roomRepository.findAll();
    }

    /**
     * 7. DELETE: Remove an entire Hostel and all its units
     * URL: DELETE /api/units/house/{houseId}
     * This version performs a bulk delete directly in the database.
     */
    @DeleteMapping("/house/{houseId}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteEntireHostel(@PathVariable String houseId) {
        try {
            // Check if units exist first for logging purposes
            long count = roomRepository.findAll().stream()
                    .filter(r -> r.getHouseId().equals(houseId))
                    .count();

            if (count == 0) {
                System.out.println("⚠️ No units found in database for hostel: " + houseId);
            } else {
                // Perform the wipe
                roomRepository.deleteByHouseId(houseId);
                System.out.println("🗑️ Database Purged: Removed " + count + " units for " + houseId);
            }

            return ResponseEntity.ok().body("{\"message\": \"Database Purged Successfully\"}");
        } catch (Exception e) {
            System.err.println("❌ Database Wipe Failed: " + e.getMessage());
            return ResponseEntity.internalServerError().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }
}