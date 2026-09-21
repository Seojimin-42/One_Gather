package com.capstone.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
@Getter
@Setter
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(nullable = false)
    private boolean deleted = false;

    @Column(length = 500)
    private String coverImageUrl;

    @Column(length = 500)
    private String coverStoragePath;

    @Column(length = 20)
    private String coverColor = "#3E4A3E";

    private Integer coverOpacity = 100;

    @Column(nullable = false)
    private Boolean titleHidden = false;

    @Column(length = 500)
    private String coverImagePublicId;

    @Column(length = 100, unique = true)
    private String shareId;

    @Column(nullable = false)
    private Boolean shared = false;

    @Column(name = "pages_json", columnDefinition = "LONGTEXT")
    private String pagesJson;

    @Column(name = "template_id", length = 20)
    private String templateId = "note1";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deletedAt;
    private LocalDateTime lastViewedAt;
    private Integer lastViewedPage;
    private Integer lastEditedPage;

    @PrePersist // DB에 처음 저장되기 직전 실행
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate // 기존 데이터를 수정하기 직전 실행
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shelf_index_id", nullable = true)
    private ShelfIndex shelfIndex;
}
