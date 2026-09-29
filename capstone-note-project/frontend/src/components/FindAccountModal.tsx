import { useState } from "react";

import "../styles/FindAccountModal.css";
import logo from "../assets/logo.png";

type FindAccountModalProps = {
  onClose: () => void;
  onIdFound: () => void;
  onPasswordVerified: () => void;
};

function FindAccountModal({ onClose, onIdFound, onPasswordVerified }: FindAccountModalProps) {
    const [activeTab, setActiveTab] = useState<"id" | "password">("id");
    const [findMethod, setFindMethod] = useState<"phone" | "email">("phone");
    
    const [name, setName] = useState("");
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

    const handleSendVerification = () => {
        if (findMethod === "phone") {
            console.log("휴대폰 인증 요청", {
                activeTab,
                name,
                phone,
            });
        } else {
            console.log("이메일 인증 요청", {
                activeTab,
                name,
                email: fullEmail,
            });
        }
    };

    const handleVerifyCode = () => {
        console.log("인증번호 확인", {
            activeTab,
            findMethod,
            verificationCode,
        });

        if (activeTab === "id") {
            onIdFound();
        } else {
            onPasswordVerified();
        }
    };
    
    return (
        <div
            className="find-account-modal-backdrop"
            onClick={onClose}
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
                        onClick={() => setActiveTab("id")}
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
                        />
                        이메일로 찾기
                    </label>
                </div>

                <div className="find-account-form">
                    <input
                        type="text"
                        className="find-account-input"
                        placeholder="이름"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    {findMethod === "phone" ? (
                        <div className="find-account-row">
                            <input
                                type="tel"
                                className="find-account-input"
                                placeholder="휴대폰 번호를 입력하세요"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
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
                        onChange={(e) => setVerificationCode(e.target.value)}
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