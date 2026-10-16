import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/MyPage.css";
import "../styles/FriendSearchPage.css";

import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";
import searchIcon from "../assets/icon/search.png";

function FriendSearchPage() {
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState("");
    const [friendSearchText, setFriendSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const USERS_PER_PAGE = 10;

    const mockSearchUsers = [
        {
            id: 1,
            nickname: "친구 A",
            isFriend: true,
        },
        {
            id: 2,
            nickname: "AA친구_1",
            isFriend: false,
        },
        {
            id: 3,
            nickname: "AA친구B",
            isFriend: false,
        },
    ];

    const totalPages = Math.max(
        1,
        Math.ceil(mockSearchUsers.length / USERS_PER_PAGE)
    );

    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    const endIndex = startIndex + USERS_PER_PAGE;

    const pagedSearchUsers = mockSearchUsers.slice(
        startIndex,
        endIndex
    );

    return (
        <div className="page">
            <div className="layout">

                <aside className="sidebar">
                    <div className="sidebar-top">
                        <div
                            className="sidebar-logo"
                            onClick={() => navigate("/")}
                            role="button"
                            tabIndex={0}
                        >
                            <img src={logo} alt="One Gather 로고" />
                        </div>

                        <div className="sidebar-menu">
                            <button type="button" onClick={() => navigate("/")}>
                                전체노트
                            </button>

                            <button type="button" onClick={() => navigate("/recent")}>
                                최근학습
                            </button>

                            <button type="button" onClick={() => navigate("/favorite")}>
                                즐겨찾기
                            </button>

                            <button 
                                type="button"
                                className="active-menu"
                                onClick={() => navigate("/mypage")}
                            >
                                마이페이지
                            </button>

                            <div className="mypage-sidebar-submenu">

                                <button
                                    type="button"
                                    onClick={() => navigate("/mypage")}
                                >
                                    내 정보
                                </button>

                                <button
                                    type="button"
                                    className="active-submenu"
                                    onClick={() => navigate("/mypage/friend-search")}
                                >
                                    친구 검색
                                </button>

                                <button
                                    type="button"
                                    onClick={() => navigate("/mypage/friend-list")}
                                >
                                    친구 목록
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="sidebar-bottom">
                        <img src={sidebarBook} alt="책 장식" />
                    </div>
                </aside>

                <main className="main mypage-main">

                    <div className="topbar">
                        <div className="search-box">
                            <input
                                type="text"
                                placeholder="원하는 노트를 검색하세요"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />

                            <img
                                className="search-icon"
                                src={searchIcon}
                                alt="검색"
                            />
                        </div>
                    </div>

                    <section className="mypage-content">

                        <h2>마이페이지</h2>

                        <div className="mypage-tabs">

                            <button
                                type="button"
                                className="mypage-tab-button"
                                onClick={() => navigate("/mypage")}
                            >
                                내 정보
                            </button>

                            <button
                                type="button"
                                className="mypage-tab-button active-tab"
                                onClick={() => navigate("/mypage/friend-search")}
                            >
                                친구 검색
                            </button>

                            <button
                                type="button"
                                className="mypage-tab-button"
                                onClick={() => navigate("/mypage/friend-list")}
                            >
                                친구 목록
                            </button>
                        </div>

                        <p className="mypage-description">
                            사용자를 검색하여 친구를 추가할 수 있습니다.
                        </p>

                        <div className="friend-search-box">
                            <input
                                type="text"
                                placeholder="찾으시는 사용자를 검색하세요"
                                value={friendSearchText}
                                onChange={(e) =>
                                    setFriendSearchText(e.target.value)
                                }
                            />

                            <button 
                                type="button"
                                className="friend-search-button"    
                            >
                                <img src={searchIcon} alt="친구 검색" />
                            </button>
                        </div>

                        <h3 className="friend-section-title">
                            친구 검색결과 : 총 {mockSearchUsers.length}건
                        </h3>

                        <div className="friend-search-table">

                            <div className="friend-search-header">
                                <span>이름</span>
                                <span>친구 상태</span>
                                <span>프로필 보기</span>
                            </div>

                            {pagedSearchUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="friend-search-row"
                                >
                                    <span className="friend-search-name">
                                        {user.nickname}
                                    </span>

                                    <div className="friend-search-status">
                                        {user.isFriend ? (
                                            <button
                                                type="button"
                                                className="friend-cancel-button"
                                            >
                                                - 취소하기
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className="friend-add-button"
                                            >
                                                + 추가하기
                                            </button>
                                        )}
                                    </div>

                                    <div className="friend-search-profile">
                                        <button
                                            type="button"
                                            className="friend-profile-button"
                                        >
                                            ←  보러가기
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="friend-pagination">

                                <button 
                                    type="button"
                                    onClick={() => 
                                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                                    }
                                    disabled={currentPage === 1}
                                >
                                    ‹
                                </button>

                                {Array.from(
                                    { length: totalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={ currentPage === page ? "active-page" : "" }
                                        onClick={() => setCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                                    }}
                                    disabled={currentPage === totalPages}
                                >
                                    ›
                                </button>
                            </div>
                        </div>

                    </section>
                </main>
            </div>
        </div>
    );
}

export default FriendSearchPage;