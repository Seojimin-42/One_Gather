package com.capstone.backend.dto;

import lombok.Getter;
import lombok.Setter;

// 페이지 번호 전달용
@Getter
@Setter
public class ViewPageRequestDto {
    private Integer page;
}