import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, PanelTop } from "lucide-react";
import NotePaper from "./NotePaper";
import type { NotePage } from "../utils/noteHelpers";

type NoteViewerProps = {
  pages: NotePage[];
  templateId: string;
  noteTitle: string;
  viewMode: "single" | "double";
  onViewModeChange: (mode: "single" | "double") => void;
  currentPageIndex: number;
  onPageIndexChange: (index: number) => void;
};

function NoteViewer({ pages, templateId, noteTitle, viewMode, onViewModeChange, currentPageIndex, onPageIndexChange }: NoteViewerProps) {
  const [pageInputValue, setPageInputValue] = useState("1");

  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const totalPages = pages.length;
  const spreadStartIndex = Math.floor(currentPageIndex / 2) * 2;
  const maxSpreadStartIndex = Math.max(0, Math.floor((totalPages - 1) / 2) * 2);
  const canGoPrevSpread = spreadStartIndex > 0;
  const canGoNextSpread = spreadStartIndex < maxSpreadStartIndex;

  useEffect(() => {
    setPageInputValue(String(currentPageIndex + 1));
  }, [currentPageIndex]);

  useEffect(() => {
    if (viewMode !== "single") return;

    const scrollArea = scrollAreaRef.current;
    const targetPage = pageRefs.current[currentPageIndex];

    if (!scrollArea || !targetPage) return;

    const scrollAreaRect = scrollArea.getBoundingClientRect();
    const targetPageRect = targetPage.getBoundingClientRect();

    const nextScrollTop =
      scrollArea.scrollTop + targetPageRect.top - scrollAreaRect.top - 18;

    scrollArea.scrollTo({ top: nextScrollTop, behavior: "smooth" });
  }, [currentPageIndex, viewMode]);

  const moveToPage = (value: string) => {
    setPageInputValue(value);
    if (value.trim() === "") return;

    const pageNumber = Number(value);
    if (!Number.isInteger(pageNumber)) return;
    if (pageNumber < 1 || pageNumber > totalPages) return;

    onPageIndexChange(pageNumber - 1);
  };

  const handlePrevSpread = () => {
    const start = Math.floor(currentPageIndex / 2) * 2;
    onPageIndexChange(Math.max(0, start - 2));
  };

  const handleNextSpread = () => {
    const start = Math.floor(currentPageIndex / 2) * 2;
    onPageIndexChange(Math.min(maxSpreadStartIndex, start + 2));
  };
  
  const renderPageJumpControl = () => (
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
      <span className="note-view-page-total">
        page / {totalPages} page
      </span>
    </span>
  );

  return (
    <div
      className={`note-viewer-root ${
        viewMode === "double" ? "main-fullwidth note-viewer-double" : ""
      }`}
    >
      {/* 상단 정보바 */}
      {viewMode === "single" && (
        <div className="note-view-topbar shared-view-topbar">
          <div className="note-view-title-bar">
            <span className="note-view-title-text">
              {noteTitle || "제목 없음"}
            </span>
            <span className="note-view-divider">|</span>
            <span className="note-view-page-info">
              {renderPageJumpControl()}
            </span>
          </div>

          {/* 보기 모드 토글 */}
          <button
            type="button"
            className="note-view-share-mode-toggle"
            onClick={() => {
              if (viewMode === "single") {
                onViewModeChange("double");
              } else {
                onViewModeChange("single");
                onPageIndexChange(spreadStartIndex);
              }
            }}
            title={viewMode === "single" ? "두 페이지 보기" : "한 페이지 보기"}
          >
            {viewMode === "single" ? <BookOpen size={18} /> : <PanelTop size={18} />}
          </button>
        </div>
      )}

      {/* 페이지 영역 */}
      <div className="note-create-workspace">
        <div className="note-create-paper-column">
          <div
            ref={scrollAreaRef}
            className={`note-create-scroll-area ${
              totalPages > 1 ? "has-multiple-pages" : ""
            }`}
          >
            <div className="note-create-pages">
              {viewMode === "single" ? (
                pages.map((page, pageIndex) => (
                  <div
                    key={page.id}
                    ref={(el) => {
                      pageRefs.current[pageIndex] = el;
                    }}
                    onClick={() => onPageIndexChange(pageIndex)}
                  >
                    <NotePaper
                      page={page}
                      pageIndex={pageIndex}
                      templateId={templateId}
                      extraClassName={
                        pageIndex === currentPageIndex
                          ? "note-view-paper-active"
                          : ""
                      }
                    />
                  </div>
                ))
              ) : (
                <div className="note-view-double-pages">
                  {pages[spreadStartIndex] ? (
                    <div onClick={() => onPageIndexChange(spreadStartIndex)}>
                      <NotePaper
                        page={pages[spreadStartIndex]}
                        pageIndex={spreadStartIndex}
                        templateId={templateId}
                        extraClassName={`note-view-paper-double ${spreadStartIndex === currentPageIndex ? "note-view-paper-active" : ""}`}
                      />
                    </div>
                  ) : (
                    <div className="note-create-paper note-view-paper-double note-view-paper-empty">
                      <div className="note-create-page-number">-</div>
                    </div>
                  )}

                  {pages[spreadStartIndex + 1] ? (
                    <div onClick={() => onPageIndexChange(spreadStartIndex + 1)}>
                      <NotePaper
                        page={pages[spreadStartIndex + 1]}
                        pageIndex={spreadStartIndex + 1}
                        templateId={templateId}
                        extraClassName={`note-view-paper-double ${spreadStartIndex + 1 === currentPageIndex ? "note-view-paper-active" : ""}`}
                      />
                    </div>
                  ) : (
                    <div className="note-create-paper note-view-paper-double note-view-paper-empty">
                      <div className="note-create-page-number">-</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* double 모드 페이지 넘김 버튼 */}
          {viewMode === "double" && (
            <>
              <button
                type="button"
                className="note-view-spread-arrow note-view-spread-arrow-left"
                onClick={handlePrevSpread}
                disabled={!canGoPrevSpread}
                title="이전 페이지"
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                className="note-view-spread-arrow note-view-spread-arrow-right"
                onClick={handleNextSpread}
                disabled={!canGoNextSpread}
                title="다음 페이지"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoteViewer;