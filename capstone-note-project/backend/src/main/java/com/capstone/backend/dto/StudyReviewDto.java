package com.capstone.backend.dto;

import lombok.Data;

import java.util.List;

@Data
public class StudyReviewDto {
    private List<String> keywords;
    private List<String> keyPoints;
    private List<String> questions;
}
