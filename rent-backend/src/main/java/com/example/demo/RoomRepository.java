package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    /**
     * 1. The Core Dashboard Query
     * Fetches all units for a specific building belonging to a specific owner.
     * This ensures 'lig-941' rooms stay separate from 'kphb-501' rooms.
     */
    List<Room> findByOwnerEmailAndHouseId(String ownerEmail, String houseId);

    /**
     * 2. Targeted Unit Lookup
     * Finds a specific room within a specific house.
     * Essential for updating or deleting a specific unit without affecting others.
     */
    Optional<Room> findByUnitNumberAndHouseId(String unitNumber, String houseId);

    List<Room> findByHouseId(String houseId);

    /**
     * 3. Portfolio Overview
     * Returns every room across all properties owned by this user.
     */
    List<Room> findByOwnerEmail(String ownerEmail);

    /**
     * 4. Duplicate Prevention Check
     * Returns true if a unit number already exists in a specific house.
     * Useful for validation before saving a new unit.
     */
    boolean existsByUnitNumberAndHouseId(String unitNumber, String houseId);

    @Transactional
    @Modifying
    void deleteByHouseId(String houseId);
}