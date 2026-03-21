package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HouseRepository extends JpaRepository<House, String> {
    List<House> findByOwnerEmail(String ownerEmail);
}