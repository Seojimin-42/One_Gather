package com.capstone.backend.repository;

import com.capstone.backend.entity.Note;
import com.capstone.backend.entity.ShelfIndex;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NoteRepository extends JpaRepository<Note, Long> {

    // 로그인 사용자의 일반 노트
    List<Note> findByUser_IdAndDeletedFalseOrderByUpdatedAtDesc(Long userId);

    // 로그인 사용자의 휴지통
    List<Note> findByUser_IdAndDeletedTrue(Long userId);

    // 특정 사용자의 특정 노트
    Optional<Note> findByIdAndUser_Id(Long noteId, Long userId);

    // 전체 휴지통 조회 - 자동 30일 삭제용
    List<Note> findByDeletedTrue();

    // 공유 노트
    Optional<Note> findByShareIdAndSharedTrueAndDeletedFalse(String shareId);

    List<Note> findByShelfIndex(ShelfIndex shelfIndex);

    long countByCoverImagePublicId(String coverImagePublicId);
}
