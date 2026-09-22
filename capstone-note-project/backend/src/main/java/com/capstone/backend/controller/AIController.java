package com.capstone.backend.controller;

import com.capstone.backend.service.AIService;
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

    @PostMapping("/chat-stream-model")
    public Flux<String> chatStreamModel(String question){
        return aiService.generateStreamText(question);
    }
}
