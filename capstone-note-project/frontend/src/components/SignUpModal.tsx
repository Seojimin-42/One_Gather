import { useState } from "react";

import logo from "../assets/logo.png";

import "../styles/SignUpModal.css";

type SignUpModalProps = {
    onClose: () => void;
};

function SignUpModal({ onClose }: SignUpModalProps) {
    const [email,setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [nickname, setNickname] = useState("");
    const [phone, setPhone] = useState("");

    const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 백엔드 연결 전 임시 확인
        console.log({
            email,
            password,
            passwordConfirm,
            nickname,
            phone,
        });
    };

    return (
        <div
            className="signup-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="signup-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="signup-close-button"
                    onClick={onClose}
                >
                    x
                </button>

                <img
                    src={logo}
                    alt="One Gather"
                    className="signup-logo"
                />

                <form
                    className="signup-form"
                    onSubmit={handleSignUp}
                >
                    <input
                        type="email"
                        className="signup-input"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        className="signup-input"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <input
                        type="password"
                        className="signup-input"
                        placeholder="비밀번호를 확인합니다."
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                    />

                    <div className="signup-nickname-row">
                        <input
                            type="text"
                            className="signup-input"
                            placeholder="닉네임을 최대 10글자까지 설정하세요"
                            maxLength={10}
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                        />

                        <button
                            type="button"
                            className="signup-check-button"
                        >
                            중복확인
                        </button>
                    </div>

                    <input
                        type="tel"
                        className="signup-input"
                        placeholder="휴대폰 번호를 입력하세요"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />

                    <button
                        type="submit"
                        className="signup-submit-button"
                    >
                        회원가입
                    </button>
                </form>
            </div>    
        </div>
    );
}

export default SignUpModal;