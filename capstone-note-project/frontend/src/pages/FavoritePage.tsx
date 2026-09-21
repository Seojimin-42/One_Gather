import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/FavoritePage.css";

import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";
import searchIcon from "../assets/icon/search.png";

type Note = {
  id: number;
  title: string;
  content?: string;
  contentHtml?: string;
  createdAt?: string;
  updatedAt?: string;
  lastViewedAt?: string;
  lastViewedPage?: number;
  lastEditedPage?: number;
  deleted?: boolean;
  pages?: { id: number }[];

  coverImageUrl?: string | null;
  coverStoragePath?: string | null;
  coverImagePublicId?: string | null;
  coverColor?: string;
  coverOpacity?: number;
  titleHidden?: boolean;
};

const ITEMS_PER_PAGE = 4;

function FavoritePage() {
  const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([]);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();

  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteNotes");
    setFavoriteNotes(storedFavorites ? JSON.parse(storedFavorites) : []);
  }, [location.pathname]);

  const filteredNotes = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    if (!keyword) return favoriteNotes;

    return favoriteNotes.filter((note) => {
      const rawContent = note.contentHtml ?? note.content ?? "";
      const plainContent = stripHtml(rawContent);

      return (
        (note.title ?? "").toLowerCase().includes(keyword) ||
        plainContent.toLowerCase().includes(keyword)
      );
    });
  }, [favoriteNotes, searchText])

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotes.length / ITEMS_PER_PAGE)
  );

  const pagedNotes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredNotes.slice(startIndex, endIndex);
  }, [filteredNotes, currentPage]);

  const formatDateTime = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const estimatePageCount = (content?: string) => {
    if (!content?.trim()) return 1;
    return Math.max(1, Math.ceil(content.length / 700));
  };

  const getTotalPageCount = (note: Note) => {
    if (Array.isArray(note.pages) && note.pages.length > 0) {
      return note.pages.length;
    }
    return estimatePageCount(note.contentHtml ?? note.content);
  };

  const getLatestPageNumber = (note: Note) => {
    const totalPageCount = getTotalPageCount(note);

    const savedPage =
      note.lastViewedPage ??
      note.lastEditedPage ??
      1;

    return Math.min(
      Math.max(savedPage, 1),
      totalPageCount
    );
  };

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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  navigate("/");
                }
              }}
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
              <button type="button" className="active-menu">
                즐겨찾기
              </button>
              <button type="button" onClick={() => navigate("/mypage")}>
                마이페이지
              </button>
            </div>
          </div>

          <div className="sidebar-bottom">
            <img src={sidebarBook} alt="책 장식" />
          </div>
        </aside>

        <main className="main favorite-main">
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
          </div>

          <section className="favorite-content">
            <h2>즐겨찾기</h2>

            <div className="note-list-rows">
              {pagedNotes.map((note) => (
                <div
                  key={note.id}
                  className="note-list-item favorite-highlight"
                  onClick={() =>
                    navigate(`/notes/${note.id}`, {
                      state: {
                        initialPage: getLatestPageNumber(note),
                      },
                    })
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      navigate(`/notes/${note.id}`, {
                        state: {
                          initialPage: getLatestPageNumber(note),
                        },
                      });
                    }
                  }}
                >
                  <div
                    className="note-list-thumb"
                    style={{
                      backgroundColor: note.coverImageUrl
                        ? "#ffffff"
                        : note.coverColor ?? "#3E4A3E",
                    }}
                  >
                    {note.coverImageUrl ? (
                      <img
                        src={note.coverImageUrl}
                        alt="노트 표지"
                        className="note-list-thumb-image"
                      />
                    ) : (
                      !note.titleHidden && (
                        <span className="note-list-thumb-title">
                          {note.title}
                        </span>
                      )
                    )}
                  </div>

                  <div className="note-list-meta">
                    <div className="note-list-title">
                      {note.title}
                    </div>

                    <div className="note-list-top">
                      {getTotalPageCount(note)}페이지 중 {getLatestPageNumber(note)}번째 페이지
                    </div>

                    <div className="note-list-bottom">
                      마지막 열람 기록 ㅣ {formatDateTime(note.lastViewedAt ?? note.updatedAt ?? note.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    className={currentPage === page ? "active-page" : ""}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                )
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default FavoritePage;