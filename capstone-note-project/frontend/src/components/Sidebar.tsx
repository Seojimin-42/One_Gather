import { useLocation, useNavigate } from "react-router-dom";

import "../styles/Sidebar.css";

import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";

type SidebarProps = {
  onGoHome?: () => void;
  onNavigate?: (path: string) => void;
};

function Sidebar({
  onGoHome, onNavigate,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isMyPage =
    location.pathname.startsWith("/mypage/");

  const goHome = () => {
    if (onGoHome) {
      onGoHome();
    } else if (onNavigate) {
      onNavigate("/");  
    } else {
      navigate("/");
    }
  };

  const goTo = (path: string) => {
    if (onNavigate) {
        onNavigate(path);
    } else {
        navigate(path);
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div
          className="sidebar-logo"
          onClick={goHome}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              goHome();
            }
          }}
        >
          <img
            src={logo}
            alt="One Gather 로고"
          />
        </div>

        <div className="sidebar-menu">
          <button
            type="button"
            onClick={() => goTo("/")}
          >
            전체노트
          </button>

          <button
            type="button"
            onClick={() => goTo("/recent")}
          >
            최근학습
          </button>

          <button
            type="button"
            onClick={() => goTo("/favorite")}
          >
            즐겨찾기
          </button>

          <div
            className={`mypage-menu-group ${
              isMyPage ? "open" : ""
            }`}
          >
            <button
              type="button"
              className={isMyPage ? "active-menu" : ""}
              onClick={() => goTo("/mypage/info")}
            >
              마이페이지
            </button>

            <div className="mypage-sidebar-submenu">
              <button
                type="button"
                className={
                  location.pathname === "/mypage/info"
                    ? "active-submenu"
                    : ""
                }
                onClick={() => goTo("/mypage/info")}
              >
                내 정보
              </button>

              <button
                type="button"
                className={
                  location.pathname ===
                  "/mypage/friend-search"
                    ? "active-submenu"
                    : ""
                }
                onClick={() =>
                  goTo("/mypage/friend-search")
                }
              >
                친구 검색
              </button>

              <button
                type="button"
                className={
                  location.pathname ===
                  "/mypage/friend-list"
                    ? "active-submenu"
                    : ""
                }
                onClick={() =>
                  goTo("/mypage/friend-list")
                }
              >
                친구 목록
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sidebar-bottom">
        <img
          src={sidebarBook}
          alt="책 장식"
        />
      </div>
    </aside>
  );
}

export default Sidebar;