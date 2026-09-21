package com.capstone.backend.service;

import com.capstone.backend.dto.NoteRequestDto;
import com.capstone.backend.dto.NoteResponseDto;
import com.capstone.backend.entity.Note;
import com.capstone.backend.entity.ShelfIndex;
import com.capstone.backend.repository.NoteRepository;
import com.capstone.backend.repository.ShelfIndexRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.scheduling.annotation.Scheduled;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;
    private final CloudinaryService cloudinaryService;
    private final ShelfIndexRepository shelfIndexRepository;

    // DB에서 노트 전체 조회
    public List<NoteResponseDto> getAllNotes() {
        return noteRepository.findByDeletedFalseOrderByUpdatedAtDesc().stream()
                .map(NoteResponseDto::new)
                .toList();
    }

    // 특정 id의 노트 1개 조회, 없으면 예외 발생
    public NoteResponseDto getNoteById(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        if(note.isDeleted()){
            throw new IllegalArgumentException("휴지통에 있는 노트입니다. id=" + id);
        }

        return new NoteResponseDto(note);
    }

    // 프론트에서 받은 제목, 내용을 새 엔티티에 넣고 DB 저장 후 결과 반환
    public NoteResponseDto createNote(NoteRequestDto requestDto) {
        Note note = new Note();
        note.setTitle(requestDto.getTitle());
        note.setContent(requestDto.getContentHtml());
        note.setTemplateId(requestDto.getTemplateId());
        note.setPagesJson(serializePages(requestDto));

        note.setCoverImageUrl(requestDto.getCoverImageUrl());
        note.setCoverStoragePath(requestDto.getCoverStoragePath());

        note.setCoverColor(
                requestDto.getCoverColor() != null ? requestDto.getCoverColor() : "#3E4A3E"
        );

        note.setCoverOpacity(
                requestDto.getCoverOpacity() != null ? requestDto.getCoverOpacity() : 100
        );

        note.setCoverImagePublicId(requestDto.getCoverImagePublicId());

        note.setTitleHidden(
                requestDto.getTitleHidden() != null ? requestDto.getTitleHidden() : false
        );

        Note savedNote = noteRepository.save(note);
        return new NoteResponseDto(savedNote);
    }

    // id로 기존 노트 찾고 제목, 내용 변경 후 다시 저장
    public NoteResponseDto updateNote(Long id, NoteRequestDto requestDto) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        String oldPublicId = note.getCoverImagePublicId();
        String newPublicId = requestDto.getCoverImagePublicId();

        boolean removeCoverImage =
                Boolean.TRUE.equals(requestDto.getRemoveCoverImage());

        boolean hasNewCoverImage =
                requestDto.getCoverImageUrl() != null ||
                        requestDto.getCoverImagePublicId() != null;

        // 사용자가 표지 이미지를 명시적으로 제거한 경우
        if (removeCoverImage) {
            deleteCoverImageSafely(oldPublicId);

            note.setCoverImageUrl(null);
            note.setCoverImagePublicId(null);
            note.setCoverStoragePath(null);

        // 새로운 표지 이미지를 등록하거나 변경한 경우
        } else if (hasNewCoverImage) {
            if (oldPublicId != null && !oldPublicId.equals(newPublicId)) {
                deleteCoverImageSafely(oldPublicId);
            }

            note.setCoverImageUrl(requestDto.getCoverImageUrl());
            note.setCoverImagePublicId(newPublicId);

            if (requestDto.getCoverStoragePath() != null) {
                note.setCoverStoragePath(requestDto.getCoverStoragePath());
            }
        }

        if (requestDto.getTitle() != null) {
            note.setTitle(requestDto.getTitle());
        }

        if (requestDto.getContentHtml() != null) {
            note.setContent(requestDto.getContentHtml());
        }

        if (requestDto.getTemplateId() != null) {
            note.setTemplateId(requestDto.getTemplateId());
        }

        if (requestDto.getPages() != null) {
            note.setPagesJson(serializePages(requestDto));
        }

        if (requestDto.getCoverStoragePath() != null) {
            note.setCoverStoragePath(requestDto.getCoverStoragePath());
        }

        if (requestDto.getCoverColor() != null) {
            note.setCoverColor(requestDto.getCoverColor());
        }

        if (requestDto.getCoverOpacity() != null) {
            note.setCoverOpacity(requestDto.getCoverOpacity());
        }

        if (requestDto.getTitleHidden() != null) {
            note.setTitleHidden(requestDto.getTitleHidden());
        }

        if (requestDto.getLastEditedPage() != null) {
            note.setLastEditedPage(requestDto.getLastEditedPage());
        }

        if (requestDto.getShelfIndexId() != null) {
            ShelfIndex shelfIndex = shelfIndexRepository.findById(requestDto.getShelfIndexId())
                    .orElseThrow(() -> new IllegalArgumentException("인덱스가 없습니다."));
            note.setShelfIndex(shelfIndex);
        }

        Note updatedNote = noteRepository.save(note);
        return new NoteResponseDto(updatedNote);
    }

    // id로 노트 찾고 삭제
    public void deleteNote(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        note.setDeleted(true);
        note.setDeletedAt(LocalDateTime.now());
        noteRepository.save(note);
    }

    // 휴지통에 있는 노트 목록 조회
    public List<NoteResponseDto> getDeletedNotes() {
        return noteRepository.findByDeletedTrue().stream()
                .map(NoteResponseDto::new)
                .toList();
    }

    // 휴지통에 았는 노트 복구
    public NoteResponseDto restoreNote(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        if (note.getDeletedAt() != null) {
            LocalDateTime expireAt = note.getDeletedAt().plusDays(30);

            if (!expireAt.isAfter(LocalDateTime.now())) {
                throw new IllegalStateException("만료된 노트는 복구할 수 없습니다.");
            }
        }

        note.setDeleted(false);
        note.setDeletedAt(null);
        Note restoredNote = noteRepository.save(note);
        return new NoteResponseDto(restoredNote);
    }

    // 휴지통에서 완전 삭제
    @Transactional
    public void permanentlyDeleteNote(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        deleteCoverImageSafely(note.getCoverImagePublicId());
        noteRepository.delete(note);
    }

    // 휴지통 전체 비우기
    @Transactional
    public void permanentlyDeleteAllTrashNotes() {
        List<Note> deletedNotes = noteRepository.findByDeletedTrue();

        if (deletedNotes.isEmpty()) {
            return;
        }

        for (Note note : deletedNotes) {
            deleteCoverImageSafely(note.getCoverImagePublicId());
        }

        noteRepository.deleteAll(deletedNotes);
    }

    // Cloudinary 이미지 삭제 (null 안전 + 다른 노트가 같은 이미지를 쓰고 있으면 보존 + 외부 API 에러로 인한 트랜잭션 롤백 방지)
    private void deleteCoverImageSafely(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        // 다른 노트가 같은 이미지를 쓰고 있는지 체크
        // 이 메서드는 노트가 DB에서 삭제되기 "전"에 호출되므로,
        // count가 1보다 크면 = 자기 자신 + 다른 노트가 1개 이상 같이 쓰는 중
        long usageCount = noteRepository.countByCoverImagePublicId(publicId);
        if (usageCount > 1) {
            System.out.println("Cloudinary 이미지 보존: " + publicId + " (사용 중인 노트 " + usageCount + "개)");
            return;
        }

        try {
            cloudinaryService.deleteImage(publicId);
        } catch (Exception e) {
            // Cloudinary 실패해도 DB 삭제는 진행
            System.err.println("Cloudinary 이미지 삭제 실패: " + publicId + " - " + e.getMessage());
        }
    }

    public String createShareLink(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        if (note.getShareId() == null || note.getShareId().isBlank()) {
            note.setShareId(UUID.randomUUID().toString().replace("-", ""));
        }

        note.setShared(true);
        noteRepository.save(note);

        return note.getShareId();
    }

    public NoteResponseDto getSharedNote(String shareId) {
        Note note = noteRepository.findByShareIdAndSharedTrueAndDeletedFalse(shareId)
                .orElseThrow(() -> new IllegalArgumentException("공유된 노트를 찾을 수 없습니다."));

        return new NoteResponseDto(note);
    }

    public void disableShare(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        note.setShared(false);
        noteRepository.save(note);
    }

    public void updateLastViewedAt(Long id) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        note.setLastViewedAt(LocalDateTime.now());
        noteRepository.save(note);
    }

    public void updateViewInfo(Long id, Integer page) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("해당 노트가 없습니다. id=" + id));

        note.setLastViewedAt(LocalDateTime.now());
        note.setLastViewedPage(page != null ? page : 1);

        noteRepository.save(note);
    }

    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void autoDeleteExpiredTrashNotes() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);

        List<Note> deletedNotes = noteRepository.findByDeletedTrue();
        List<Note> expiredNotes = new ArrayList<>();

        for (Note note : deletedNotes) {
            if (note.getDeletedAt() != null && note.getDeletedAt().isBefore(cutoff)) {
                deleteCoverImageSafely(note.getCoverImagePublicId());
                expiredNotes.add(note);
            }
        }

        if (!expiredNotes.isEmpty()) {
            noteRepository.deleteAll(expiredNotes);
        }
    }

    private String serializePages(NoteRequestDto requestDto) {
        try {
            if (requestDto.getPages() == null) {
                return null;
            }

            ObjectMapper objectMapper = new ObjectMapper();
            return objectMapper.writeValueAsString(requestDto.getPages());
        } catch (Exception e) {
            throw new IllegalArgumentException("페이지 데이터를 JSON으로 변환하지 못했습니다.", e);
        }
    }

    public NoteResponseDto updateNoteShelfIndex(Long noteId, Long shelfIndexId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("노트가 없습니다."));

        if (shelfIndexId == null) {
            note.setShelfIndex(null);
        } else {
            ShelfIndex shelfIndex = shelfIndexRepository.findById(shelfIndexId)
                    .orElseThrow(() -> new IllegalArgumentException("인덱스가 없습니다."));
            note.setShelfIndex(shelfIndex);
        }

        return new NoteResponseDto(noteRepository.save(note));
    }

    // 노트 복제 (사본 만들기)
    @Transactional
    public NoteResponseDto duplicateNote(Long noteId, Long targetShelfIndexId) {
        Note original = noteRepository.findById(noteId)
                .orElseThrow(() -> new IllegalArgumentException("원본 노트가 없습니다. id=" + noteId));

        if (original.isDeleted()) {
            throw new IllegalArgumentException("휴지통에 있는 노트는 복제할 수 없습니다.");
        }

        Note copy = new Note();

        // 제목: 원본 + " (사본)"
        copy.setTitle((original.getTitle() != null ? original.getTitle() : "제목 없음") + " (사본)");

        // 본문/페이지/템플릿 복사
        copy.setContent(original.getContent());
        copy.setPagesJson(original.getPagesJson());
        copy.setTemplateId(original.getTemplateId());

        // 표지 정보 복사 (색/이미지/투명도/제목숨김)
        copy.setCoverColor(original.getCoverColor());
        copy.setCoverOpacity(original.getCoverOpacity());
        copy.setCoverImageUrl(original.getCoverImageUrl());
        copy.setCoverImagePublicId(original.getCoverImagePublicId());
        copy.setCoverStoragePath(original.getCoverStoragePath());
        copy.setTitleHidden(original.getTitleHidden());

        // 분류(shelfIndex): 요청에서 받은 값 사용
        if (targetShelfIndexId != null) {
            ShelfIndex shelfIndex = shelfIndexRepository.findById(targetShelfIndexId)
                    .orElseThrow(() -> new IllegalArgumentException("인덱스가 없습니다."));
            copy.setShelfIndex(shelfIndex);
        } else {
            copy.setShelfIndex(null);
        }

        // 공유/삭제 상태는 초기화 (사본은 새 노트로 시작)
        copy.setShared(false);
        copy.setShareId(null);
        copy.setDeleted(false);
        copy.setDeletedAt(null);
        copy.setLastViewedAt(null);

        Note saved = noteRepository.save(copy);
        return new NoteResponseDto(saved);
    }
}
