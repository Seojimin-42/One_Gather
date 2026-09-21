package com.capstone.backend.dto;

// 페이지 번호 전달용

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class NotePageDto {
    private Long id;
    private String title;
    private String contentHtml;
    private String drawingData;
    private String viewDrawingData;

    @JsonAlias("images")
    private List<Object> images = new ArrayList<>();

    private List<NoteTextOverlayDto> textOverlays = new ArrayList<>();
}
