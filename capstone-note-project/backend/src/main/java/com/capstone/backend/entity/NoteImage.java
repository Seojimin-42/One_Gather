package com.capstone.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_images")
@Getter
@Setter
public class NoteImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 500, nullable = false)
    private String imageUrl;

    @Column(length = 500, nullable = false)
    private String storagePath;

    @Column(length = 255)
    private String fileName;

    private Integer sortOrder;

    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "note_id", nullable = false)
    private Note note;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();

        if(this.sortOrder == null) {
            this.sortOrder = 0;
        }
    }
}