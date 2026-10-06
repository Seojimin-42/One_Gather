import { useState } from "react";

import logo from "../assets/logo.png";

import "../styles/SignUpModal.css";

type SignUpModalProps = {
    onClose: () => void;
};

function SignUpModal({ onClose }: SignUpModalProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [nickname, setNickname] = useState("");
    const [phone, setPhone] = useState("010");

    const [nicknameChecked, setNicknameChecked] = useState(false);

    const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            // 1. 먼저 DTO Validation만 검사
            const validateResponse = await fetch("/api/users/signup/validate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    passwordConfirm,
                    nickname,
                    phone,
                }),
            });

            if (!validateResponse.ok) {
                const errorData = await validateResponse.json();

                const firstErrorMessage =
                    errorData.email ||
                    errorData.password ||
                    errorData.passwordConfirm ||
                    errorData.nickname ||
                    errorData.phone ||
                    errorData.message ||
                    "회원가입 정보를 확인해주세요.";

                alert(firstErrorMessage);
                return;
            }

            // 2. DTO 검증 통과 후 닉네임 중복환인 여부 검사
            if (!nicknameChecked) {
                alert("닉네임 중복확인을 해주세요.");
                return;
            }

            // 3. 실제 회원가입 요청
            const signupResponse = await fetch("/api/users/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    passwordConfirm,
                    nickname,
                    phone,
                }),
            });

            if (!signupResponse.ok) {
                const errorData = await signupResponse.json();

                const firstErrorMessage =
                    errorData.email ||
                    errorData.password ||
                    errorData.passwordConfirm ||
                    errorData.nickname ||
                    errorData.phone ||
                    errorData.message ||
                    "회원가입 정보를 확인해주세요.";

                alert(firstErrorMessage);
                return;
            }

            const message = await signupResponse.text();

            alert(message);
            onClose();
        
        } catch (error) {
            console.error("회원가입 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        } 
    };
    
    const handleNicknameCheck = async ()=> {

        if (!nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        try {
            const response = await fetch(
                `/api/users/check-nickname?nickname=${encodeURIComponent(nickname)}`
            );

            const duplicate = await response.json();

            if (duplicate) {
                alert("이미 사용 중인 닉네임입니다.");
                setNicknameChecked(false);
            } else {
                alert("사용 가능한 닉네임입니다.");
                setNicknameChecked(true);
            }
            
        } catch (error) {
            console.error("닉네임 중복확인 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");

            setNicknameChecked(false);
        }
    };

    return (
        <div
            className="signup-modal-backdrop"
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
                        onChange={(e) => {
                            setEmail(e.target.value.replace(/\s/g, ""));
                        }}
                        onKeyDown={(e) => {
                            if (e.key === " ") {
                                e.preventDefault();
                            }
                        }}
                    />

                    <input
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        className="signup-input"
                        placeholder="비밀번호를 입력하세요"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value.replace(/\s/g, ""));
                        }}
                        onKeyDown={(e) => {
                            // ctrl + c  복사 키
                            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
                                const { selectionStart, selectionEnd } = e.currentTarget;
                                if(selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(password.slice(selectionStart, selectionEnd));
                                }
                            }

                            // ctrl + x 잘라내기 키
                            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
                                const { selectionStart, selectionEnd } = e.currentTarget;
                                if(selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(password.slice(selectionStart, selectionEnd));
                                    setPassword(password.slice(0, selectionStart) + password.slice(selectionEnd));
                                }
                            }
                        }}
                    />

                    <input
                        type="password"
                        name="passwordConfirm"
                        autoComplete="new-password"
                        className="signup-input"
                        placeholder="비밀번호를 확인합니다."
                        value={passwordConfirm}
                        onChange={(e) => {
                            setPasswordConfirm(e.target.value.replace(/\s/g, ""));
                        }}
                        onKeyDown={(e) => {
                            // ctrl + c  복사 키
                            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
                                const { selectionStart, selectionEnd } = e.currentTarget;
                                if(selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(passwordConfirm.slice(selectionStart, selectionEnd));
                                }
                            }

                            // ctrl + x 잘라내기 키
                            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "x") {
                                const { selectionStart, selectionEnd } = e.currentTarget;
                                if(selectionStart !== null && selectionEnd !== null && selectionStart !== selectionEnd) {
                                    e.preventDefault();
                                    navigator.clipboard.writeText(passwordConfirm.slice(selectionStart, selectionEnd));
                                    setPasswordConfirm(passwordConfirm.slice(0, selectionStart) + passwordConfirm.slice(selectionEnd));
                                }
                            }
                        }}
                    />

                    <div className="signup-nickname-row">
                        <input
                            type="text"
                            className="signup-input"
                            placeholder="닉네임을 최대 10글자까지 설정하세요"
                            maxLength={10}
                            value={nickname}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, "");

                                setNickname(value);
                                setNicknameChecked(false);
                            }}
                        />

                        <button
                            type="button"
                            className="signup-check-button"
                            onClick={handleNicknameCheck}
                        >
                            중복확인
                        </button>
                    </div>

                    <input
                        type="tel"
                        className="signup-input"
                        placeholder="휴대폰 번호 11자리를 입력하세요"
                        maxLength={11}
                        value={phone}
                        onChange={(e) => {
                            const onlyNumbers = e.target.value.replace(/[^0-9]/g, "");
                            setPhone(onlyNumbers);
                        }}
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