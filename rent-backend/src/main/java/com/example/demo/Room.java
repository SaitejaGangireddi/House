package com.example.demo;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "units")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unit_number", nullable = false)
    private String unitNumber;

    @Column(name = "floor")
    private String floor;

    @Column(name = "monthly_rent")
    private Integer monthlyRent;

    @Column(name = "is_occupied")
    private Boolean isOccupied = false;

    @Column(name = "tenant_name")
    private String tenantName;

    @Column(name = "tenant_phone")
    private String tenantPhone;

    @Column(name = "last_reminder_sent")
    private LocalDateTime lastReminderSent;

    @Column(name = "owner_email", nullable = false)
    private String ownerEmail;

    @Column(name = "house_id", nullable = false)
    private String houseId;

    @Column(name = "house_name")
    private String houseName;

    // --- REMINDER METHODS ---
    public LocalDateTime getLastReminderSent() {
        return lastReminderSent;
    }

    public void setLastReminderSent(LocalDateTime lastReminderSent) {
        this.lastReminderSent = lastReminderSent;
    }

    // --- CONSTRUCTORS ---
    public Room() {}

    // --- GETTERS & SETTERS (Essential for JSON Mapping) ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUnitNumber() { return unitNumber; }
    public void setUnitNumber(String unitNumber) { this.unitNumber = unitNumber; }

    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }

    public Integer getMonthlyRent() { return monthlyRent; }
    public void setMonthlyRent(Integer monthlyRent) { this.monthlyRent = monthlyRent; }

    public Boolean getIsOccupied() { return isOccupied; }
    public void setIsOccupied(Boolean isOccupied) { this.isOccupied = isOccupied; }

    public String getTenantName() { return tenantName; }
    public void setTenantName(String tenantName) { this.tenantName = tenantName; }

    public String getTenantPhone() { return tenantPhone; }
    public void setTenantPhone(String tenantPhone) { this.tenantPhone = tenantPhone; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public String getHouseId() { return houseId; }
    public void setHouseId(String houseId) { this.houseId = houseId; }

    public String getHouseName() { return houseName; }
    public void setHouseName(String houseName) { this.houseName = houseName; }
}