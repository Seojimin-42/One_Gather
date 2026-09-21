/* 메인페이지 레이아웃 */

import { useEffect, useMemo, useState } from "react";
import { api, API_BASE_URL } from "../api/api";
import { useNavigate } from "react-router-dom";

import "../styles/MainPage.css";
import NoteDetailModal from "../components/NoteDetailModal";
import CreateNoteModal from "../components/CreateNoteModal";
import AI_Assistant from "../components/AI_Assistant";

/* 이미지 임포트 */
import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";

import likedIcon from "../assets/icon/Liked.png";
import unlikedIcon from "../assets/icon/UnLiked.png";
import searchIcon from "../assets/icon/search.png"
import viewDetailsIcon from "../assets/icon/view_details.png"

type Note = {
  id: number;
  title: string;
  content: string;
  contentHtml?: string;
  templateId?: string;
  createdAt? : string;
  updatedAt? : string;
  lastViewedAt?: string;
  deleted?: boolean;

  coverImageUrl?: string | null;
  coverStoragePath?: string | null;
  coverImagePublicId?: string | null;
  coverColor?: string;
  coverOpacity?: number;
  titleHidden?: boolean;
  shelfIndexId: number | null;
};

type AddCard = {
  type: "add";
};

type CardItem = Note | AddCard;

type CoverStyle = {
  title: string;
  color: string;
  opacity: number;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  titleHidden: boolean;
}

type ShelfIndex = {
  id: number;
  name: string;
}

function MainPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [favoriteNotes, setFavoriteNotes] = useState<Note[]>([]);
  const [searchText, setSearchText] = useState("");
  const [isSearchAnimating, setIsSearchAnimating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [hiddenTitleNoteIds, setHiddenTitleNoteIds] = useState<number[]>([]);
  const [noteCoverStyles, setNoteCoverStyles] = useState<Record<number, CoverStyle>>({});
  const [shelfIndexes, setShelfIndexes] = useState<ShelfIndex[]>([]);
  const [activeShelfIndexId, setActiveShelfIndexId] = useState<number | null>(null);
  const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const navigate = useNavigate();

  const MAIN_PAGE_STATE_KEY = "mainPageViewState";

  const triggerSearchAnimation = () => {
    setIsSearchAnimating(true);
    setTimeout(() => setIsSearchAnimating(false), 200);
  }
  
  useEffect(() => {
    api
      .get("/notes")
      .then((response) => {
        console.log("=== /notes 응답 전체 ===", response.data);
        if (response.data[0]) {
          console.log("=== 첫 노트의 키들 ===", Object.keys(response.data[0]));
          console.log("=== 첫 노트의 content ===", response.data[0].content);
        }
        setNotes(response.data);
      })
      .catch((error) => console.error("노트 목록 불러오기 실패:", error));
  }, []);

  useEffect(() => {
    const storedCoverStyles = localStorage.getItem("noteCoverStyles");

    if (storedCoverStyles) {
      setNoteCoverStyles(JSON.parse(storedCoverStyles));
    }
  }, []);

  useEffect(() => {
    const fetchShelfIndexes = async () => {
      try {
        const response = await api.get("/shelf-indexes");
        setShelfIndexes(response.data);
      } catch (error) {
        console.error("인덱스 목록 불러오기 실패", error);
      }
    };

    fetchShelfIndexes();
  }, []);

  // 최근 노트 본 노트 조회
  useEffect(() => {
    const storedNotes = localStorage.getItem("recentNotes");
    setRecentNotes(storedNotes ? JSON.parse(storedNotes) : []);
  }, []);

  // 즐겨찾기 노트 조회
  useEffect(() => {
    const storedFavorites = localStorage.getItem("favoriteNotes");
    setFavoriteNotes(storedFavorites ? JSON.parse(storedFavorites) : []);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(
      MAIN_PAGE_STATE_KEY,
      JSON.stringify({
        searchText,
        currentPage,
        activeShelfIndexId,
        scrollY: window.scrollY,
      })
    );
  }, [searchText, currentPage, activeShelfIndexId]);

  const toggleFavorite = (note: Note) => {
    let updatedFavorites: Note[] = [];

    const isAlreadyFavorite = favoriteNotes.some((item) => item.id === note.id);

    if (isAlreadyFavorite) {
      updatedFavorites = favoriteNotes.filter((item) => item.id !== note.id);
    } else {
      updatedFavorites = [note, ...favoriteNotes];
    }

    setFavoriteNotes(updatedFavorites);
    localStorage.setItem("favoriteNotes", JSON.stringify(updatedFavorites));
  };

  const isFavorite = (id: number) => {
    return favoriteNotes.some((item) => item.id === id);
  };

  // 브라우저에 저장된 노트 데이터들을 제거하는 함수
  useEffect(() => {
    if (notes.length === 0) return;

    const validIds = notes.map((note) => note.id);

    const storedRecentNotes = localStorage.getItem("recentNotes");
    if (storedRecentNotes) {
      const recentNotes: Note[] = JSON.parse(storedRecentNotes);
      const filteredRecentNotes = recentNotes.filter((item: Note) =>
        validIds.includes(item.id)
      );
      setRecentNotes(filteredRecentNotes);
      localStorage.setItem("recentNotes", JSON.stringify(filteredRecentNotes));
    }

    const storedFavoriteNotes = localStorage.getItem("favoriteNotes");
    if (storedFavoriteNotes) {
      const favoriteNotes: Note[] = JSON.parse(storedFavoriteNotes);
      const filteredFavoriteNotes = favoriteNotes.filter((item: Note) =>
        validIds.includes(item.id)
      );
      setFavoriteNotes(filteredFavoriteNotes);
      localStorage.setItem("favoriteNotes", JSON.stringify(filteredFavoriteNotes));
    }}, [notes]);

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, "");

    const currentNotes = useMemo(() => {
      let baseList: Note[] = notes;

      // 인덱스를 클릭한 경우, 해당 인덱스에 들어간 노트만 보여줌
      if (activeShelfIndexId !== null) {
        baseList = baseList.filter(
          (note) => note.shelfIndexId === activeShelfIndexId
        );
      }
    
      // 검색어 필터
      return baseList.filter((note) => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return true;

        const rawContent = note.contentHtml ?? note.content ?? "";
        const plainContent = stripHtml(rawContent);

        return (
          (note.title ?? "").toLowerCase().includes(keyword) ||
          plainContent.toLowerCase().includes(keyword)
        );
      });
    }, [notes, searchText, activeShelfIndexId]);

    const CARDS_PER_PAGE = 9;
    const CARDS_PER_ROW = 3;
    const NOTES_PER_PAGE = CARDS_PER_PAGE - 1;

    const totalPages = Math.max(
      1,
      Math.ceil(currentNotes.length / NOTES_PER_PAGE)
    );                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      

    const pageCards = useMemo<CardItem[]>(() => {
      const startIndex = (currentPage - 1) * NOTES_PER_PAGE;
      const endIndex = startIndex + NOTES_PER_PAGE;

      const pageNotes = currentNotes.slice(startIndex, endIndex);

      return [{ type: "add" }, ...pageNotes];
    }, [currentNotes, currentPage]);

    const rows = useMemo<CardItem[][]>(() => {
      const result: CardItem[][] = [];

      for (let i = 0; i < pageCards.length; i+= CARDS_PER_ROW) {
        result.push(pageCards.slice(i, i + CARDS_PER_ROW));
      }

      return result;
    }, [pageCards]);

    useEffect(() => {
      setCurrentPage(1);
    }, [searchText, activeShelfIndexId]);

    useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [currentPage, totalPages]);

    const PAGE_BUTTON_COUNT = 5;
    const currentPageGroup = Math.floor((currentPage - 1) / PAGE_BUTTON_COUNT)
    const startPage = currentPageGroup * PAGE_BUTTON_COUNT + 1;
    const endPage = Math.min(startPage + PAGE_BUTTON_COUNT - 1, totalPages);
    const visiblePages = Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );

    const toggleTitleHidden = (noteId: number) => {
      setHiddenTitleNoteIds((prev) => 
        prev.includes(noteId)
          ? prev.filter((id) => id !== noteId)
          : [...prev, noteId]
      );
    };

    const saveMainPageState = () => {
      sessionStorage.setItem(
        MAIN_PAGE_STATE_KEY,
        JSON.stringify({
          searchText,
          currentPage,
          activeShelfIndexId,
          scrollY: window.scrollY,
        })
      );
    };

    useEffect(() => {
      const savedState = sessionStorage.getItem(MAIN_PAGE_STATE_KEY);

      if (!savedState) {
        return;
      }

      try {
        const parsed = JSON.parse(savedState);

        if (typeof parsed.searchText === "string") {
          setSearchText(parsed.searchText);
        }

        if (typeof parsed.currentPage === "number") {
          setCurrentPage(parsed.currentPage);
        }

        if (
          typeof parsed.activeShelfIndexId === "number" ||
          parsed.activeShelfIndexId === null
        ) {
          setActiveShelfIndexId(parsed.activeShelfIndexId);
        }

        setTimeout(() => {
          if (typeof parsed.scrollY === "number") {
            window.scrollTo(0, parsed.scrollY);
          }
        }, 0);
      } catch (error) {
        console.error("메인 페이지 상태 복원 실패:", error);
      }
    }, []);

    const handleAddShelfIndex = async () => {
      const trimmedName = window.prompt("추가할 인덱스 이름을 입력하세요.");

      if (!trimmedName) return;
      
      const isDuplicate = shelfIndexes.some(
        (index) => index.name === trimmedName
      );
      if (isDuplicate) {
        alert("이미 존재하는 인덱스입니다.");
        return;
      }

      try {
        const response = await api.post("/shelf-indexes", { name: trimmedName });
        const newIndex: ShelfIndex = response.data;

        setShelfIndexes((prev) => [...prev, newIndex]);
        setActiveShelfIndexId(null);
      } catch (error) {
        console.error("인덱스 추가 실패", error);
        alert("인덱스 추가에 실패했습니다.");
      }
    };

    const handleDeleteShelfIndex = async (targetIndexId: number) => {
      const targetIndex = shelfIndexes.find((index) => index.id === targetIndexId);
      if (!targetIndex) return;

      const confirmed = window.confirm(
        `"${targetIndex.name}" 인덱스를 삭제하시겠습니까?\n해당 인덱스에 들어있던 노트는 삭제되지 않고 분류 없음으로 변경됩니다.`
      );
      if (!confirmed) return;

      try {
        await api.delete(`/shelf-indexes/${targetIndexId}`);

        setShelfIndexes((prev) => prev.filter((index) => index.id !== targetIndexId));

        // 노트 목록의 shelfIndexId도 null로 갱신
        setNotes((prev) =>
          prev.map((note) =>
            note.shelfIndexId === targetIndexId
              ? { ...note, shelfIndexId: null }
              : note
          )
        );

        if (activeShelfIndexId === targetIndexId) {
          setActiveShelfIndexId(null);
        }
      } catch (error) {
        console.error("인덱스 삭제 실패", error);
        alert("인덱스 삭제에 실패했습니다.");
      }
    };

    const hexToRgba = (hex: string, opacityValue: number) => {
      const cleanHex = hex.replace("#", "");

      const r = parseInt(cleanHex.slice(0, 2), 16);
      const g = parseInt(cleanHex.slice(2, 4), 16);
      const b = parseInt(cleanHex.slice(4, 6), 16);

      return `rgba(${r}, ${g}, ${b}, ${opacityValue / 100})`;
    };

    const getNoteCoverStyle = (note: Note): CoverStyle => {
      return {
        title: note.title,
        color: note.coverColor ?? "3E4A3E",
        opacity: note.coverOpacity ?? 100,
        imageUrl: note.coverImageUrl ?? null,
        imagePublicId: note.coverImagePublicId ?? null,
        titleHidden: note.titleHidden ?? false,
      };
    };

    const handleUpdateNoteCover = async (
      noteId: number,
      coverStyle: CoverStyle
    ) => {
      const targetNote = notes.find((note) => note.id === noteId);

      if (!targetNote) {
        return;
      }

      try {
        const response = await api.put(`/notes/${noteId}`, {
          title: coverStyle.title,
          content: targetNote.content,
          templateId: targetNote.templateId,
          coverColor: coverStyle.color,
          coverOpacity: coverStyle.opacity,
          coverImageUrl: coverStyle.imageUrl,
          coverImagePublicId: coverStyle.imagePublicId,
          coverStoragePath: null,
          titleHidden: coverStyle.titleHidden,
        });

        const updatedNote = response.data;
        console.log("백엔드 응답:", updatedNote);

        setNotes((prevNotes) => 
          prevNotes.map((note) =>
            note.id === noteId ? updatedNote : note
          )
        );

        setRecentNotes((prevNotes) => {
          const updatedRecentNotes = prevNotes.map((note) =>
            note.id === noteId ? updatedNote : note
          );
          localStorage.setItem("recentNotes", JSON.stringify(updatedRecentNotes));
          return updatedRecentNotes;
        });

        setFavoriteNotes((prevNotes) => {
          const updatedFavoriteNotes = prevNotes.map((note) =>
            note.id === noteId ? updatedNote : note
          );
          localStorage.setItem("favoriteNotes", JSON.stringify(updatedFavoriteNotes));
          return updatedFavoriteNotes;
        });

        setSelectedNote(updatedNote);
      } catch (error) {
        console.error("표지 정보 저장 실패", error);
        alert("표지 정보 저장에 실패했습니다.");
      }
    };

    const handleChangeNoteShelfIndex = async (
      noteId: number,
      shelfIndexId: number | null
    ) => {
      try {
        const response = await api.put(`/notes/${noteId}/shelf-index`, {
          shelfIndexId,
        });
        const updatedNote = response.data;

        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? updatedNote : note))
        );
        setSelectedNote(updatedNote);
      } catch (error) {
        console.error("인덱스 변경 실패", error);
        alert("인덱스 변경에 실패했습니다.");
      }
    };

    const handleDuplicateNote = async (
      noteId: number,
      targetShelfIndexId: number | null
    ) => {
      try {
        const response = await api.post(`/notes/${noteId}/duplicate`, {
          shelfIndexId: targetShelfIndexId,
        });
        const newNote: Note = response.data;

        setNotes((prev) => [...prev, newNote]);
      } catch (error) {
        console.error("노트 복제 실패", error);
        alert("노트 복제에 실패했습니다.");
      }
    };

    const handleMoveToTrash = async (noteId: number) => {
      const confirmed = window.confirm("노트를 삭제하시겠습니까?");

      if (!confirmed) {
        return;
      }

      try {
        await api.delete(`/notes/${noteId}`);

        setNotes((prevNotes) =>
          prevNotes.filter((note) => note.id !== noteId)
        );

        setRecentNotes((prevNotes) => {
          const updatedNotes = prevNotes.filter((note) => note.id !== noteId);
          localStorage.setItem("recentNotes", JSON.stringify(updatedNotes));
          return updatedNotes;
        });

        setFavoriteNotes((prevNotes) => {
          const updatedNotes = prevNotes.filter((note) => note.id !== noteId);
          localStorage.setItem("favoriteNotes", JSON.stringify(updatedNotes));
          return updatedNotes;
        });

        setHiddenTitleNoteIds((prevIds) =>
          prevIds.filter((id) => id !== noteId)
        );

        setSelectedNote(null);

        alert("노트가 휴지통으로 이동되었습니다.");
      } catch (error) {
        console.error("노트 삭제 실패 : ", error);
        alert("노트 삭제에 실패했습니다.");
      }
  };

  const handleShareNote = async (noteId: number) => {
    try {
      const response = await api.post(`/notes/${noteId}/share`);
      const shareId = response.data.shareId;

      const shareUrl = `${window.location.origin}/shared/${shareId}`;

      setShareLink(shareUrl);
      setIsShareModalOpen(true);
    } catch (error) {
      console.error("공유 링크 생성 실패:", error);
      alert("공유 링크 생성에 실패했습니다.");
    }
  };

  const handleCopyShareLink = async () => {
    try {
        // 1순위: 최신 Clipboard API (HTTPS 또는 localhost 환경)
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(shareLink);
            alert("링크가 복사되었습니다.");
            return;
        }

        // 2순위: 폴백 - 임시 textarea로 복사 (HTTP IP 환경)
        const textarea = document.createElement("textarea");
        textarea.value = shareLink;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (successful) {
            alert("링크가 복사되었습니다.");
        } else {
            throw new Error("복사 명령 실패");
        }
    } catch (error) {
        console.error("링크 복사 실패:", error);
        alert("자동 복사에 실패했습니다. 링크를 길게 눌러 직접 복사해주세요.");
    }
};

  return (
    
    <div className="page">
      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-top">
            <div 
              className="sidebar-logo"
              onClick={() => {
                setActiveShelfIndexId(null);
                setSearchText("");
                setCurrentPage(1);
                navigate("/");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setActiveShelfIndexId(null);
                  setSearchText("");
                  setCurrentPage(1);
                  navigate("/")
                }
              }}>


              <img src={logo} alt="One Gather 로고"/>
            </div>

            <div className="sidebar-menu">
              <button
                onClick={() => {
                  setActiveShelfIndexId(null);
                  setSearchText("");
                  setCurrentPage(1);
                  navigate("/");
                }}
                type="button"
                >전체노트
              </button>

              <button
                onClick={() => navigate("/recent")}
                type="button"
                >최근학습
              </button>

              <button
                onClick={() => navigate("/favorite")}
                type="button"
                >즐겨찾기
              </button>

              <button
                onClick={() => navigate("/mypage")}
                type="button"
                >마이페이지
              </button>
            </div>
          </div>

          <div className="sidebar-bottom">
            <img src={sidebarBook} alt = "책 장식"/>
          </div>
        </aside>

        <main className="main note-create-main">
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

          <div className="content-wrapper">
            <div className="shelf-index-tabs">
                <div className="shelf-index-list">
                  {shelfIndexes.map((index) => (
                    <div key={index.id} className="shelf-index-tab-wrapper">
                      <button
                        className={`shelf-index-tab ${
                          activeShelfIndexId === index.id ? "active" : ""
                        }`}
                        type="button"
                        onClick={() => {
                          setActiveShelfIndexId(index.id);
                        }}
                        title={index.name}
                      >
                        {index.name.length > 10 ? index.name.slice(0, 10) + "⋯" : index.name}
                      </button>

                      <button
                        className="shelf-index-delete-button"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteShelfIndex(index.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                ))}
              </div>

              <button
                className="shelf-index-tab add-tab"
                type="button"
                onClick={handleAddShelfIndex}
              >
                +
              </button>
            </div>

            <section className="content">
              <h2>
                {activeShelfIndexId
                  ? shelfIndexes.find((index) => index.id === activeShelfIndexId)?.name ?? "전체노트"
                  : "전체노트"}
              </h2>

            <div className="note-list">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="note-row">
                  {row.map((item, itemIndex) => {
                    if ("type" in item && item.type === "add") {
                      return (
                        <div
                          key={`add-card-${rowIndex}-${itemIndex}`}
                          className="empty-card"
                          onClick={() => setIsCreateNoteModalOpen(true)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setIsCreateNoteModalOpen(true);
                            }
                          }}
                        >
                          +책 추가하기
                          </div>
                      );
                    }

                    const note = item as Note;
                    const coverStyle = getNoteCoverStyle(note);

                    return (
                      <div
                        key={note.id}
                        className="note-card"
                        onClick={() => {
                          saveMainPageState();
                          navigate(`/notes/${note.id}`);
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            saveMainPageState();
                            navigate(`/notes/${note.id}`);
                          }
                        }}
                      >
                        <button
                          className={`favorite-button ${isFavorite(note.id) ? "is-favorite" : ""}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(note);
                          }}>
                            <img
                              src = {isFavorite(note.id) ? likedIcon : unlikedIcon}
                              alt = "즐겨찾기"
                            />
                        </button>

                        <div 
                          className="note-cover"
                          style={{
                            backgroundColor: coverStyle.imageUrl
                              ? "#ffffff"
                              : hexToRgba(coverStyle.color, coverStyle.opacity),
                          }}
                        >
                          {coverStyle.imageUrl && (
                            <img
                              src={coverStyle.imageUrl}
                              alt="노트 표지"
                              className="note-cover-image"
                              style={{ opacity: coverStyle.opacity / 100 }}
                            />
                          )}
                          
                          {!note.titleHidden && (
                            <span className="note-cover-title-text">{note.title}</span>
                          )}
                        </div>

                        <button
                          className="more-button"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNote(note);
                          }}
                          >
                            <img src={viewDetailsIcon} alt="더보기"/>
                        </button>
                      </div>
                    );
                  })}
                  </div>
              ))}
            </div>
            <div className="pagination">
              {startPage > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(startPage - 1)}
                >
                  이전
                </button>
              )}

              {visiblePages.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={currentPage === pageNumber ? "active-page" : ""}
                  onClick={() => setCurrentPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              {endPage < totalPages && (
                <button
                  type="button"
                  onClick={() => setCurrentPage(endPage + 1)}
                >
                  다음
                </button>
              )}
            </div>
            
            {selectedNote && (
              <NoteDetailModal
                note={selectedNote}
                onClose={() => setSelectedNote(null)}
                isTitleHidden={Boolean(selectedNote.titleHidden)}
                onToggleTitleHidden={() =>
                  setSelectedNote((prev) =>
                    prev ? { ...prev, titleHidden: !prev.titleHidden } : prev
                  )
                }
                coverColor={getNoteCoverStyle(selectedNote).color}
                coverOpacity={getNoteCoverStyle(selectedNote).opacity}
                coverImageUrl={getNoteCoverStyle(selectedNote).imageUrl}
                coverImagePublicId={getNoteCoverStyle(selectedNote).imagePublicId}
                onSaveCover={(coverStyle) => handleUpdateNoteCover(selectedNote.id, coverStyle)}
                onDelete={() => handleMoveToTrash(selectedNote.id)}
                onShare={() => handleShareNote(selectedNote.id)}
                shelfIndexes={shelfIndexes}
                selectedShelfIndexId={selectedNote.shelfIndexId}
                onChangeShelfIndex={(shelfIndexId) => handleChangeNoteShelfIndex(selectedNote.id, shelfIndexId)}
                onDuplicate={(targetShelfIndexId) => handleDuplicateNote(selectedNote.id, targetShelfIndexId)}
            />
          )}

          {isShareModalOpen && (
            <div
              className="share-link-modal-backdrop"
              onClick={() => setIsShareModalOpen(false)}
            >
              <div
                className="share-link-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <h3>공유 링크</h3>

                <div className="share-link-box">
                  <input
                    type="text"
                    value={shareLink}
                    readOnly
                    className="share-link-input"
                  />
                </div>

                <div className="share-link-actions">
                  <button type="button" onClick={handleCopyShareLink}>
                    복사
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(false)}
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          )}

          {isCreateNoteModalOpen && (
            <CreateNoteModal
              onClose={() => setIsCreateNoteModalOpen(false)}
              onNext={(templateId) => {
                setIsCreateNoteModalOpen(false);
                navigate("/notes/new", { state: { templateId } });
              }}
            />
          )}
          </section>
          </div>
        </main>
        <AI_Assistant />
      </div>
    </div>
  );
}
export default MainPage;