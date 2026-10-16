import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/MyPage.css";
import "../styles/FriendListPage.css";

import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";
import searchIcon from "../assets/icon/search.png";

function FriendListPage() {
    const navigate = useNavigate();

    const [searchText, setSearchText] = useState("");
    const [friendSearchText, setFriendSearchText] = useState("");
    const [friendCurrentPage, setFriendCurrentPage] = useState(1);
    const [requestCurrentPage, setRequestCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10;

    const mockFriends = [
        {
            id: 1,
            nickname: "친구 A",
        },
    ];

    const friendTotalPages = Math.max(
        1,
        Math.ceil(mockFriends.length / ITEMS_PER_PAGE)
    );

    const friendStartIndex = (friendCurrentPage - 1) * ITEMS_PER_PAGE;

    const friendEndIndex = friendStartIndex + ITEMS_PER_PAGE;

    const pagedFriends = mockFriends.slice(
        friendStartIndex,
        friendEndIndex
    );

    const mockFriendRequests = [
        {
            id: 1,
            nickname: "친구 A",
        },
    ];

    const requestTotalPages = Math.max(
        1,
        Math.ceil(mockFriendRequests.length / ITEMS_PER_PAGE)
    );

    const requestStartIndex = (requestCurrentPage - 1) * ITEMS_PER_PAGE;

    const requestEndIndex = requestStartIndex + ITEMS_PER_PAGE;

    const pagedFriendRequests = mockFriendRequests.slice(
        requestStartIndex,
        requestEndIndex
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
                                    onClick={() => navigate("/mypage/friend-search")}
                                >
                                    친구 검색
                                </button>

                                <button
                                    type="button"
                                    className="active-submenu"
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
                                className="mypage-tab-button"
                                onClick={() => navigate("/mypage/friend-search")}
                            >
                                친구 검색
                            </button>

                            <button
                                type="button"
                                className="mypage-tab-button active-tab"
                                onClick={() => navigate("/mypage/friend-list")}
                            >
                                친구 목록
                            </button>
                        </div>

                        <div className="friend-list-search-box">
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
                                className="friend-list-search-button"    
                            >
                                <img src={searchIcon} alt="친구 검색" />
                            </button>
                        </div>

                        <h3 className="friend-list-result-summary">
                            친구 검색결과 : 총 {mockFriends.length}건
                        </h3>

                        <div className="friend-list-table">

                            <div className="friend-list-header">
                                <span>이름</span>
                                <span>친구 상태</span>
                                <span>페이지 보기</span>
                            </div>

                            {pagedFriends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="friend-list-row"
                                >
                                    <span className="friend-list-name">
                                        {friend.nickname}
                                    </span>

                                    <div className="friend-list-status">
                                        <button
                                            type="button"
                                            className="friend-remove-button"
                                        >
                                            - 해제하기
                                        </button>
                                    </div>

                                    <div className="friend-list-profile">
                                        <button
                                            type="button"
                                            className="friend-list-profile-button"
                                        >
                                            ←  보러가기
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <div className="friend-list-pagination">

                                <button 
                                    type="button"
                                    onClick={() => 
                                        setFriendCurrentPage((prev) => Math.max(prev - 1, 1))
                                    }
                                    disabled={friendCurrentPage === 1}
                                >
                                    ‹
                                </button>

                                {Array.from(
                                    { length: friendTotalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={ friendCurrentPage === page ? "active-page" : "" }
                                        onClick={() => setFriendCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setFriendCurrentPage((prev) => Math.min(prev + 1, friendTotalPages))
                                    }}
                                    disabled={friendCurrentPage === friendTotalPages}
                                >
                                    ›
                                </button>
                            </div>
                        </div>

                        <section className="friend-request-section">
                            
                            <h3 className="friend-request-title">
                                친구 요청
                            </h3>

                            <div className="friend-request-table">

                                <div className="friend-request-header">
                                    <span>이름</span>
                                    <span>요청 상태</span>
                                    <span>페이지 보기</span>
                                </div>

                                {pagedFriendRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="friend-request-row"
                                    >
                                        <span className="friend-request-name">
                                            {request.nickname}
                                        </span>

                                        <div className="friend-request-actions">
                                            
                                            <button
                                                type="button"
                                                className="friend-accept-button"
                                            >
                                                수락
                                            </button>

                                            <button
                                                type="button"
                                                className="friend-reject-button"
                                            >
                                                거절
                                            </button>
                                        </div>

                                        <div className="friend-request-profile">
                                            <button
                                                type="button"
                                                className="friend-request-profile-button"
                                            >
                                                ←  보러가기
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="friend-request-pagination">

                                <button 
                                    type="button"
                                    onClick={() => 
                                        setRequestCurrentPage((prev) => Math.max(prev - 1, 1))
                                    }
                                    disabled={requestCurrentPage === 1}
                                >
                                    ‹
                                </button>

                                {Array.from(
                                    { length: requestTotalPages },
                                    (_, index) => index + 1
                                ).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={ requestCurrentPage === page ? "active-page" : "" }
                                        onClick={() => setRequestCurrentPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => {
                                        setRequestCurrentPage((prev) => Math.min(prev + 1, requestTotalPages))
                                    }}
                                    disabled={requestCurrentPage === requestTotalPages}
                                >
                                    ›
                                </button>
                            </div>
                        </section>

                    </section>
                </main>
            </div>
        </div>
    );
}

export default FriendListPage;