package com.capstone.backend.controller;

import com.capstone.backend.dto.StudyReviewDto;
import com.capstone.backend.service.AIService;
import com.capstone.backend.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/ai")
public class AIController {
    @Autowired
    private AIService aiService;

    @Autowired
    private NoteService noteService;

    @PostMapping("/chat-stream-model")
    public Flux<String> chatStreamModel(String question, String role, String noteContent){
        return aiService.generateStreamText(question, role, noteContent);
    }

    @PostMapping("/review-note")
    public StudyReviewDto reviewNote(String noteContent) {
        return aiService.beanOutput(noteContent);
    }

    @PostMapping("/chat-all-notes")
    public Flux<String> chatAllNotes(String question, String role, Long userId) {
        return aiService.generateAllNotesStreamText(question, role, userId);
    }

    @PostMapping("/index-notes")
    public void indexNotes(Long userId) {
        noteService.indexExistingNotes(userId);
    }
}
