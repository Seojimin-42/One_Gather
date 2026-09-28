import logo from "../assets/logo.png";

import "../styles/FindIdResultModal.css";

import checkIcon from "../assets/icon/check.png";

type FindIdResultModalProps = {
    onClose: () => void;
    userId: string;
    onFindPassword: () => void;
    onLogin: () => void;
};

function FindIdResultModal({
    onClose,
    userId,
    onFindPassword,
    onLogin,
}: FindIdResultModalProps) {
    return (
        <div
            className="find-id-result-backdrop"
            onClick={onClose}
        >
            <div
                className="find-id-result-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className="find-id-result-close"
                    onClick={onClose}
                >
                    x
                </button>

                <img
                    src={logo}
                    alt="One Gather"
                    className="find-id-result-logo"
                />

                <div className="find-id-result-content">
                    <img
                        src={checkIcon}
                        alt="확인 완료"
                        className="find-id-result-check"
                    />

                    <div className="find-id-result-message">
                        <p>User님의 아이디는</p>
                        <strong>{userId}</strong>
                        <p>입니다.</p>
                    </div>
                </div>

                <div className="find-id-result-divider"/>

                <div className="find-id-result-actions">
                    <button
                        type="button"
                        onClick={onFindPassword}
                    >
                        비밀번호 찾기
                    </button>

                    <button
                        type="button"
                        onClick={onLogin}
                    >
                        로그인
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FindIdResultModal;