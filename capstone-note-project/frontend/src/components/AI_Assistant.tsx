import { useState } from "react";

import AI_Character from "../assets/ai/AI_character.png";
import AI_Character_Background from "../assets/ai/AI_character_background.png";
import closeIcon from "../assets/icon/close.png";
import summaryIcon from "../assets/icon/summary.png";
import questionIcon from "../assets/icon/question.png";
import enterIcon from "../assets/icon/enter.png";

import "../styles/AI_Assistant.css";

const AI_Assistant = () => {

    const [isOpen, setIsOpen] = useState(false);

    const [question, setQuestion] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    type Message = {
        role: "user" | "assistant";
        content: string;
    };

    const [messages, setMessages] = useState<Message[]>([]);

    const ROLE_SUMMARY = "현재 노트를 핵심 위주로 요약하는 학습 도우미";
    const ROLE_QUESTION = "현재 노트를 바탕으로 사용자의 질문에 답변하는 학습 도우미";
    const ROLE_FREE = "일반적인 학습 질문에 친절하고 간단하게 답변하는 학습 도우미";

    const [selectedRole, setSelectedRole] = useState(ROLE_FREE);

    const handleSend = async (role: string, message: string = question) => {
        if (!message.trim()) return;

        const currentQuestion = message;

        setMessages((prev) => [
            ...prev,
            { role: "user", content: currentQuestion },
            { role: "assistant", content: "" },
        ]);

        setQuestion("");
        setIsLoading(true);

        try {
            const response = await fetch(
                `/api/ai/chat-stream-model?question=${encodeURIComponent(currentQuestion)}&role=${encodeURIComponent(role)}`,
                {
                    method: "POST",
                }
            );

            if (!response.ok || !response.body) {
                throw new Error("AI 응답을 불러오지 못했습니다.");
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                const chunk = decoder.decode(value, { stream: true });

                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;

                    updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: updated[lastIndex].content + chunk,
                    };

                    return updated;
                });
            }

        } catch (error) {
            console.error("AI 요청 실패:", error);
            
            setMessages((prev) => {
                const updated = [...prev];
                const lastIndex = updated.length - 1;

                updated[lastIndex] = {
                    role: "assistant",
                    content: "응답을 불러오는 중 오류가 발생했습니다.",
                }

                return updated;
            });
        } finally {
            setIsLoading(false);

            setSelectedRole(ROLE_FREE); // 질문 한 번 끝나면 다시 기본 자유 질문 모드
        }
    };

    return (
        <div className="ai-assistant">
            {isOpen ? (
                <div className="ai-chat-window">
                    <div className="ai-chat-header">
                        <span className="ai-chat-header-title">
                            AI 학습 도우미
                        </span>

                        <button
                            className="ai-chat-close"
                            type="button"
                            onClick={() => setIsOpen(false)}
                        >
                            <img src={closeIcon} alt="닫기" />
                        </button>
                    </div>

                    <div className="ai-chat-body">
                        {messages.length === 0 && !isLoading && (
                            <>
                                <div className="ai-chat-title-area">
                                    <img
                                        src={AI_Character}
                                        alt="AI Assistant"
                                        className="ai-chat-small-character"
                                    />

                                    <div className="ai-chat-title-text">
                                        <h2>무엇을 도와드릴까요?</h2>
                                        <p>현재 보고 있는 노트를 기반으로 답변해드려요.</p>
                                    </div>
                                </div>

                                <div className="ai-chat-menu">
                                    <button 
                                        type="button"
                                        onClick={() =>
                                            handleSend(
                                                ROLE_SUMMARY,
                                                "현재 노트의 핵심 내용을 요약해줘."
                                            )
                                        }
                                    >
                                        <img src={summaryIcon} alt="노트 요약"/>
                                        <span>노트 요약</span>
                                    </button>

                                    <button 
                                        type="button"
                                        onClick={() => setSelectedRole(ROLE_QUESTION)}
                                    >
                                        <img src={questionIcon} alt="질문하기"/>
                                        <span>질문하기</span>
                                    </button>
                                </div>

                                <img
                                    src={AI_Character_Background}
                                    alt="AI 캐릭터"
                                    className="ai-chat-background-character"
                                />
                            </>
                        )}
                        
                        {messages.length > 0 && (
                            <div className="ai-chat-messages">
                                {messages.map((message, index) => (
                                    <div
                                        key={index}
                                        className={`ai-message ${
                                            message.role === "user"
                                                ? "ai-message-user"
                                                : "ai-message-assistant"     
                                        }`}
                                    >
                                    <div className="ai-message-bubble">
                                        {message.content ||
                                            (message.role === "assistant" && isLoading
                                                ? "답변을 생성하고 있어요..."
                                                : ""
                                            )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>

                    <div className="ai-chat-input">
                        <input
                            type="text"
                            placeholder={
                                selectedRole === ROLE_QUESTION
                                    ? "현재 노트에 대해 질문해보세요"
                                    : "질문을 입력하세요"
                            }
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSend(selectedRole);
                                }
                            }}
                        />

                        <button 
                            type="button"
                            className="ai-chat-send-button"
                            onClick={() => handleSend(selectedRole)}
                        >
                            <img src={enterIcon} alt="전송" />
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    className="ai-character-button"
                    type="button"
                    onClick={() => setIsOpen(true)}
                >
                    <img src={AI_Character} alt="AI Assistant" />
                </button>
            )}
        </div>
    );
};

export default AI_Assistant;