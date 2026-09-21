package com.capstone.backend.dto;

import com.capstone.backend.entity.ShelfIndex;
import lombok.Getter;

@Getter
public class ShelfIndexResponseDto {
    private final Long id;
    private final String name;

    public ShelfIndexResponseDto(ShelfIndex shelfIndex) {
        this.id = shelfIndex.getId();
        this.name = shelfIndex.getName();
    }
}