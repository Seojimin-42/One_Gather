import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

import "../styles/LoginModal.css";

type LoginUser = {
    id: number;
    email: string;
    nickname: string;
};

type LoginModalProps = {
    onClose: () => void;
    onSignUp: () => void;
    onFindAccount: () => void;
    onLoginSuccess: (user: LoginUser) => void;
};

function LoginModal({ onClose, onSignUp, onFindAccount, onLoginSuccess}: LoginModalProps) {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberId, setRememberId] = useState(false);

    useEffect(() => {
        const savedEmail = localStorage.getItem("savedEmail");

        if (savedEmail) {
            setEmail(savedEmail);
            setRememberId(true);
        }
    }, []);

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!email || !password) {
            alert("이메일과 비밀번호를 입력해주세요.");
            return;
        }

        try {
            const response = await fetch("/api/users/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const firstErrorMessage = 
                    errorData.email ||
                    errorData.password ||
                    errorData.message ||
                    "이메일 또는 비밀번호가 일치하지 않습니다.";

                alert(firstErrorMessage);
                return;
            }

            const user = await response.json();

            console.log("로그인 성공:", user);

            if (rememberId) {
                localStorage.setItem("savedEmail", email);
            } else {
                localStorage.removeItem("savedEmail");
            }

            onLoginSuccess(user);

            onClose();
        
        } catch (error) {
            console.error("로그인 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }
    };

    return (
        <div
            className="login-modal-backdrop"
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
                            onClick={onSignUp}
                        >
                            회원가입
                        </button>

                        <button 
                            type="button"
                            onClick={onFindAccount}
                        >
                            아이디/비밀번호 찾기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginModal;