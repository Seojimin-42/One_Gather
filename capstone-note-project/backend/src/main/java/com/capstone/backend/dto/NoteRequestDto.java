package com.capstone.backend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter @Setter
public class NoteRequestDto {
    private String title;
    private String contentHtml;
    private String templateId;
    private Long shelfIndexId;

    private String coverImageUrl;
    private String coverStoragePath;
    private String coverImagePublicId;

    private Boolean removeCoverImage;

    private String coverColor;
    private Integer coverOpacity;
    private Boolean titleHidden;
    private Integer lastEditedPage;

    private List<NotePageDto> pages;
}
