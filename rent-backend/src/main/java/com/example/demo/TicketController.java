package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@CrossOrigin(origins = "*")
public class TicketController {
    @Autowired private TicketRepository ticketRepository;

    @GetMapping("/house/{houseId}")
    public List<Ticket> getTicketsByHouse(@PathVariable String houseId) {
        return ticketRepository.findByHouseId(houseId);
    }

    @PostMapping
    public Ticket raiseTicket(@RequestBody Ticket ticket) {
        return ticketRepository.save(ticket);
    }

    @DeleteMapping("/{id}")
    public void resolveTicket(@PathVariable Long id) {
        ticketRepository.deleteById(id);
    }
}