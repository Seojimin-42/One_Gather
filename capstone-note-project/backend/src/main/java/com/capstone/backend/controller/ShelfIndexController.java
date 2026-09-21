package com.capstone.backend.controller;

import com.capstone.backend.dto.ShelfIndexRequestDto;
import com.capstone.backend.dto.ShelfIndexResponseDto;
import com.capstone.backend.service.ShelfIndexService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/shelf-indexes")
@RequiredArgsConstructor
public class ShelfIndexController {

    private final ShelfIndexService shelfIndexService;

    @GetMapping
    public List<ShelfIndexResponseDto> getAllShelfIndexes() {
        return shelfIndexService.getAllShelfIndexes();
    }

    @PostMapping
    public ShelfIndexResponseDto createShelfIndex(@RequestBody ShelfIndexRequestDto dto) {
        return shelfIndexService.createShelfIndex(dto);
    }

    @DeleteMapping("/{id}")
    public void deleteShelfIndex(@PathVariable("id") Long id) {
        shelfIndexService.deleteShelfIndex(id);
    }
}