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
    public NoteResponseDto createNote(@RequestBody NoteRequestDto requestDto) {
        return noteService.createNote(requestDto);
    }

    @GetMapping
    public List<NoteResponseDto> getNotes() {
        return noteService.getAllNotes();
    }

    @GetMapping("/{id}")
    public NoteResponseDto getNoteById(@PathVariable("id") Long id) {
        return noteService.getNoteById(id);
    }

    @PutMapping("/{id}")
    public NoteResponseDto updateNote(@PathVariable("id") Long id,
                                      @RequestBody NoteRequestDto requestDto) {
        return noteService.updateNote(id, requestDto);
    }

    @PostMapping("/{id}/view")
    public void updateViewInfo(
            @PathVariable("id") Long id,
            @RequestBody ViewPageRequestDto requestDto
    ) {
        noteService.updateViewInfo(id, requestDto.getPage());
    }

    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable("id") Long id) {
        noteService.deleteNote(id);
    }

    @GetMapping("/trash")
    public List<NoteResponseDto> getDeletedNotes() {
        return noteService.getDeletedNotes();
    }

    @PutMapping("/{id}/restore")
    public NoteResponseDto restoreNote(@PathVariable("id") Long id) {
        return noteService.restoreNote(id);
    }

    @DeleteMapping("/{id}/permanent")
    public void permanentlyDeleteNote(@PathVariable("id") Long id) {
        noteService.permanentlyDeleteNote(id);
    }

    @DeleteMapping("/trash/all")
    public void permanentlyDeleteAllTrashNotes() {
        noteService.permanentlyDeleteAllTrashNotes();
    }

    // 공유 링크 생성
    @PostMapping("/{id}/share")
    public Map<String, String> createShareLink(@PathVariable("id") Long id) {
        String shareId = noteService.createShareLink(id);
        return Map.of("shareId", shareId);
    }

    // 공유 노트 읽기
    @GetMapping("/shared/{shareId}")
    public NoteResponseDto getSharedNote(@PathVariable String shareId) {
        return noteService.getSharedNote(shareId);
    }

    // 공유 해제
    @DeleteMapping("/{id}/share")
    public void disableShare(@PathVariable("id") Long id) {
        noteService.disableShare(id);
    }

    @PutMapping("/{id}/shelf-index")
    public NoteResponseDto updateNoteShelfIndex(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Long> body) {
        Long shelfIndexId = body.get("shelfIndexId");  // null 허용
        return noteService.updateNoteShelfIndex(id, shelfIndexId);
    }

    // 노트 복제 (사본 만들기)
    @PostMapping("/{id}/duplicate")
    public NoteResponseDto duplicateNote(
            @PathVariable("id") Long id,
            @RequestBody Map<String, Long> body) {
        Long targetShelfIndexId = body.get("shelfIndexId");  // null 허용 (분류 없음)
        return noteService.duplicateNote(id, targetShelfIndexId);
    }
}
