package com.capstone.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoteTextOverlayDto {
    private Long id;
    private Double x;
    private Double y;
    private Double width;
    private String html;
}
