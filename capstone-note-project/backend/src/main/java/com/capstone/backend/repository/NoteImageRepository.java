package com.capstone.backend.repository;

import com.capstone.backend.entity.NoteImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteImageRepository extends JpaRepository<NoteImage, Long> {
    List<NoteImage> findByNoteId(Long noteId);
}
