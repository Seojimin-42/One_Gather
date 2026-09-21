package com.capstone.backend.repository;

import com.capstone.backend.entity.Note;
import com.capstone.backend.entity.ShelfIndex;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByDeletedFalseOrderByUpdatedAtDesc();
    List<Note> findByDeletedTrue();
    Optional<Note> findByShareIdAndSharedTrueAndDeletedFalse(String shareId);
    List<Note> findByShelfIndex(ShelfIndex shelfIndex);

    long countByCoverImagePublicId(String coverImagePublicId);
}
