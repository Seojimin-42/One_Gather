import { useAuth } from "../contexts/AuthContext";

import "../styles/AccountButton.css";

import personIcon from "../assets/icon/person.png";

function AccountButton() {

    const { loginUser, logout, openLoginModal } = useAuth();

    return (
        <button
            type="button"
            className="account-button"
            onClick={() => {
            if (loginUser) {
                // 로그인 상태
                logout();
            } else {
                openLoginModal()
            }
            }}
        >
            <img
                src={personIcon}
                alt="계정"
                className="account-icon"
            />

            <span>
                {loginUser
                ? `${loginUser.nickname}님`
                : "계정"}
            </span>
        </button>
    );
}

export default AccountButton;