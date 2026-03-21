package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/houses")
@CrossOrigin(origins = "*") // Remember to lock this to Vercel later!
public class HouseController {

    @Autowired
    private HouseRepository houseRepository;

    @GetMapping("/owner/{email}")
    public List<House> getHousesByOwner(@PathVariable String email) {
        return houseRepository.findByOwnerEmail(email);
    }

    @PostMapping
    public House createHouse(@RequestBody House house) {
        return houseRepository.save(house);
    }

    @DeleteMapping("/{id}")
    public void deleteHouse(@PathVariable String id) {
        houseRepository.deleteById(id);
    }
}