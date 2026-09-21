package com.capstone.backend.dto;
import com.capstone.backend.entity.Note;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
public class NoteResponseDto {
    private Long id;
    private String title;
    private String contentHtml;
    private String templateId;
    private Long shelfIndexId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastViewedAt;
    private Integer lastViewedPage;
    private Integer lastEditedPage;
    private LocalDateTime deletedAt;

    private String coverImageUrl;
    private String coverStoragePath;
    private String coverImagePublicId;
    private String coverColor;
    private Integer coverOpacity;
    private Boolean titleHidden;

    private String shareId;
    private Boolean shared;

    private List<NotePageDto> pages;

    public NoteResponseDto(Note note) {
        this.id = note.getId();
        this.title = note.getTitle();
        this.contentHtml = note.getContent();
        this.templateId = note.getTemplateId();
        this.shelfIndexId = note.getShelfIndex() != null ? note.getShelfIndex().getId() : null;

        try {
            if (note.getPagesJson() != null && !note.getPagesJson().isBlank()) {
                ObjectMapper objectMapper = new ObjectMapper();
                this.pages = objectMapper.readValue(
                        note.getPagesJson(),
                        new TypeReference<List<NotePageDto>>() {}
                );
            } else {
                this.pages = new ArrayList<>();
            }
        } catch (Exception e) {
            this.pages = new ArrayList<>();
        }

        this.createdAt = note.getCreatedAt();
        this.updatedAt = note.getUpdatedAt();
        this.deletedAt = note.getDeletedAt();

        this.lastViewedAt = note.getLastViewedAt();
        this.lastViewedPage = note.getLastViewedPage();
        this.lastEditedPage = note.getLastEditedPage();

        this.coverImageUrl = note.getCoverImageUrl();
        this.coverStoragePath = note.getCoverStoragePath();
        this.coverImagePublicId = note.getCoverImagePublicId();
        this.coverColor = note.getCoverColor();
        this.coverOpacity = note.getCoverOpacity();
        this.titleHidden = note.getTitleHidden();

        this.shareId = note.getShareId();
        this.shared = note.getShared();
    }
}