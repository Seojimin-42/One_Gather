package com.capstone.backend.controller;

import com.capstone.backend.entity.Note;
import com.capstone.backend.repository.NoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@RestController
@RequestMapping("/notes") // 공통 경로
public class NoteController {

    private final NoteRepository noteRepository;

    public NoteController(NoteRepository noteRepository) {
        this.noteRepository = noteRepository;
    }

    @PostMapping
    public Note createNote(@RequestBody Note note) {
        return noteRepository.save(note);
    }

    @GetMapping
    public List<Note> getNotes() {
        return noteRepository.findAll();
    }

    @GetMapping("/{id}")
    public Note getNoteById(@PathVariable("id") Long id) {
        return noteRepository.findById(id).orElse(null);
    }

    @PutMapping("/{id}")
    public Note updateNote(@PathVariable("id") Long id, @RequestBody Note updatedNote) {
        Note note = noteRepository.findById(id).orElse(null);

        if (note == null) {
            return null;
        }

        note.setTitle(updatedNote.getTitle());
        note.setContent(updatedNote.getContent());

        return noteRepository.save(note);
    }

    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable("id") Long id) {
        noteRepository.deleteById(id);
    }
}
