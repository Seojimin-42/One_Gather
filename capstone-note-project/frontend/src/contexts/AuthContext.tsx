import { createContext, useContext, useEffect, useState, type ReactNode, } from "react";

import LoginModal from "../components/LoginModal";
import SignUpModal from "../components/SignUpModal";
import FindAccountModal from "../components/FindAccountModal";
import FindIdResultModal from "../components/FindIdResultModal";
import ResetPasswordModal from "../components/ResetPasswordModal";
import FindPWResultModal from "../components/FindPWResultModal";

type LoginUser = {
    id: number;
    email: string;
    nickname: string;
};

type AuthContextType = {
    loginUser: LoginUser | null;
    setLoginUser: React.Dispatch<React.SetStateAction<LoginUser | null>>;
    logout: () => Promise<void>;

    openLoginModal: () => void;
};

type AuthProviderProps = {
    children: ReactNode;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children, }: AuthProviderProps) {
    const [loginUser, setLoginUser] = useState<LoginUser | null>(null);

    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
    const [isFindAccountModalOpen, setIsFindAccountModalOpen] = useState(false);
    const [isFindIdResultModalOpen, setIsFindIdResultModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isFindPWResultModalOpen, setIsFindPWResultModalOpen] = useState(false);

    const [foundNickname, setFoundNickname] = useState("");
    const [foundUserId, setFoundUserId] = useState("");

    const [resetEmail, setResetEmail] = useState("");

    const [findAccountInitialTab, setFindAccountInitialTab] = useState<"id" | "password">("id");

    const openLoginModal = () => { setIsLoginModalOpen(true); };

    // 새로고침해도 로그인 상태 복구하도록 /me 호출
    useEffect(() => {
        const checkLoginUser = async () => {
            try {
                const response = await fetch("/api/users/me", {
                    method: "GET",
                    credentials: "include",
                });

                if (!response.ok) {
                    setLoginUser(null);
                    return;
                }

                const user = await response.json();

                setLoginUser(user);
            } catch (error) {
                console.error(
                    "로그인 상태 확인 실패:",
                    error
                );

                setLoginUser(null);
            }
        };

        checkLoginUser();
    }, []);

    const logout = async () => {
        const confirmed = window.confirm(
            "로그아웃하시겠습니까?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const response = await fetch(
                "/api/users/logout",
                {
                    method: "POST",
                    credentials: "include",
                }
            );

            if (!response.ok) {
                alert("로그아웃에 실패했습니다.");
                return;
            }

            setLoginUser(null);

            alert("로그아웃되었습니다.");
        } catch (error) {
            console.error("로그아웃 오류:", error);

            alert(
                "서버와 통신 중 오류가 발생했습니다."
            );
        }
    };

    return (
        <AuthContext.Provider
            value={{
                loginUser,
                setLoginUser,
                logout,
                openLoginModal,
            }}
        >
            {children}

            {isLoginModalOpen && (
                <LoginModal
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={(user) => {
                        setLoginUser(user);
                        setIsLoginModalOpen(false);
                    }}
                    onSignUp={() => {
                        setIsLoginModalOpen(false);
                        setIsSignUpModalOpen(true);
                    }}
                    onFindAccount={() => {
                        setFindAccountInitialTab("id");
                        setIsLoginModalOpen(false);
                        setIsFindAccountModalOpen(true);
                    }}
                />
            )}

            {isSignUpModalOpen && (
                <SignUpModal
                    onClose={() => setIsSignUpModalOpen(false)}
                />
            )}

            {isFindAccountModalOpen && (
                <FindAccountModal
                    initialTab={findAccountInitialTab}
                    onClose={() => setIsFindAccountModalOpen(false)}

                    onIdFound={(nickname, email) => {
                        setFoundNickname(nickname);
                        setFoundUserId(email);

                        setIsFindAccountModalOpen(false);
                        setIsFindIdResultModalOpen(true);
                }}

                onPasswordVerified={(email) => {
                    setResetEmail(email);

                    setIsFindAccountModalOpen(false);
                    setIsResetPasswordModalOpen(true);
                }}
                />
            )}

            {isFindIdResultModalOpen && (
                <FindIdResultModal
                    nickname={foundNickname}
                    userId={foundUserId}
                    onClose={() => setIsFindIdResultModalOpen(false)}

                    onFindPassword={() => {
                        setFindAccountInitialTab("password");
                        setIsFindIdResultModalOpen(false);
                        setIsFindAccountModalOpen(true);
                }}

                onLogin={() => {
                    setIsFindIdResultModalOpen(false);
                    setIsLoginModalOpen(true);
                }}
                />
            )}

            {isResetPasswordModalOpen && (
                <ResetPasswordModal
                    email={resetEmail}
                    onClose={() => setIsResetPasswordModalOpen(false)}
                    onPasswordChanged={() => {
                        setIsResetPasswordModalOpen(false);
                        setIsFindPWResultModalOpen(true);
                }}
                />
            )}

            {isFindPWResultModalOpen && (
                <FindPWResultModal
                    onClose={() => setIsFindPWResultModalOpen(false)}
                    onLogin={() => {
                        setIsFindPWResultModalOpen(false);
                        setIsLoginModalOpen(true);
                    }}
                />
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(

            "useAuth는 AuthProvider 내부에서 사용해야 합니다."
        );
    }

    return context;
}