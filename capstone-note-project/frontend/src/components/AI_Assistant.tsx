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

    const handleSend = async () => {
        if (!question.trim()) return;

        const currentQuestion = question;

        setMessages((prev) => [
            ...prev,
            { role: "user", content: currentQuestion },
            { role: "assistant", content: "" },
        ]);

        setQuestion("");
        setIsLoading(true);

        try {
            const response = await fetch(
                `/api/ai/chat-stream-model?question=${encodeURIComponent(currentQuestion)}`,
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
                })
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
                                    <button type="button">
                                        <img src={summaryIcon} alt="노트 요약"/>
                                        <span>노트 요약</span>
                                    </button>

                                    <button type="button">
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
                            placeholder="질문을 입력하세요"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSend();
                                }
                            }}
                        />

                        <button 
                            type="button"
                            className="ai-chat-send-button"
                            onClick={handleSend}
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