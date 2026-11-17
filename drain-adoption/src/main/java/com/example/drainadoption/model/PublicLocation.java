package com.example.drainadoption.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Getter @Setter
public class PublicLocation {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable=false,length=120) private String name;
    @Column(nullable=false,length=120) private String nameFi;
    @Column(nullable=false,length=1200) private String description;
    @Column(nullable=false,length=1200) private String descriptionFi;
    @Enumerated(EnumType.STRING) @Column(nullable=false) private Kind kind;
    @Column(nullable=false) private LocalDate observedOn;
    private double latitude;
    private double longitude;
    private boolean published;
    private boolean hasPhoto;

    public enum Kind { DRAIN, BLOCKED_DRAIN, STANDING_WATER, DAMAGED_DRAIN, OTHER }
}
