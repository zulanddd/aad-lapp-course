package com.example.drainadoption.model;

import jakarta.persistence.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"adopter_id", "location_id"}),
       indexes = @Index(columnList = "location_id"))
public class PublicLocationAdoption {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "adopter_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User adopter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_id", nullable = false)
    private PublicLocation location;

    protected PublicLocationAdoption() {}

    public PublicLocationAdoption(User adopter, PublicLocation location) {
        this.adopter = adopter;
        this.location = location;
    }
}
