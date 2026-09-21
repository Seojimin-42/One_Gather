package com.capstone.backend.service;

import com.capstone.backend.entity.NoteImage;
import com.capstone.backend.repository.NoteImageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NoteImageService {

    private final NoteImageRepository noteImageRepository;

    public List<NoteImage> getImageByNoteId(Long noteId) {
        return noteImageRepository.findByNoteId(noteId);
    }

}
