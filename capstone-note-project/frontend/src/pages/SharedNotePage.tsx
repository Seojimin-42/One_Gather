import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/api";
import NoteViewer from "../components/NoteViewer";
import type { NotePage } from "../utils/noteHelpers";
import { normalizePages } from "../utils/noteHelpers";
import { ChevronUp, ChevronDown, PanelTop } from "lucide-react";

import "../styles/MainPage.css";
import "../styles/NoteCreatePage.css";
import "../styles/NoteViewPage.css";
import "../styles/SharedNotePage.css";

import logo from "../assets/logo.png";

type SharedNote = {
  id: number;
  title: string;
  content: string;
  contentHtml?: string;
  pages?: any[];
  templateId?: string;
};

function SharedNotePage() {
  const { shareId } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState<SharedNote | null>(null);
  const [pages, setPages] = useState<NotePage[]>([]);
  const [templateId, setTemplateId] = useState("note1");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isToolbarOpen, setIsToolbarOpen] = useState(true);
  const [viewMode, setViewMode] = useState<"single" | "double">("single");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageInputValue, setPageInputValue] = useState("1");

  useEffect(() => {
    const fetchSharedNote = async () => {
      try {
        const response = await api.get(`/notes/shared/${shareId}`);
        const fetchedNote: SharedNote = response.data;

        setNote(fetchedNote);
        setPages(normalizePages(fetchedNote));

        if (fetchedNote.templateId) {
          setTemplateId(fetchedNote.templateId);
        }
      } catch (err) {
        console.error("공유 노트 조회 실패:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (shareId) {
      fetchSharedNote();
    }
  }, [shareId]);

  useEffect(() => {
    setPageInputValue(String(currentPageIndex + 1));
  }, [currentPageIndex]);

  const moveToPage = (value: string) => {
    setPageInputValue(value);
    if (value.trim() === "") return;
    const pageNumber = Number(value);
    if (!Number.isInteger(pageNumber)) return;
    if (pageNumber < 1 || pageNumber > pages.length) return;
    setCurrentPageIndex(pageNumber - 1);
  };

  if (loading) {
    return (
      <div className="page">
        <div className="note-view-loading">공유 노트를 불러오는 중입니다...</div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="page">
        <div className="shared-note-error">
          <h2>공유된 노트를 찾을 수 없습니다</h2>
          <p>링크가 만료되었거나 공유가 해제된 노트입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page shared-note-page">
      {viewMode === "single" && (
        <header className="shared-note-header">
          <div className="shared-note-logo">
            <img src={logo} alt="One Gather 로고" />
          </div>

          <div className="shared-note-badge">📖 공유된 노트를 보고 있습니다</div>
        </header>
      )}

      <main className="main note-create-main shared-note-main">
        <section className="content note-create-content-section">
          <div className="note-create-board">
            <NoteViewer
              pages={pages}
              templateId={templateId}
              noteTitle={note.title}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              currentPageIndex={currentPageIndex}
              onPageIndexChange={setCurrentPageIndex}
            />
          </div>
        </section>

        {/* 플로팅 하단 툴바 */}
        {viewMode === "double" && (
          <div className={`shared-floating-toolbar ${isToolbarOpen ? "open" : "closed"}`}>
            <button
              type="button"
              className="shared-floating-toggle"
              onClick={() => setIsToolbarOpen((prev) => !prev)}
              title={isToolbarOpen ? "툴바 접기" : "툴바 펼치기"}
            >
              {isToolbarOpen ? <ChevronDown /> : <ChevronUp />}
            </button>

            <div className="shared-floating-panel">
              <div className="note-view-bottom-info-box">
                <span className="note-view-title-text">{note.title || "제목 없음"}</span>
                <span className="note-view-divider">|</span>
                <span className="note-view-page-info">
                  <span className="note-view-page-jump">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={pageInputValue}
                      onChange={(e) => moveToPage(e.target.value)}
                      onFocus={(e) => e.currentTarget.select()}
                      onBlur={() => setPageInputValue(String(currentPageIndex + 1))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") {
                          setPageInputValue(String(currentPageIndex + 1));
                          e.currentTarget.blur();
                        }
                      }}
                      aria-label="현재 페이지 입력"
                    />
                    <span className="note-view-page-total">page / {pages.length} page</span>
                  </span>
                </span>
              </div>

              {/* 한 페이지 보기 전환 버튼 */}
              <button
                type="button"
                className="note-view-share-mode-toggle"
                onClick={() => setViewMode("single")}
                title="한 페이지 보기"
              >
                <PanelTop size={18} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default SharedNotePage;