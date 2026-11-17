package com.example.drainadoption.model;
import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;
@Entity @Data
public class ReportUpdate {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    private String reportId;
    private String status;
    @Column(length=2000) private String feedback;
    private Instant createdAt;
}
