import "../styles/FindPWResultModal.css";

import logo from "../assets/logo.png";
import checkIcon from "../assets/icon/check.png";

type FindPWResultModalProps = {
    onClose: () => void;
    onLogin: () => void;
};

function FindPWResultModal({ onClose, onLogin }: FindPWResultModalProps) {
    return (
        <div
            className="find-pw-result-backdrop"
        >
            <div
                className="find-pw-result-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="find-pw-result-close"
                    onClick={onClose}
                >
                    x
                </button>

                <img
                    src={logo}
                    alt="One Gather"
                    className="find-pw-result-logo"
                />

                <div className="find-pw-result-content">
                    <img
                        src={checkIcon}
                        alt="확인 완료"
                        className="find-pw-result-check"
                    />

                    <div className="find-pw-result-message">
                        <p>비밀번호 변경이 완료되었습니다.</p>
                        <p>새로운 비밀번호로 로그인해 주세요.</p>
                    </div>

                    <div className="find-pw-result-divider" />

                    <button
                        type="button"
                        className="find-pw-result-login-button"
                        onClick={onLogin}
                    >
                        로그인
                    </button>
                </div>
            </div>
        </div>
    )
};

export default FindPWResultModal;