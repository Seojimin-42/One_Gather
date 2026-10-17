import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../api/api";

import "../styles/MyPage.css";

import searchIcon from "../assets/icon/search.png";

import AccountButton from "../components/AccountButton";
import AI_Assistant from "../components/AI_Assistant";
import Sidebar from "../components/Sidebar";


type Note = {
    id: number;
    title: string;
    content?: string;
    contentHtml?: string;
    createdAt?: string;
    updatedAt?: string;
    deletedAt?: string;
    lastViewedAt?: string;
    lastViewedPage?: number;
    lastEditedPage?: number;
    deleted?: boolean;

    coverImageUrl?: string | null;
    coverStoragePath?: string | null;
    coverImagePublicId?: string | null;
    coverColor?: string;
    coverOpacity?: number;
    titleHidden?: boolean;
};

function MyPage() {
    const { loginUser } = useAuth();

    const navigate = useNavigate();

    const [notes, setNotes] = useState<Note[]>([]);
    const [trashNotes, setTrashNotes] = useState<Note[]>([]);
    const [searchText, setSearchText] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 5;

    // UI 확인용 임시 사용자 정보 추가
    const mockUser = {
        nickname: "AA친구",
        email: "AA친구@gmail.com",
        friendCount: 1,
    };

    useEffect(() => {
        const fetchMyPageData = async () => {
        try {
            const [notesResponse, trashResponse] = await Promise.all([
            api.get("/notes"),
            api.get("/notes/trash"),
            ]);

            setNotes(notesResponse.data);
            setTrashNotes(
                [...trashResponse.data].sort((a: Note, b: Note) => {
                    const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
                    const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
                    return dateB - dateA;
                })
            );
        } catch (error) {
            console.error("마이페이지 데이터 조회 실패:", error);
        }
        };

        fetchMyPageData();
    }, []);

    const savedNoteCount = notes.length;

    const totalPages = Math.max(1, Math.ceil(trashNotes.length / ITEMS_PER_PAGE));

    const pagedTrashNotes = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return trashNotes.slice(startIndex, endIndex);
    }, [trashNotes, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [trashNotes.length]);

    const handleRestore = async (id: number, deletedAt?: string) => {
        if (isExpiredTrashNote(deletedAt)) {
            alert("만료된 노트는 복구할 수 없습니다.");
            return;
        }

        try {
            await api.put(`/notes/${id}/restore`);
            sessionStorage.setItem(
                "mainPageViewState",
                JSON.stringify({
                    searchText: "",
                    currentPage: 1,
                    activeShelfIndexId: null,
                    scrollY: 0,
                })
            );

            setTrashNotes((prev) => prev.filter((note) => note.id !== id));
        } catch (error) {
            console.error("휴지통 복구 실패:", error);
            alert("복구에 실패했습니다.");
        }
    };

    const handlePermanentDelete = async (id: number) => {
        const confirmed = window.confirm("이 노트를 영구 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            await api.delete(`/notes/${id}/permanent`);
            setTrashNotes((prev) => prev.filter((note) => note.id !== id));
        } catch (error) {
            console.error("영구 삭제 실패:", error);
            alert("영구 삭제에 실패했습니다.");
        }
    };

    const handlePermanentDeleteAll = async () => {
        if (trashNotes.length === 0) {
            alert("휴지통에 삭제할 노트가 없습니다.");
            return;
        }

        const confirmed = window.confirm("휴지통의 모든 노트를 영구 삭제하시겠습니까?");
        if (!confirmed) return;

        try {
            await api.delete("/notes/trash/all");

            setTrashNotes([]);
            setCurrentPage(1);

            alert("휴지통이 비워졌습니다.");
        } catch (error) {
            console.error("휴지통 전체 영구 삭제 실패:", error);
            alert("휴지통 전체 삭제에 실패했습니다.");
        }
    };

    const formatDate = (value?: string) => {
        if (!value) return "-";

        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "-";

        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    };

    const getRemainingDays = (deletedAt?: string) => {
        if (!deletedAt) return "-";

        const deletedDate = new Date(deletedAt);
        if (Number.isNaN(deletedDate.getTime())) return "-";

        const expireDate = new Date(deletedDate);
        expireDate.setDate(expireDate.getDate() + 30);

        const today = new Date();
        const diff = Math.ceil(
            (expireDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return diff > 0 ? `${diff}일` : "만료";
    };

    const isExpiredTrashNote = (deletedAt?: string) => {
        if (!deletedAt) return false;

        const deletedDate = new Date(deletedAt);
        if (Number.isNaN(deletedDate.getTime())) return false;

        const expireDate = new Date(deletedDate);
        expireDate.setDate(expireDate.getDate() + 30);

        return expireDate.getTime() <= Date.now();
    };

    return (
        <div className="page">
            <div className="layout">

            <Sidebar />

            <main className="main mypage-main">
            <div className="topbar">
                <div className="search-box">
                <input
                    type="text"
                    placeholder="원하는 노트를 검색하세요"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <img className="search-icon" src={searchIcon} alt="검색" />
                </div>

                <AccountButton />
            </div>

            <section className="mypage-content">
                <h2>마이페이지</h2>

                <div className="mypage-tabs">
                    <button
                        type="button"
                        className="mypage-tab-button active-tab"
                        onClick={() => navigate("/mypage/info")}
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
                        className="mypage-tab-button"
                        onClick={() => navigate("/mypage/friend-list")}
                    >
                        친구 목록
                    </button>
                </div>

                <>
                    <p className="mypage-description">
                        사용자의 해당 정보를 확인할 수 있습니다.
                    </p>

                    <div className="profile-card">
                        <div className="profile-left">
                            <div className="profile-image">
                                <div className="profile-head"/>
                                <div className="profile-body"/>
                            </div>

                            <button
                                type="button"
                                className="profile-edit-button"
                            >
                                ✏️ 프로필 변경하기
                            </button>
                        </div>

                        <div className="profile-info">
                            <div className="profile-info-row">
                                <span className="profile-label">닉네임</span>
                                <span>{mockUser.nickname}</span>
                            </div>

                            <div className="profile-info-row">
                                <span className="profile-label">이메일</span>
                                <span>{mockUser.email}</span>
                            </div>

                            <div className="profile-info-row">
                                <span className="profile-label">친구 수</span>
                                <span>{mockUser.friendCount}</span>
                            </div>

                            <div className="profile-info-row">
                                <span className="profile-label">저장한 노트 수</span>
                                <span>{savedNoteCount}</span>
                            </div>
                        </div>
                    </div>

                    <h3 className="mypage-trash-title">휴지통 보관함</h3>
                    <p className="mypage-trash-description">
                        휴지통에 삭제된 노트의 보관 내역을 확인할 수 있습니다.
                    </p>
                </>

                <div className="mypage-trash-card">
                    <div
                        className={`trash-table-hover-area ${
                            trashNotes.length === 0 ? "trash-table-hover-area-empty" : ""
                        }`}
                    >
                        <div className="trash-table">
                            <div className="trash-header">
                                <span>노트 이름</span>
                                <span>삭제일</span>
                                <span>남은 기간</span>
                                <span>정리</span>
                            </div>

                            <div className="trash-body-wrap">
                                {trashNotes.length > 0 && (
                                    <div className="trash-table-overlay">
                                        <button
                                            type="button"
                                            className="trash-delete-all-button trash-overlay-button"
                                            onClick={handlePermanentDeleteAll}
                                        >
                                            휴지통 비우기
                                        </button>
                                    </div>
                                )}

                                <div className="trash-body">
                                    {pagedTrashNotes.map((note) => (
                                        <div key={note.id} className="trash-row">
                                            <span>{note.title}</span>
                                            <span>{formatDate(note.deletedAt)}</span>
                                            <span>{getRemainingDays(note.deletedAt)}</span>

                                            <div className="trash-actions">
                                                <button
                                                    type="button"
                                                    className={`restore-button ${isExpiredTrashNote(note.deletedAt) ? "disabled-button" : ""}`}
                                                    onClick={() => handleRestore(note.id, note.deletedAt)}
                                                    disabled={isExpiredTrashNote(note.deletedAt)}
                                                >
                                                    복구
                                                </button>
                                                <button
                                                    type="button"
                                                    className="delete-button"
                                                    onClick={() => handlePermanentDelete(note.id)}
                                                >
                                                    영구 삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="trash-guide">
                        30일이 넘으면 자동 영구삭제 됩니다.
                    </p>

                    <div className="pagination mypage-pagination">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                type="button"
                                className={currentPage === page ? "active-page" : ""}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                </div>

            </section>
            </main>

            {loginUser && (
                <AI_Assistant 
                    noteContent=""
                    userId={loginUser.id}
                />
            )}
        </div>
        </div>
    );
}

export default MyPage;