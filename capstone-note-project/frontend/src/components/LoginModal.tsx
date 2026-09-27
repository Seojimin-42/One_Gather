import { useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

import "../styles/LoginModal.css";

type LoginModalProps = {
    onClose: () => void;
};

function LoginPage({ onClose }: LoginModalProps) {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberId, setRememberId] = useState(false);

    const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 백엔드 연결 전 임시 확인
        console.log({
            email,
            password,
            rememberId,
        });
    };

    return (
        <div
            className="login-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="login-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="login-close-button"
                    onClick={onClose}
                >
                    x
                </button>

                <img
                    src={logo}
                    alt="One Gather"
                    className="login-logo"
                />

                <form
                    className="login-form"
                    onSubmit={handleLogin}
                >
                    <input
                        type="email"
                        className="login-input"
                        placeholder="이메일"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        className="login-input"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label className="login-remember">
                        <input
                            type="checkbox"
                            checked={rememberId}
                            onChange={(e) => setRememberId(e.target.checked)}
                        />

                        <span>아이디 저장</span>
                    </label>

                    <div className="login-divider" />

                    <button
                        type="submit"
                        className="login-submit-button"
                    >
                        로그인
                    </button>

                    <div className="login-links">
                        <button
                            type="button"
                            onClick={() => navigate("/signup")}
                        >
                            회원가입
                        </button>

                        <button type="button">
                            아이디/비밀번호 찾기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;