package com.example.drainadoption.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name="observation_report_photos")
public class ReportPhoto {
    @Id private String reportId;
    @Column(nullable=false,columnDefinition="bytea") private byte[] bytes;

    protected ReportPhoto() {}
    public ReportPhoto(String reportId, byte[] bytes) {
        this.reportId=reportId;
        this.bytes=bytes;
    }
    public byte[] bytes() { return bytes; }
}
