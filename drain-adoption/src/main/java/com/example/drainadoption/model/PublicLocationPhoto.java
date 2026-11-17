package com.example.drainadoption.model;

import jakarta.persistence.*;

@Entity
public class PublicLocationPhoto {
    @Id private Long id;
    @Column(nullable=false,columnDefinition="bytea") private byte[] bytes;
    protected PublicLocationPhoto() {}
    public PublicLocationPhoto(Long id, byte[] bytes) { this.id=id; this.bytes=bytes; }
    public byte[] bytes() { return bytes; }
}
