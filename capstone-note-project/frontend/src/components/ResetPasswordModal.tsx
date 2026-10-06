import { useState } from "react";

import "../styles/ResetPasswordModal.css";

import logo from "../assets/logo.png";

type ResetPasswordModalProps = {
    email: string;
    onClose: () => void;
    onPasswordChanged: () => void;
};

function ResetPasswordModal({
    email,
    onClose,
    onPasswordChanged,
}: ResetPasswordModalProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleCheckPassword = () => {
        if (!newPassword || !confirmPassword) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        alert("비밀번호가 일치합니다.")
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        if (newPassword !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            const response = await fetch("/api/users/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    newPassword,
                    confirmPassword,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();

                const firstErrorMessage =
                    errorData.email ||
                    errorData.newPassword ||
                    errorData.confirmPassword ||
                    errorData.message ||
                    "비밀번호 변경에 실패했습니다.";

                alert(firstErrorMessage);
                return;
            }

            onPasswordChanged();

        } catch (error) {
            console.error("비밀번호 변경 오류:", error);
            alert("서버와 통신 중 오류가 발생했습니다.");
        }

    };

    return (
        <div
            className="reset-password-backdrop"
        >
            <div
                className="reset-password-modal"
               onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="reset-password-close"
                    onClick={onClose}
                >
                    x
                </button>

                <img
                    src={logo}
                    alt="One Gather"
                    className="reset-password-logo"
                />

                <h2 className="reset-password-title">
                    새 비밀번호를 설정해주세요.
                </h2>

                <div className="reset-password-form">
                    <input
                        type="password"
                        className="reset-password-input"
                        placeholder="새 비밀번호를 입력하세요"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <div className="reset-password-row">
                        <input
                            type="password"
                            className="reset-password-input"
                            placeholder="새 비밀번호를 확인합니다."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <button
                            type="button"
                            className="reset-password-confirm-button"
                            onClick={handleCheckPassword}
                        >
                            확인
                        </button>
                    </div>

                    <div className="reset-password-divider" />

                    <button
                        type="button"
                        className="reset-password-submit-button"
                        onClick={handleChangePassword}
                    >
                        비밀번호 변경
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordModal;