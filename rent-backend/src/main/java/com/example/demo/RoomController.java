package com.example.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/units")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {RequestMethod.GET, RequestMethod.POST})
public class RoomController {

    private final RoomRepository roomRepository;

    public RoomController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    /**
     * GET: Fetch all 5 units for the Grand Dashboard
     */

    @GetMapping
    public List<Room> getAllUnits() {
        return roomRepository.findAll();
    }


    @GetMapping("/{id}")
public Room getRoomById(@PathVariable Long id) {
    return roomRepository.findById(id).orElse(null);
}




    /**
     * PUT: Update rent status (to be used when clicking "Open Record")
     */
    @PutMapping("/{id}/occupancy")
    public ResponseEntity<Room> toggleOccupancy(@PathVariable Long id) {
        return roomRepository.findById(id)
            .map(room -> {
                room.setIsOccupied(!room.getIsOccupied());
                return ResponseEntity.ok(roomRepository.save(room));
            })
            .orElse(ResponseEntity.notFound().build());
    }
}