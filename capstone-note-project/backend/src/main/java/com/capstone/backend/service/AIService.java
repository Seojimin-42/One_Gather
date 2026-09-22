package com.capstone.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class AIService {

    private ChatClient chatClient;

    public AIService(ChatClient.Builder chatClientBuilder){
        this.chatClient = chatClientBuilder.build();
    }

    public Flux<String> generateStreamText(String question) {
        return this.chatClient.prompt()
                .system("""
                        너는 One Gather의 AI 학습 도우미야.
                        사용자의 학습 질문에 친절하고 이해하기 쉽고 간단하게 답변해줘.
                        너무 장황하지 않게 핵심 내용을 중심으로 설명해줘.
                        """)
                .user(question)
                .options(OpenAiChatOptions.builder()
                        .temperature(0.3)
                        .maxTokens(1000))
                .stream()
                .content();
    }
}
