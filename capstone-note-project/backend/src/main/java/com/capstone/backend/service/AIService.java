package com.capstone.backend.service;

import com.capstone.backend.dto.StudyReviewDto;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AIService {

    private ChatClient chatClient;
    private VectorStore vectorStore;

    public AIService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore){
        this.chatClient = chatClientBuilder.build();
        this.vectorStore = vectorStore;
    }

    public Flux<String> generateStreamText(String question, String role, String noteContent) {

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

    // 단계적 분석 + bean 고수준 구조화 출력
    public StudyReviewDto beanOutput(String noteContent) {

        String strPrompt = """
                다음 학습 노트를 복습용으로 정리해줘.
                
                다음 항목으로 만들어:
                1. 핵심 주제를 파악해.
                2. 중요한 키워드를 찾아.
                3. 복습에 도움이 되는 질문을 만들어.
                
                단순 요약은 하지 말고,
                사용자가 학습 내용을 다시 확인할 수 있도록 구성해.
                
                반드시 제공된 노트 내용만 기준으로 분석하고,
                노트에 없는 내용은 임의로 추가하지 마.
                
                [노트 시작]
                %s
                [노트 끝]
                """.formatted(noteContent);

        return chatClient
                .prompt()
                .user(strPrompt)
                .options(OpenAiChatOptions.builder()
                        .temperature(0.1)
                        .maxTokens(1000))
                .call()
                .entity(StudyReviewDto.class);
    }

    // 임베딩과 벡터 저장소
    public Flux<String> generateAllNotesStreamText(String question, String role, Long userId) {

        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(question)
                        .topK(5)
                        .filterExpression("userId == " + userId)
                        .build()
        );

        String context = documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n"));

        if(context.isBlank()) {
            return Flux.just(
                    "질문과 관련된 내용을 저장된 노트에서 찾지 못했습니다."
            );
        }

        SystemPromptTemplate systemPromptTemplate =
                new SystemPromptTemplate("""
                        너는 One Gather의 AI 학습 도우미야.
                        
                        현재 역할은 {role}이야.
                        
                        다음은 사용자의 학습 노트에서
                        질문과 관련된 내용을 검색한 결과야.
                        
                        [검색된 노트 시작]
                        {context}
                        [검색된 노트 끝]
                        
                        반드시 검색된 노트 내용을 기준으로 답변해.
                        검색된 내용에 없는 내용은 임의로 지어내지 마.
                        사용자가 이해하기 쉽게 핵심 내용을 중심으로 설명해줘.
                        """);

        String systemPrompt = systemPromptTemplate.render(
                Map.of("role", role, "context", context)
        );

        return chatClient.prompt()
                .system(systemPrompt)
                .user(question)
                .options(OpenAiChatOptions.builder()
                        .temperature(0.3)
                        .maxTokens(1000))
                .stream()
                .content();
    }
}
