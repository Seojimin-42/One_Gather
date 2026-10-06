package com.capstone.backend.controller;

import com.capstone.backend.dto.NoteRequestDto;
import com.capstone.backend.dto.NoteResponseDto;
import com.capstone.backend.entity.Note;
import com.capstone.backend.repository.NoteRepository;
import com.capstone.backend.service.NoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;
import com.capstone.backend.dto.ViewPageRequestDto;
import jakarta.servlet.http.HttpSession;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notes") // 공통 경로
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @PostMapping
    public NoteResponseDto createNote(@RequestBody NoteRequestDto requestDto, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }

        return noteService.createNote(requestDto, userId);
    }

    @GetMapping
    public List<NoteResponseDto> getNotes(HttpSession session) {

        Long userId = (Long) session.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }

        return noteService.getAllNotes(userId);
    }

    @GetMapping("/{id}")
    public NoteResponseDto getNoteById(@PathVariable("id") Long id, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }

        return noteService.getNoteById(id, userId);
    }

    @PutMapping("/{id}")
    public NoteResponseDto updateNote(@PathVariable("id") Long id,
                                      @RequestBody NoteRequestDto requestDto,
                                      HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return noteService.updateNote(id, userId, requestDto);
    }

    @PostMapping("/{id}/view")
    public void updateViewInfo(
            @PathVariable("id") Long id,
            @RequestBody ViewPageRequestDto requestDto,
            HttpSession httpSession
    ) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        noteService.updateViewInfo(id, requestDto.getPage(), userId);
    }

    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable("id") Long id, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        noteService.deleteNote(id, userId);
    }

    @GetMapping("/trash")
    public List<NoteResponseDto> getDeletedNotes(HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return noteService.getDeletedNotes(userId);
    }

    @PutMapping("/{id}/restore")
    public NoteResponseDto restoreNote(@PathVariable("id") Long id, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        return noteService.restoreNote(id, userId);
    }

    @DeleteMapping("/{id}/permanent")
    public void permanentlyDeleteNote(@PathVariable("id") Long id, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if(userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        noteService.permanentlyDeleteNote(id, userId);
    }

    @DeleteMapping("/trash/all")
    public void permanentlyDeleteAllTrashNotes(HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if(userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        noteService.permanentlyDeleteAllTrashNotes(userId);
    }

    // 공유 링크 생성
    @PostMapping("/{id}/share")
    public Map<String, String> createShareLink(@PathVariable("id") Long id, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        String shareId = noteService.createShareLink(id, userId);

        return Map.of("shareId", shareId);
    }

    // 공유 노트 읽기
    @GetMapping("/shared/{shareId}")
    public NoteResponseDto getSharedNote(@PathVariable String shareId) {
        return noteService.getSharedNote(shareId);
    }

    // 공유 해제
    @DeleteMapping("/{id}/share")
    public void disableShare(@PathVariable("id") Long id, HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        noteService.disableShare(id, userId);
    }

    @PutMapping("/{id}/shelf-index")
    public NoteResponseDto updateNoteShelfIndex(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Long> body,
            HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Long shelfIndexId = body.get("shelfIndexId");  // null 허용

        return noteService.updateNoteShelfIndex(id, shelfIndexId, userId);
    }

    // 노트 복제 (사본 만들기)
    @PostMapping("/{id}/duplicate")
    public NoteResponseDto duplicateNote(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Long> body,
            HttpSession httpSession) {

        Long userId = (Long) httpSession.getAttribute("loginUserId");

        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        Long targetShelfIndexId = body.get("shelfIndexId");  // null 허용 (분류 없음)

        return noteService.duplicateNote(id, targetShelfIndexId, userId);
    }
}
