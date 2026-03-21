package com.example.demo;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "houses")
public class House {
    @Id
    private String id; // This is your Global Tracking ID (e.g., 'godavari')
    private String name;
    private String password;
    private String ownerEmail; // The primary admin email (saitejagangireddi@gmail.com)

    public House() {}

    public House(String id, String name, String password, String ownerEmail) {
        this.id = id;
        this.name = name;
        this.password = password;
        this.ownerEmail = ownerEmail;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }
}