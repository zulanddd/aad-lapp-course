package com.example.drainadoption.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Entity @Table(name="observation_reports") @Data
public class Report {
    @Id private String id;
    @Column(nullable=false) private String tokenHash;
    private Long drainId;
    private String location;
    private Double latitude;
    private Double longitude;
    private String issueType;
    private Instant observedAt;
    @Column(length=2000) private String description;
    private String language;
    private String photoFile;
    private Instant createdAt;
    private String status = "RECEIVED";
}
