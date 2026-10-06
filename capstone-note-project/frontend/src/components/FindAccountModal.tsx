import { useState } from "react";

import "../styles/FindAccountModal.css";
import logo from "../assets/logo.png";

type FindAccountModalProps = {
  onClose: () => void;
  onIdFound: (nickname: string, userId: string) => void;
  onPasswordVerified: (email: string) => void;
  initialTab?: "id" | "password";
};

function FindAccountModal({ onClose, onIdFound, onPasswordVerified, initialTab = "id", }: FindAccountModalProps) {
    const [activeTab, setActiveTab] = useState<"id" | "password">(initialTab);
    const [findMethod, setFindMethod] = useState<"phone" | "email">("phone");
    
    const [nickname, setNickName] = useState("");
    const [phone, setPhone] = useState("");

    const [emailId, setEmailId] = useState("");
    const [emailDomain, setEmailDomain] = useState("");
    const [customDomain, setCustomDomain] = useState("");

    const [verificationCode, setVerificationCode] = useState("");

    const fullEmail =
        emailDomain === "custom"
        ? `${emailId}@${customDomain}`
        : emailDomain
            ? `${emailId}@${emailDomain}`
            : "";

    // 아이디 찾기용 함수
    const handleFindId = async () => {
        try {
            const response = await fetch("/api/users/find-id", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nickname,
                    phone,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const firstErrorMessage =
                    errorData.nickname ||
                    errorData.phone ||
                    errorData.message ||
                    "일치하는 회원 정보를 찾을 수 없습니다.";

                alert(firstErrorMessage);
                return;
            }

            const email = await response.text();

            onIdFound(nickname, email);
        
        } catch (error) {
            console.error("아이디 찾기 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    // 인증번호 발송 함수
    const handleSendVerification = async () => {
        try {
            let url = "";
            let body = {};

            // 아이디 찾기
            if (activeTab === "id") {
                url = "/api/users/find-id/send-code";

                body = {
                    nickname,
                    phone,
                };
            }

            // 비밀번호 찾기 - 휴대폰
            else if (findMethod === "phone") {
                url = "/api/users/find-pw/send-code";

                body = {
                    nickname,
                    phone,
                };
            }

            // 비밀번호 찾기 - 이메일
            else {
                url = "/api/users/find-pw/send-email-code";

                body = {
                    nickname,
                    email: fullEmail,
                };
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type" : "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const firstErrorMessage =
                    errorData.nickname ||
                    errorData.phone ||
                    errorData.email ||
                    errorData.message ||
                    "인증번호 발송에 실패했습니다.";
                
                alert(firstErrorMessage);
                return;
            }

            const message = await response.text();

            alert(message);

        } catch (error) {
            console.error("인증번호 발송 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    // 인증확인 함수
    const handleVerifyCode = async () => {
        try {
            let url = "";
            let body = {};

            // 아이디 찾기
            if (activeTab === "id") {
                url = "/api/users/find-id/verify-code";

                body = {
                    nickname,
                    phone,
                    code: verificationCode,
                };
            }

            // 비밀번호 찾기 - 휴대폰
            else if (findMethod === "phone") {
                url = "/api/users/find-pw/verify-code";

                body = {
                    nickname,
                    phone,
                    code: verificationCode,
                };
            }

            // 비밀번호 찾기 - 이메일
            else {
                url = "/api/users/find-pw/verify-email-code";

                body = {
                    nickname,
                    email: fullEmail,
                    code: verificationCode,
                };
            }

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const firstErrorMessage =
                    errorData.nickname ||
                    errorData.phone ||
                    errorData.email ||
                    errorData.code ||
                    errorData.message ||
                    "인증번호를 확인해주세요.";

                alert(firstErrorMessage);
                return;
            }

            // 아이디 찾기
            if (activeTab === "id") {
                const email = await response.text();

                onIdFound(nickname, email);
                return;
            }

            // 비밀번호 찾기 - 이메일
            if (findMethod === "email") {
                onPasswordVerified(fullEmail);
                return;
            }

            // 비밀번호 찾기 - 휴대폰
            const email = await response.text();

            onPasswordVerified(email);

        } catch (error) {
            console.error("인증번호 확인 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };
    
    return (
        <div
            className="find-account-modal-backdrop"
        >
            <div
                className="find-account-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="find-account-close-button"
                    onClick={onClose}
                >
                    x
                </button>

                <img
                    src={logo}
                    alt="One Gather"
                    className="find-account-logo"
                />

                <div className="find-account-tabs">
                    <button
                        type="button"
                        className={activeTab === "id" ? "active" : ""}
                        onClick={() => {
                            setActiveTab("id")
                            setFindMethod("phone");
                        }}
                    >
                        아이디 찾기
                    </button>

                    <button
                        type="button"
                        className={activeTab === "password" ? "active" : ""}
                        onClick={() => setActiveTab("password")}
                    >
                        비밀번호 찾기
                    </button>
                </div>

                <div className="find-account-divider"/>

                <div className="find-method-options">
                    <label>
                        <input
                            type="radio"
                            name="findMethod"
                            checked={findMethod === "phone"}
                            onChange={() => setFindMethod("phone")}
                        />
                        휴대폰 번호로 찾기
                    </label>

                    <label>
                        <input
                            type="radio"
                            name="findMethod"
                            checked={findMethod === "email"}
                            onChange={() => setFindMethod("email")}
                            disabled={activeTab === "id"}
                        />
                        이메일로 찾기
                    </label>
                </div>

                <div className="find-account-form">
                    <input
                        type="text"
                        className="find-account-input"
                        placeholder="닉네임"
                        value={nickname}
                        onChange={(e) => setNickName(e.target.value)}
                    />

                    {findMethod === "phone" ? (
                        <div className="find-account-row">
                            <input
                                type="tel"
                                className="find-account-input"
                                placeholder="휴대폰 번호를 입력하세요"
                                maxLength={11}
                                value={phone}
                                onChange={(e) => {
                                    const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                                    setPhone(onlyNumbers);
                                }}
                            />

                            <button
                                type="button"
                                className="find-account-confirm-button"
                                onClick={handleSendVerification}
                            >
                                확인
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="find-account-email-row">
                                <input
                                    type="text"
                                    className="find-account-input"
                                    placeholder="이메일"
                                    value={emailId}
                                    onChange={(e) => setEmailId(e.target.value)}
                                />

                                <span className="find-account-at">@</span>

                                <select
                                    className="find-account-domain-select"
                                    value={emailDomain}
                                    onChange={(e) => setEmailDomain(e.target.value)}
                                >
                                    <option value="">선택</option>
                                    <option value="gmail.com">gmail.com</option>
                                    <option value="naver.com">naver.com</option>
                                    <option value="daum.net">daum.net</option>
                                    <option value="custom">직접 입력</option>
                                </select>

                                <button
                                    type="button"
                                    className="find-account-confirm-button"
                                    onClick={handleSendVerification}
                                >
                                    확인
                                </button>
                            </div>

                            {emailDomain === "custom" && (
                                <input
                                    type="text"
                                    className="find-account-input custom-domain-input"
                                    placeholder="도메인을 입력하세요"
                                    value={customDomain}
                                    onChange={(e) => setCustomDomain(e.target.value)}
                                />
                            )}
                        </>
                    )}

                    <input
                        type="text"
                        className="find-account-input verification-input"
                        placeholder="인증번호(6글자)"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/[^0-9]/g, "")
                            setVerificationCode(onlyNumbers)
                        }}
                    />

                    <div className="find-account-divider" />

                    <button
                        type="button"
                        className="find-account-verify-button"
                        onClick={handleVerifyCode}
                    >
                        인증확인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FindAccountModal;