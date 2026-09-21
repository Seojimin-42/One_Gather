package com.capstone.backend.service;

import com.capstone.backend.dto.ShelfIndexRequestDto;
import com.capstone.backend.dto.ShelfIndexResponseDto;
import com.capstone.backend.entity.Note;
import com.capstone.backend.entity.ShelfIndex;
import com.capstone.backend.repository.NoteRepository;
import com.capstone.backend.repository.ShelfIndexRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ShelfIndexService {

    private final ShelfIndexRepository shelfIndexRepository;
    private final NoteRepository noteRepository;

    public List<ShelfIndexResponseDto> getAllShelfIndexes() {
        return shelfIndexRepository.findAll().stream()
                .map(ShelfIndexResponseDto::new)
                .toList();
    }

    public ShelfIndexResponseDto createShelfIndex(ShelfIndexRequestDto dto) {
        String name = dto.getName().trim();

        if (name.isEmpty()) {
            throw new IllegalArgumentException("인덱스 이름이 비어있습니다.");
        }
        if (shelfIndexRepository.existsByName(name)) {
            throw new IllegalArgumentException("이미 존재하는 인덱스 이름입니다.");
        }

        ShelfIndex shelfIndex = new ShelfIndex();
        shelfIndex.setName(name);

        ShelfIndex saved = shelfIndexRepository.save(shelfIndex);
        return new ShelfIndexResponseDto(saved);
    }

    @Transactional
    public void deleteShelfIndex(Long id) {
        ShelfIndex shelfIndex = shelfIndexRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 인덱스가 없습니다. id=" + id));

        // 이 인덱스를 사용하던 노트들의 shelf_index를 null로 변경
        List<Note> affectedNotes = noteRepository.findByShelfIndex(shelfIndex);
        for (Note note : affectedNotes) {
            note.setShelfIndex(null);
        }

        shelfIndexRepository.delete(shelfIndex);
    }
}