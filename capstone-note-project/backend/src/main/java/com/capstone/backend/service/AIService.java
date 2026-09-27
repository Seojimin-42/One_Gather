package com.capstone.backend.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.Map;

@Service
public class AIService {

    private ChatClient chatClient;

    public AIService(ChatClient.Builder chatClientBuilder){
        this.chatClient = chatClientBuilder.build();
    }

    public Flux<String> generateStreamText(String question, String role, String noteContent) {

//        System.out.println("question = " + question);
//        System.out.println("role = " + role);
//        System.out.println("noteContent = " + noteContent);

        SystemPromptTemplate systemTemplate =
                new SystemPromptTemplate("""
                            너는 One Gather의 AI 학습 도우미야.
                            
                            현재 역할은 {role}이야.
                            
                            다음은 사용자가 현재 보고 있는 실제 노트 내용이야.
                            
                            [노트 시작]
                            {noteContent}
                            [노트 끝]
                            
                            반드시 위 노트 내용을 기준으로 답변해.
                            노트에 없는 내용은 임의로 지어내지 마.
                            추상적인 답변이나 추측은 삼가해줘.
                            
                            사용자의 요청에 친절하고 이해하기 쉽게 답변하고,
                            너무 장황하지 않게 핵심 내용을 중심으로 설명해줘.
                        """);
        
        String systemPrompt = systemTemplate.render(
                Map.of("role", role, "noteContent", noteContent)
        );

        return this.chatClient.prompt()
                .system(systemPrompt)
                .user(question)
                .options(OpenAiChatOptions.builder()
                        .temperature(0.3)
                        .maxTokens(1000))
                .stream()
                .content();
    }
}
