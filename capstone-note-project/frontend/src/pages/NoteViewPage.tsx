/* NoteViewPage */

import { Fragment, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { api } from "../api/api";

import "../styles/MainPage.css";
import "../styles/NoteCreatePage.css";
import "../styles/NoteViewPage.css";

import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";

/* 툴바 아이콘 - NoteCreatePage와 동일한 lucide-react 사용 */
import {
  BookOpen,
  PanelTop,
  Type,
  PenTool,
  Undo2,
  Redo2,
  Save,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* 노트 템플릿 이미지 */
import note1 from "../assets/content/content1.png";
import note2 from "../assets/content/content2.png";
import note3 from "../assets/content/content3.png";
import note4 from "../assets/content/content4.png";
import note5 from "../assets/content/content5.png";
import note6 from "../assets/content/content6.png";

const templateMap: Record<string, string> = {
  note1,
  note2,
  note3,
  note4,
  note5,
  note6,
};

type ViewHistorySnapshot = {
  pages: NotePage[];
  currentPageIndex: number;
};

type NoteImageItem = {
  url: string;
  widthPercent: number;
  x: number;
  y: number;
};

type NoteTextOverlay = {
  id: number;
  x: number;
  y: number;
  width: number;
  html: string;
};

type NotePage = {
  id: number;
  title: string;
  contentHtml: string;
  images: NoteImageItem[];
  drawingData?: string;
  textOverlays?: NoteTextOverlay[];
};

type Note = {
  id: number;
  title: string;
  content: string;
  contentHtml?: string;
  pages?: NotePage[];
  templateId?: string;
  createdAt?: string;
  updatedAt?: string;

  lastViewedAt?: string;
  lastViewedPage?: number;
  lastEditedPage?: number;
  deleted?: boolean;
};

const clonePages = (targetPages: NotePage[]) =>
  targetPages.map((page) => ({
    ...page,
    images: page.images.map((image) => ({ ...image })),
    textOverlays: (page.textOverlays ?? []).map((overlay) => ({ ...overlay })),
  }));

const isSameSnapshot = (
  a: ViewHistorySnapshot,
  b: ViewHistorySnapshot
) => JSON.stringify(a) === JSON.stringify(b);

const updateViewedNoteInLocalStorage = (viewedNote: Note) => {
    const viewedAt = viewedNote.lastViewedAt ?? new Date().toISOString();
    const viewedPage = viewedNote.lastViewedPage ?? 1;

    const normalizedNote = {
        ...viewedNote,
        lastViewedAt: viewedAt,
        lastViewedPage: viewedPage,
    };

    const storedRecent = localStorage.getItem("recentNotes");
    const recentNotes: Note[] = storedRecent ? JSON.parse(storedRecent) : [];

    const updatedRecentNotes = [
        normalizedNote,
        ...recentNotes.filter((item) => item.id !== normalizedNote.id),
    ].slice(0, 5);

    localStorage.setItem("recentNotes", JSON.stringify(updatedRecentNotes));

    const storedFavorite = localStorage.getItem("favoriteNotes");
    const favoriteNotes: Note[] = storedFavorite ? JSON.parse(storedFavorite) : [];

    const updatedFavoriteNotes = favoriteNotes.map((item) =>
        item.id === normalizedNote.id
        ? {
            ...item,
            ...normalizedNote,
            lastViewedAt: viewedAt,
            lastViewedPage: viewedPage,
            }
        : item
    );

    localStorage.setItem("favoriteNotes", JSON.stringify(updatedFavoriteNotes));
};

// 이미지의 containerstyle/wrapperstyle 커스텀 속성을 실제 div wrapper로 변환
function transformImageHtml(html: string): string {
  if (!html) return html;

  const BASE_WIDTH = 776;

  return html.replace(
    /<img([^>]*?)>/g,
    (match, attrs) => {
      const wrapperMatch = attrs.match(/wrapperstyle="([^"]*)"/);
      const containerMatch = attrs.match(/containerstyle="([^"]*)"/);

      // wrapperstyle/containerstyle이 없는 경우 → 크기 조정 안 한 이미지
      if (!wrapperMatch && !containerMatch) {
        // 이미 width 속성이나 style에 width가 있으면 그대로
        const hasWidthAttr = /\bwidth=/i.test(attrs);
        const hasWidthStyle = /style="[^"]*width:/i.test(attrs);
        if (hasWidthAttr || hasWidthStyle) return match;

        // width가 전혀 없으면 width: 100%를 style에 추가
        return `<img${attrs} style="width: 100%; height: auto;">`;
      }

      // 기존 로직 (wrapperstyle/containerstyle 처리)
      const wrapperStyle = wrapperMatch ? wrapperMatch[1] : "";
      let containerStyle = containerMatch ? containerMatch[1] : "";

      containerStyle = containerStyle.replace(
        /width:\s*(\d+(?:\.\d+)?)px/i,
        (_: string, pxVal: string) => {
          const percent = (parseFloat(pxVal) / BASE_WIDTH) * 100;
          return `width: ${percent.toFixed(2)}%`;
        }
      );

      let cleanAttrs = attrs
        .replace(/\s*wrapperstyle="[^"]*"/g, "")
        .replace(/\s*containerstyle="[^"]*"/g, "")
        .replace(/\s*width="\d+"/g, "")
        .replace(/style="([^"]*)"/g, (_m: string, s: string) => {
          const cleanedStyle = s.replace(/width:\s*\d+(?:\.\d+)?px;?\s*/gi, "");
          return cleanedStyle.trim() ? `style="${cleanedStyle}"` : "";
        });

      return `<div style="${wrapperStyle}"><div style="${containerStyle}"><img${cleanAttrs} style="width: 100%; height: auto;"></div></div>`;
    }
  );
}

function NoteViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [note, setNote] = useState<Note | null>(null);
    const [pages, setPages] = useState<NotePage[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState(0);
    const [searchText, setSearchText] = useState("");
    const [templateId, setTemplateId] = useState("note1");
    const [pageInputValue, setPageInputValue] = useState("1");

    const totalPages = pages.length;
    const currentPage = pages[currentPageIndex] ?? null;
    const selectedTemplateImage = templateMap[templateId] ?? note1;
    const selectedTemplateNum = templateId.replace("note", "");

    const [isEditing, setIsEditing] = useState(false);
    const [editTool, setEditTool] = useState<"text" | "pen" | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [viewMode, setViewMode] = useState<"single" | "double">("single");
    const [isToolbarOpen, setIsToolbarOpen] = useState(true);
    const [isMovingTextOverlay, setIsMovingTextOverlay] = useState(false);
    const [selectedTextOverlay, setSelectedTextOverlay] = useState<{
        pageIndex: number;
        overlayId: number;
    } | null>(null);

    const [showTextToolbar, setShowTextToolbar] = useState(false);
    const [showDrawToolbar, setShowDrawToolbar] = useState(false);
    const [drawColor, setDrawColor] = useState("#3E4A3E");
    const [drawSize, setDrawSize] = useState(4);
    const [isEraser, setIsEraser] = useState(false);

    const [lastAutoSavedAt, setLastAutoSavedAt] = useState("");
    const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);

    const drawToolbarRef = useRef<HTMLDivElement | null>(null);
    const autoSaveIndicatorTimerRef = useRef<number | null>(null);
    const textRef = useRef<HTMLDivElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const isDrawingRef = useRef(false);
    const autoSaveTimerRef = useRef<number | null>(null);
    const justSavedDrawingDataRef = useRef<string | undefined>(undefined);
    const lastTrackedPageRef = useRef<string | null>(null);
    const paperRef = useRef<HTMLDivElement | null>(null);
    const noteRef = useRef<Note | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement | null>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const textOverlayRefs = useRef<Record<number, HTMLDivElement | null>>({});
    const dragTextOverlayRef = useRef<{
        pageIndex: number;
        overlayId: number;
        startClientX: number;
        startClientY: number;
        startX: number;
        startY: number;
        finalX: number;
        finalY: number;
    } | null>(null);

    const [isDrawingDirty, setIsDrawingDirty] = useState(false);
    const [historyState, setHistoryState] = useState<{
        stack: ViewHistorySnapshot[];
        index: number;
    }>({
        stack: [],
        index: -1,
    });

    const canUndo = historyState.index > 0;
    const canRedo = historyState.index < historyState.stack.length - 1;

    const formatAutoSaveTime = (date: Date) => {
        return date.toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
        });
    };

    const spreadStartIndex = Math.floor(currentPageIndex / 2) * 2;

    const maxSpreadStartIndex = Math.max(
    0,
    Math.floor((totalPages - 1) / 2) * 2
    );

    const canGoPrevSpread = spreadStartIndex > 0;
    const canGoNextSpread = spreadStartIndex < maxSpreadStartIndex;

    const handlePrevSpread = () => {
    setCurrentPageIndex((prev) => {
        const currentSpreadStart = Math.floor(prev / 2) * 2;
        return Math.max(0, currentSpreadStart - 2);
    });
    };

    const handleNextSpread = () => {
    setCurrentPageIndex((prev) => {
        const currentSpreadStart = Math.floor(prev / 2) * 2;
        return Math.min(maxSpreadStartIndex, currentSpreadStart + 2);
        });
    };

    useEffect(() => {
        setPageInputValue(String(currentPageIndex + 1));
    }, [currentPageIndex]);

    const moveToPage = (value: string) => {
        setPageInputValue(value);

        if (value.trim() === "") return;

        const pageNumber = Number(value);

        if (!Number.isInteger(pageNumber)) return;
        if (pageNumber < 1 || pageNumber > totalPages) return;

        setCurrentPageIndex(pageNumber - 1);
    };

    const renderPageJumpControl = () => {
    return (
        <span className="note-view-page-jump">
        <input
            type="text"
            inputMode="numeric"
            value={pageInputValue}
            onChange={(e) => moveToPage(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={() => {
            setPageInputValue(String(currentPageIndex + 1));
            }}
            onKeyDown={(e) => {
            if (e.key === "Enter") {
                e.currentTarget.blur();
            }

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
    };

    useEffect(() => {
      const fetchNote = async () => {
        lastTrackedPageRef.current = null;
        try {
        // Create 페이지에서 navigate state로 최신 데이터를 전달했으면 그걸 우선 사용
        const routeState = location.state as {
          freshNote?: Note;
          initialPage?: number;
          fromCreate?: boolean;
        } | null;

        const freshNoteFromState = routeState?.freshNote;

        const initialPageFromState =
          typeof routeState?.initialPage === "number"
            ? routeState.initialPage
            : undefined;

        let fetchedNote: Note;

        if (freshNoteFromState) {
          console.log("[View] Create에서 전달받은 최신 데이터 사용", {
            updatedAt: freshNoteFromState.updatedAt,
            pages: (freshNoteFromState.pages ?? []).map((p: any) => ({
              id: p.id,
              drawingDataLength: p.drawingData?.length ?? 0,
            })),
          });
          fetchedNote = freshNoteFromState;      // ← if 분기에서 할당
        } else {
          const response = await api.get(`/notes/${id}`, {
            headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" },
          });
          fetchedNote = response.data;            // ← else 분기에서도 할당
        }

        // 페이지 데이터 초기화
        let loadedPages: NotePage[];

        if (Array.isArray(fetchedNote.pages) && fetchedNote.pages.length > 0) {
          loadedPages = fetchedNote.pages.map((page: any, index: number) => ({
            id: page.id,
            title: page.title ?? (index === 0 ? (fetchedNote.title ?? "") : ""),
            contentHtml: page.contentHtml || (index === 0 ? (fetchedNote.contentHtml ?? fetchedNote.content ?? "") : ""),
            images: Array.isArray(page.images) ? page.images : [],
            drawingData: page.drawingData,
            textOverlays: Array.isArray(page.textOverlays) ? page.textOverlays : [],
          }));
        } else {
          loadedPages = [
            {
              id: 1,
              title: fetchedNote.title ?? "",
              contentHtml: fetchedNote.contentHtml ?? fetchedNote.content ?? "",
              images: [],
              drawingData: undefined,
              textOverlays: [],
            },
          ];
        }

        const lastPage =
          initialPageFromState ??
          fetchedNote.lastViewedPage ??
          fetchedNote.lastEditedPage ??
          1;

        const nextPageIndex = Math.min(
          Math.max(lastPage - 1, 0),
          loadedPages.length - 1
        );

        const normalizedFetchedNote: Note = {
          ...fetchedNote,
          pages: loadedPages,
        };

        setNote(normalizedFetchedNote);
        noteRef.current = normalizedFetchedNote;

        console.log("📥 NoteViewPage 로딩됨:", {
          noteId: fetchedNote.id,
          updatedAt: fetchedNote.updatedAt,
          pages: loadedPages.map((p) => ({
            id: p.id,
            drawingDataLength: p.drawingData?.length ?? 0,
            hasDrawing: !!p.drawingData,
          })),
          contentHtmlOfFirstPage: loadedPages[0]?.contentHtml,
        });
        setPages(loadedPages);
        setCurrentPageIndex(nextPageIndex);

        setHistoryState({
          stack: [
            {
              pages: clonePages(loadedPages),
              currentPageIndex: nextPageIndex,
            },
          ],
          index: 0,
        });

        // 템플릿 ID 설정
        if (fetchedNote.templateId) {
          setTemplateId(fetchedNote.templateId);
        }
      } catch (error) {
        console.error("노트 상세 조회 또는 열람 기록 저장 실패:", error);
      }
    };

    if (id) {
      fetchNote();
    }
  }, [id]);

  // noteRef를 항상 최신 note로 동기화 (effect dependency에서 note 제거하기 위해)
  useEffect(() => {
    noteRef.current = note;
  }, [note]);
 
  useEffect(() => {
    const currentNote = noteRef.current;
    if (!id || !currentNote || pages.length === 0) return;

    // URL의 노트 ID와 현재 불러온 노트 ID가 다르면 저장하지 않음
    if (Number(id) !== currentNote.id) return;

    const viewedPage = Math.min(
      Math.max(currentPageIndex + 1, 1),
      pages.length
    );

    const trackingKey = `${id}:${viewedPage}`;

    // 같은 페이지에 대한 중복 요청 방지
    if (lastTrackedPageRef.current === trackingKey) return;

    lastTrackedPageRef.current = trackingKey;

    const viewedAt = new Date().toISOString();

    const updatedNote: Note = {
      ...currentNote,
      pages,
      lastViewedAt: viewedAt,
      lastViewedPage: viewedPage,
    };

    // 서버에 마지막 열람 페이지 저장
    api
      .post(`/notes/${id}/view`, {
        page: viewedPage,
      })
      .catch((error) => {
        console.error("마지막 열람 페이지 저장 실패:", error);

        // 요청 실패 시 같은 페이지에서 다시 시도할 수 있게 초기화
        if (lastTrackedPageRef.current === trackingKey) {
          lastTrackedPageRef.current = null;
        }
      });

    // 최근학습과 즐겨찾기 로컬 스토리지 갱신
    updateViewedNoteInLocalStorage(updatedNote);
 
    // noteRef와 note 상태 갱신 (note를 deps에 넣지 않으므로 ref로 직접 업데이트)
    noteRef.current = updatedNote;
    setNote(updatedNote);
  }, [id, pages, currentPageIndex]);

  const handleDelete = async () => {
    const storedFavoriteNotes = localStorage.getItem("favoriteNotes");
    const favoriteNotes: Note[] = storedFavoriteNotes
      ? JSON.parse(storedFavoriteNotes)
      : [];

    const isFavoriteNote = favoriteNotes.some((item) => item.id === Number(id));

    const confirmed = window.confirm(
      isFavoriteNote
        ? "이 노트는 즐겨찾기에 등록되어 있습니다. 정말 삭제하시겠습니까?"
        : "정말 이 노트를 삭제하시겠습니까?"
    );

    if (!confirmed) return;

    try {
      await api.delete(`/notes/${id}`);

      const storedRecentNotes = localStorage.getItem("recentNotes");
      if (storedRecentNotes) {
        const recentNotes = JSON.parse(storedRecentNotes);
        const updated = recentNotes.filter(
          (item: Note) => item.id !== Number(id)
        );
        localStorage.setItem("recentNotes", JSON.stringify(updated));
      }

      const storedFavoriteNotesAgain = localStorage.getItem("favoriteNotes");
      if (storedFavoriteNotesAgain) {
        const favNotes = JSON.parse(storedFavoriteNotesAgain);
        const updated = favNotes.filter(
          (item: Note) => item.id !== Number(id)
        );
        localStorage.setItem("favoriteNotes", JSON.stringify(updated));
      }

      alert("노트가 삭제되었습니다.");
      navigate("/");
    } catch (error) {
      console.error("노트 삭제 실패:", error);
      alert("노트 삭제에 실패했습니다.");
    }
  };

  const handlePrevPage = () => {
    if (viewMode === "single") {
      setCurrentPageIndex((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentPageIndex((prev) => Math.max(0, prev - 2));
    }
  };

  const handleNextPage = () => {
    if (viewMode === "single") {
      setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 1));
    } else {
      setCurrentPageIndex((prev) => Math.min(totalPages - 1, prev + 2));
    }
  };

  const isEmptyContentHtml = (html?: string | null) => {
    const normalized = html ?? "";

    // img 태그가 있으면 비어있지 않음
    if (/<img\s/i.test(normalized)) return false;

    const text = normalized
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;/gi, "")
      .replace(/<[^>]*>/g, "")
      .trim();

    return text.length === 0;
  };

  const isEmptyOverlayHtml = (html: string) => {
    return html
      .replace(/<br\s*\/?>/gi, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/<[^>]*>/g, "")
      .trim()
      .length === 0;
  };

  const getUpdatedPages = () => {
    return pages.map((page, index) => {
      if (index !== currentPageIndex) return page;

      const updatedTextOverlays = (page.textOverlays ?? [])
        .map((overlay) => {
          const html =
            textOverlayRefs.current[overlay.id]?.innerHTML ?? overlay.html;
          return {
            ...overlay,
            html,
          };
        })
        .filter((overlay) => !isEmptyOverlayHtml(overlay.html));

      const updatedViewDrawingData =
        isDrawingDirty && canvasRef.current
          ? canvasRef.current.toDataURL("image/png")
          : page.drawingData;

      return {
        ...page,
        contentHtml: page.contentHtml,
        textOverlays: updatedTextOverlays,
        drawingData: updatedViewDrawingData,
      };
    });
  };

  const pushHistorySnapshot = (
    nextPages: NotePage[],
    nextPageIndex = currentPageIndex
  ) => {
    const nextSnapshot: ViewHistorySnapshot = {
      pages: clonePages(nextPages),
      currentPageIndex: nextPageIndex,
    };

    setHistoryState((prev) => {
      const trimmedStack = prev.stack.slice(0, prev.index + 1);
      const currentSnapshot = trimmedStack[trimmedStack.length - 1];

      if (currentSnapshot && isSameSnapshot(currentSnapshot, nextSnapshot)) {
        console.log("⚠️ 동일한 스냅샷 - history 건너뜀");
        return prev;
      }

      console.log("✅ history 추가됨, 새 index:", trimmedStack.length);
      return {
        stack: [...trimmedStack, nextSnapshot],
        index: trimmedStack.length,
      };
    });
  };

  const applyPagesWithHistory = (
    nextPages: NotePage[],
    nextPageIndex = currentPageIndex
  ) => {
    console.log("📝 NoteViewPage: applyPagesWithHistory 호출됨");
    setPages(nextPages);
    setCurrentPageIndex(nextPageIndex);
    setIsDirty(true);
    pushHistorySnapshot(nextPages, nextPageIndex);
  };

  const restoreOverlayDom = (snapshot: ViewHistorySnapshot) => {
    window.setTimeout(() => {
      const page = snapshot.pages[snapshot.currentPageIndex];
      if (!page) return;

      (page.textOverlays ?? []).forEach((overlay) => {
        const el = textOverlayRefs.current[overlay.id];
        if (el) {
          el.innerHTML = overlay.html;
        }
      });
    }, 0);
  };

  const applyHistorySnapshot = (snapshot: ViewHistorySnapshot) => {
    setPages(clonePages(snapshot.pages));
    setCurrentPageIndex(snapshot.currentPageIndex);
    setIsDirty(true);
    restoreOverlayDom(snapshot);
  };

  const handleUndo = () => {
    if (!canUndo) return;

    const snapshot = historyState.stack[historyState.index - 1];
    applyHistorySnapshot(snapshot);

    setHistoryState((prev) => ({
      ...prev,
      index: prev.index - 1,
    }));
  };

  const handleRedo = () => {
    if (!canRedo) return;

    const snapshot = historyState.stack[historyState.index + 1];
    applyHistorySnapshot(snapshot);

    setHistoryState((prev) => ({
      ...prev,
      index: prev.index + 1,
    }));
  };

  const handleSave = async (pagesToSave?: NotePage[]) => {
    if (!note) return;

    try {
      const updatedPages = pagesToSave ?? getUpdatedPages();

      const payload = {
        title: note.title,
        contentHtml: updatedPages[0]?.contentHtml ?? "",
        content: updatedPages[0]?.contentHtml ?? "",
        pages: updatedPages,
        templateId: note.templateId ?? templateId,
        lastEditedPage: currentPageIndex + 1,
      };

      await api.put(`/notes/${note.id}`, payload);

      const updatedNote = {
        ...note,
        ...payload,
        updatedAt: new Date().toISOString(),
      };

      const currentSavedPage = updatedPages[currentPageIndex];
      justSavedDrawingDataRef.current = currentSavedPage?.drawingData;

      setPages(updatedPages);
      setNote(updatedNote);
      setIsDirty(false);
      setIsDrawingDirty(false);

      const formattedTime = formatAutoSaveTime(new Date());
      setLastAutoSavedAt(formattedTime);
      setShowAutoSaveIndicator(true);

      if (autoSaveIndicatorTimerRef.current) {
        window.clearTimeout(autoSaveIndicatorTimerRef.current);
      }

      autoSaveIndicatorTimerRef.current = window.setTimeout(() => {
        setShowAutoSaveIndicator(false);
      }, 2500);

      updateViewedNoteInLocalStorage({
        ...updatedNote,
        lastViewedPage: currentPageIndex + 1,
      });
    } catch (error) {
      console.error("노트 저장 실패:", error);
      alert("노트 저장에 실패했습니다.");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifierPressed = e.ctrlKey || e.metaKey;
      if (!isModifierPressed) return;

      const key = e.key.toLowerCase();

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [note, pages, currentPageIndex, canUndo, canRedo]);

  useEffect(() => {
    if (!isEditing || !isDirty) return;

    // 텍스트 덧쓰기 중에는 자동저장을 실행하지 않음
    // 자동저장이 실행되면 contentEditable 커서가 앞으로 튀는 문제가 생김
    if (editTool === "text") return;

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      handleSave();
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [isDirty, isEditing, editTool, pages, currentPageIndex]);

  // viewMode가 바뀌면 canvas가 remount될 수 있으므로
  // justSavedDrawingDataRef를 초기화해서 다음 effect가 PNG를 정상 로드하게 함
  useEffect(() => {
    justSavedDrawingDataRef.current = undefined;
  }, [viewMode]);

  // 캔버스 고정 해상도 (drawingData PNG가 항상 이 크기로 저장됨)
  const CANVAS_WIDTH = 860;
  const CANVAS_HEIGHT = 1180;

  useEffect(() => {
    if (isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas || !currentPage) return;

    // 1. canvas 내부 해상도는 항상 고정 (CSS가 디스플레이 크기 처리)
    if (canvas.width !== CANVAS_WIDTH) canvas.width = CANVAS_WIDTH;
    if (canvas.height !== CANVAS_HEIGHT) canvas.height = CANVAS_HEIGHT;

    // 2. drawingData 그리기
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (
      currentPage.drawingData !== undefined &&
      currentPage.drawingData === justSavedDrawingDataRef.current
    ) {
      justSavedDrawingDataRef.current = undefined;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!currentPage.drawingData) {
      setIsDrawingDirty(false);
      return;
    }

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setIsDrawingDirty(false);
    };

    img.src = currentPage.drawingData;
  }, [viewMode, currentPageIndex, currentPage?.id, currentPage?.drawingData]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (drawToolbarRef.current?.contains(target)) return;

      // 툴바 밖 클릭 시 닫기
      setShowDrawToolbar(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    useEffect(() => {
      if (viewMode !== "single") return;

      const scrollArea = scrollAreaRef.current;
      const targetPage = pageRefs.current[currentPageIndex];

      if (!scrollArea || !targetPage) return;

      const scrollAreaRect = scrollArea.getBoundingClientRect();
      const targetPageRect = targetPage.getBoundingClientRect();

      const nextScrollTop =
          scrollArea.scrollTop + targetPageRect.top - scrollAreaRect.top - 18;

      scrollArea.scrollTo({
          top: nextScrollTop,
          behavior: "smooth",
      });
    }, [currentPageIndex, viewMode]);

    if (!note) {
      return (
          <div className="page">
          <div className="note-view-loading">노트를 불러오는 중입니다...</div>
          </div>
      );
    }

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const paper = paperRef.current;
    if (!canvas || !paper) return { x: 0, y: 0 };

    const canvasRect = canvas.getBoundingClientRect();
    const paperRect = paper.getBoundingClientRect();

    // canvas가 paper 기준으로 얼마나 아래에 있는지 확인
    console.log("canvas top - paper top:", canvasRect.top - paperRect.top);

    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    return {
      x: (e.clientX - canvasRect.left) * scaleX,
      y: (e.clientY - canvasRect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isEditing || editTool !== "pen") return;

        e.preventDefault();

        const canvas = canvasRef.current;
        if (!canvas) return;

        e.currentTarget.setPointerCapture(e.pointerId);

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const { x, y } = getCanvasPoint(e);

        const debugRect = canvas.getBoundingClientRect();
        console.log("좌표 진단:", {
            clientX: e.clientX,
            clientY: e.clientY,
            rectLeft: debugRect.left,
            rectTop: debugRect.top,
            rectWidth: debugRect.width,
            rectHeight: debugRect.height,
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            finalX: x,
            finalY: y,
        });

        isDrawingRef.current = true;

        ctx.beginPath();
        ctx.lineWidth = drawSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (isEraser) {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = drawColor;
        }

        ctx.moveTo(x, y);

        // 클릭만 해도 점처럼 지워지거나 그려지게 처리
        ctx.lineTo(x + 0.1, y + 0.1);
        ctx.stroke();
    };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !isEditing || editTool !== "pen") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCanvasPoint(e);

    ctx.lineWidth = drawSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isEraser) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = drawColor;
    }

    ctx.lineTo(x, y);
    ctx.stroke();

    setIsDirty(true);
    setIsDrawingDirty(true);
};

  const handlePointerUp = (e?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;

    if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.globalCompositeOperation = "source-over";
    }

    const drawingData = canvas.toDataURL("image/png");

    const nextPages = pages.map((page, index) =>
      index === currentPageIndex
        ? {
            ...page,
            drawingData,
          }
        : page
    );

    setIsDrawingDirty(false);
    applyPagesWithHistory(nextPages);
  };

  const handleDeleteTextOverlay = (
    targetPageIndex: number,
    targetOverlayId: number
  ) => {
    const nextPages = pages.map((page, index) => {
      if (index !== targetPageIndex) return page;

      const updatedTextOverlays = (page.textOverlays ?? [])
        .map((overlay) => ({
          ...overlay,
          html: textOverlayRefs.current[overlay.id]?.innerHTML ?? overlay.html,
        }))
        .filter((overlay) => overlay.id !== targetOverlayId);

      return {
        ...page,
        textOverlays: updatedTextOverlays,
      };
    });

    delete textOverlayRefs.current[targetOverlayId];
    setSelectedTextOverlay(null);

    applyPagesWithHistory(nextPages, targetPageIndex);
    void handleSave(nextPages);
  };

  const clampPercent = (value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  };

  const handleTextOverlayMoveStart = (
    e: React.PointerEvent<HTMLButtonElement>,
    pageIndex: number,
    overlay: NoteTextOverlay
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const paper = paperRef.current;
    if (!paper) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    setIsMovingTextOverlay(true);

    setCurrentPageIndex(pageIndex);
    setSelectedTextOverlay({
      pageIndex,
      overlayId: overlay.id,
    });

    dragTextOverlayRef.current = {
      pageIndex,
      overlayId: overlay.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: overlay.x,
      startY: overlay.y,
      finalX: overlay.x,
      finalY: overlay.y,
    };
  };

  const handleTextOverlayMove = (
    e: React.PointerEvent<HTMLButtonElement>
  ) => {
    const dragInfo = dragTextOverlayRef.current;
    if (!dragInfo) return;

    e.preventDefault();
    e.stopPropagation();

    const paper = paperRef.current;
    if (!paper) return;

    const rect = paper.getBoundingClientRect();

    const movedX = ((e.clientX - dragInfo.startClientX) / rect.width) * 100;
    const movedY = ((e.clientY - dragInfo.startClientY) / rect.height) * 100;

    const nextX = clampPercent(dragInfo.startX + movedX, 0, 96);
    const nextY = clampPercent(dragInfo.startY + movedY, 0, 96);

    dragInfo.finalX = nextX;
    dragInfo.finalY = nextY;

    setPages((prevPages) =>
      prevPages.map((page, index) =>
        index === dragInfo.pageIndex
          ? {
              ...page,
              textOverlays: (page.textOverlays ?? []).map((item) =>
                item.id === dragInfo.overlayId
                  ? {
                      ...item,
                      x: nextX,
                      y: nextY,
                    }
                  : item
              ),
            }
          : page
      )
    );

    setIsDirty(true);
  };

  const handleTextOverlayMoveEnd = (
    e?: React.PointerEvent<HTMLButtonElement>
  ) => {
    const dragInfo = dragTextOverlayRef.current;
    if (!dragInfo) return;

    if (e?.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const basePages = getUpdatedPages();

    const nextPages = basePages.map((page, index) =>
      index === dragInfo.pageIndex
        ? {
            ...page,
            textOverlays: (page.textOverlays ?? []).map((item) =>
              item.id === dragInfo.overlayId
                ? {
                    ...item,
                    x: dragInfo.finalX,
                    y: dragInfo.finalY,
                  }
                : item
            ),
          }
        : page
    );

    dragTextOverlayRef.current = null;

    applyPagesWithHistory(nextPages, dragInfo.pageIndex);
    void handleSave(nextPages);

    // 이동이 끝난 텍스트를 다시 선택 상태로 유지
    setSelectedTextOverlay({
      pageIndex: dragInfo.pageIndex,
      overlayId: dragInfo.overlayId,
    });

    window.setTimeout(() => {
      setSelectedTextOverlay({
        pageIndex: dragInfo.pageIndex,
        overlayId: dragInfo.overlayId,
      });

      setIsMovingTextOverlay(false);
    }, 80);
  };

  const handleAddTextOverlay = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || editTool !== "text" || !currentPage) return;

    const target = e.target as HTMLElement;

    if (target.closest(".note-view-text-overlay")) {
      return;
    }

    const paper = paperRef.current;
    if (!paper) return;

    const rect = paper.getBoundingClientRect();

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newOverlay: NoteTextOverlay = {
      id: Date.now(),
      x,
      y,
      width: 32,
      html: "",
    };

    const nextPages = pages.map((page, index) =>
      index === currentPageIndex
        ? {
            ...page,
            textOverlays: [...(page.textOverlays ?? []), newOverlay],
          }
        : page
    );

    applyPagesWithHistory(nextPages);

    setSelectedTextOverlay({
      pageIndex: currentPageIndex,
      overlayId: newOverlay.id,
    });

    setTimeout(() => {
      const editor = textOverlayRefs.current[newOverlay.id];
      if (!editor) return;

      editor.focus();

      const range = document.createRange();
      const selection = window.getSelection();

      range.selectNodeContents(editor);
      range.collapse(false);

      selection?.removeAllRanges();
      selection?.addRange(range);
    }, 0);
  };

  return (
    <div className="page">
      <div className="layout">
        {viewMode === "single" && (
          <aside className="sidebar">
            <div>
              <div
                className="sidebar-logo"
                onClick={() => navigate("/")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") navigate("/");
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
                <button type="button" onClick={() => navigate("/favorite")}>
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
        )}

        {/* 메인 영역 */}
        <main className={`main note-create-main ${viewMode === "double" ? "main-fullwidth" : ""}`}>
          {/* 상단 검색바 */}
          {viewMode === "single" && (
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
                        src="/src/assets/icon/search.png" 
                        alt="검색" 
                    />
                </div>
          </div>
          )}

          {/* 노트 뷰어 섹션 */}
          <section className="content note-create-content-section">
            <div className="note-create-board">

              {/* 뷰어 상단바 - 한 페이지 모드일 때만 */}
              {viewMode === "single" && (
                <div className="note-view-topbar">
                  <button
                    type="button"
                    className="note-view-edit-button"
                    onClick={async () => {
                      await handleSave();

                      navigate(`/notes/${note.id}/edit`, {
                        state: {
                          note,
                          initialPage: currentPageIndex + 1,
                        },
                      });
                    }}
                  >
                    수정하기
                  </button>

                  <div className="note-view-title-bar">
                    <span className="note-view-title-text">{note.title || "제목 없음"}</span>
                    <span className="note-view-divider">|</span>
                    <span className="note-view-page-info">
                      {renderPageJumpControl()}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="note-view-home-button"
                    onClick={() => navigate("/")}
                    title="홈으로"
                  >
                    홈으로
                  </button>
                </div>
              )}

              {/* 워크스페이스 */}
              <div className="note-create-workspace">
                <div className="note-create-paper-column">
                  <div
                    ref={scrollAreaRef}
                    className={`note-create-scroll-area ${
                      totalPages > 1 ? "has-multiple-pages" : ""
                    }`}
                  >
                    <div className="note-create-pages">
                      {(() => {
                        // 단일 페이지 렌더링 함수 - single/double 모드에서 공통 사용
                        const renderPaper = (
                          pageIndex: number,
                          extraClassName: string = ""
                        ) => {
                          const page = pages[pageIndex];
                          if (!page) return null;

                          const isContentEmpty = isEmptyContentHtml(page.contentHtml);

                          return (
                          <div
                            key={page.id}
                            ref={(el) => {
                                pageRefs.current[pageIndex] = el;

                                if (pageIndex === currentPageIndex) {
                                    paperRef.current = el;
                                }
                            }}
                            className={`note-create-paper template-${selectedTemplateNum} note-view-paper ${extraClassName} ${
                                pageIndex === currentPageIndex ? "note-view-paper-active" : ""
                            } ${
                            isEditing && editTool === "text" && pageIndex === currentPageIndex
                                ? "text-mode"
                                : ""
                            }`}
                            style={{ backgroundImage: `url(${selectedTemplateImage})` }}
                            onClick={(e) => {
                              setCurrentPageIndex(pageIndex);

                              if (pageIndex === currentPageIndex) {
                                handleAddTextOverlay(e);
                              }
                            }}
                          >
                            {/* 제목 - 첫 페이지에만 표시 */}
                            <div className="note-create-title-input note-view-paper-title">
                              {page.title && page.title.trim() !== "" ? page.title : "\u00A0"}
                            </div>

                            {/* 본문 */}
                            <div className="note-view-body">
                              {!isContentEmpty && (
                                <div
                                  ref={pageIndex === currentPageIndex ? textRef : null}
                                  className="note-view-content-html"
                                  dangerouslySetInnerHTML={{
                                    __html: transformImageHtml(page.contentHtml || ""),
                                  }}
                                />
                              )}

                              {isContentEmpty && !isEditing && (
                                <div className="note-view-content-empty">내용이 없습니다.</div>
                              )}
                            </div>

                            {/* 자유 배치 이미지 오버레이 - paper 기준 */}
                            {page.images && page.images.length > 0 &&
                              page.images.map((img, idx) => (
                                <div
                                  key={idx}
                                  className="note-view-image-overlay"
                                  style={{
                                    left: `${img.x}%`,
                                    top: `${img.y}%`,
                                    width: `${img.widthPercent}%`,
                                  }}
                                >
                                  <img
                                    src={img.url}
                                    alt={`첨부 이미지 ${idx + 1}`}
                                    className="note-view-inline-image"
                                    draggable={false}
                                  />
                                </div>
                            ))}

                            {(page.textOverlays ?? []).map((overlay) => (
                              <Fragment key={overlay.id}>
                                <div
                                  ref={(el) => {
                                    textOverlayRefs.current[overlay.id] = el;

                                    if (!el) return;
                                    if (el.dataset.overlayInitialized === "true") return;

                                    el.innerHTML = overlay.html;
                                    el.dataset.overlayInitialized = "true";
                                  }}
                                  className={`note-view-text-overlay ${
                                    isEditing && editTool === "text" && pageIndex === currentPageIndex
                                      ? "editable"
                                      : ""
                                  } ${
                                    selectedTextOverlay?.pageIndex === pageIndex &&
                                    selectedTextOverlay?.overlayId === overlay.id
                                      ? "selected"
                                      : ""
                                  }`}
                                  style={{
                                    left: `${overlay.x}%`,
                                    top: `${overlay.y}%`,
                                    maxWidth: `calc(100% - ${overlay.x}% - 42px)`,
                                  }}
                                  contentEditable={
                                    isEditing && editTool === "text" && pageIndex === currentPageIndex
                                  }
                                  suppressContentEditableWarning
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentPageIndex(pageIndex);
                                    setSelectedTextOverlay({
                                      pageIndex,
                                      overlayId: overlay.id,
                                    });
                                  }}
                                  onInput={() => {
                                    setIsDirty(true);
                                  }}
                                  onBlur={(e) => {
                                    const html = e.currentTarget.innerHTML;

                                    let nextPages = getUpdatedPages();

                                    if (isEmptyOverlayHtml(html)) {
                                      nextPages = nextPages.map((targetPage, targetIndex) =>
                                        targetIndex === currentPageIndex
                                          ? {
                                              ...targetPage,
                                              textOverlays: (targetPage.textOverlays ?? []).filter(
                                                (item) => item.id !== overlay.id
                                              ),
                                            }
                                          : targetPage
                                      );

                                      delete textOverlayRefs.current[overlay.id];

                                      setSelectedTextOverlay((prev) =>
                                        prev?.overlayId === overlay.id ? null : prev
                                      );
                                    }

                                    applyPagesWithHistory(nextPages);
                                    void handleSave(nextPages);
                                  }}
                                />

                                {isEditing &&
                                  editTool === "text" &&
                                  pageIndex === currentPageIndex &&
                                  selectedTextOverlay?.pageIndex === pageIndex &&
                                  selectedTextOverlay?.overlayId === overlay.id && (
                                    <>
                                      <button
                                        type="button"
                                        className={`note-view-text-overlay-delete ${
                                          isMovingTextOverlay ? "moving" : ""
                                        }`}
                                        style={{
                                          left: `calc(${overlay.x}% - 10px)`,
                                          top: `calc(${overlay.y}% - 10px)`,
                                        }}
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handleDeleteTextOverlay(pageIndex, overlay.id);
                                        }}
                                        title="덧쓰기 텍스트 삭제"
                                      >
                                        ×
                                      </button>

                                      <button
                                        type="button"
                                        className={`note-view-text-overlay-move ${
                                          isMovingTextOverlay ? "moving" : ""
                                        }`}
                                        style={{
                                          left: `calc(${overlay.x}% + 18px)`,
                                          top: `calc(${overlay.y}% - 10px)`,
                                        }}
                                        onPointerDown={(e) => {
                                          handleTextOverlayMoveStart(e, pageIndex, overlay);
                                        }}
                                        onPointerMove={handleTextOverlayMove}
                                        onPointerUp={handleTextOverlayMoveEnd}
                                        onPointerCancel={handleTextOverlayMoveEnd}
                                        title="덧쓰기 텍스트 이동"
                                      >
                                        ⠿
                                      </button>
                                    </>
                                  )}
                              </Fragment>
                            ))}

                            {page.drawingData && pageIndex !== currentPageIndex && (
                              <img
                                src={page.drawingData}
                                alt="드로잉"
                                className="note-view-drawing-overlay"
                              />
                            )}

                            {pageIndex === currentPageIndex && (
                              <canvas
                                ref={canvasRef}
                                width={860}
                                height={1180}
                                className={`note-view-canvas ${
                                  isEditing && editTool === "pen" ? "active" : ""
                                }`}
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                              />
                            )}

                            {/* 페이지 번호 */}
                            <div className="note-create-page-number">
                                {pageIndex + 1}
                            </div>
                          </div>
                          );
                        };

                        // ===== 한 페이지 모드 =====
                        if (viewMode === "single") {
                          return pages.map((_, pageIndex) => renderPaper(pageIndex));
                        }

                        // ===== 두 페이지 모드 =====
                        // renderPaper를 재사용해서 좌/우 페이지에 동일한 기능(텍스트 덧쓰기, 펜 그리기, 이동/삭제) 사용
                        return (
                          <div className="note-view-double-pages">
                            {/* 왼쪽 페이지 */}
                            {pages[spreadStartIndex]
                              ? renderPaper(spreadStartIndex, "note-view-paper-double")
                              : (
                                <div className="note-create-paper note-view-paper-double note-view-paper-empty">
                                  <div className="note-create-page-number">-</div>
                                </div>
                              )}

                            {/* 오른쪽 페이지 */}
                            {pages[spreadStartIndex + 1]
                              ? renderPaper(spreadStartIndex + 1, "note-view-paper-double")
                              : (
                                <div className="note-create-paper note-view-paper-double note-view-paper-empty">
                                  <div className="note-create-page-number">-</div>
                                </div>
                              )}
                          </div>
                        );
                      })()}
                        </div>
                    </div>

                    {/* 페이지 넘김 버튼 - 두 페이지 모드에서만 표시 */}
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

                    {viewMode === "double" && (
                      <div
                        className={`note-view-floating-toolbar ${
                          isToolbarOpen ? "open" : "closed"
                        }`}
                      >
                        {showAutoSaveIndicator && (
                          <div className="note-view-floating-autosave">
                            자동 저장됨 · {lastAutoSavedAt}
                          </div>
                        )}

                        {/* 접기 / 펼치기 버튼 */}
                        <button
                            type="button"
                            className="note-view-floating-toggle"
                            onClick={() => setIsToolbarOpen((prev) => !prev)}
                            title={isToolbarOpen ? "툴바 접기" : "툴바 펼치기"}
                        >
                            {isToolbarOpen ? <ChevronDown /> :  <ChevronUp />}
                        </button>

                        {/* 실제 하단 툴바 내용 */}
                        <div className="note-view-floating-panel">
                        {/* 1. 노트 정보 박스 */}
                        <div className="note-view-bottom-info-box">
                            <span className="note-view-title-text">
                            {note.title || "제목 없음"}
                            </span>

                            <span className="note-view-divider">|</span>

                            <span className="note-view-page-info">
                                {renderPageJumpControl()}
                            </span>
                        </div>

                        {/* 2. 가로 툴바 박스 */}
                        <div className="note-view-bottom-toolbar-box">
                            <button
                                type="button"
                                onClick={() => {
                                    setCurrentPageIndex(spreadStartIndex);
                                    setViewMode("single");
                                    setIsToolbarOpen(true);
                                    setIsEditing(false);
                                    setEditTool(null);
                                    setShowDrawToolbar(false);
                                }}
                                title="한 페이지 보기"
                            >
                                <PanelTop />
                            </button>

                            <button
                            type="button"
                            className={isEditing && editTool === "text" ? "active" : ""}
                            onClick={() => {
                                if (isEditing && editTool === "text") {
                                setIsEditing(false);
                                setEditTool(null);
                                setSelectedTextOverlay(null);
                                textRef.current?.blur();
                                return;
                                }

                                setIsEditing(true);
                                setEditTool("text");
                                setShowDrawToolbar(false);
                                setSelectedTextOverlay(null);
                                textRef.current?.blur();
                            }}
                            title="텍스트 덧쓰기"
                            >
                            <Type />
                            </button>

                            <button
                            type="button"
                            className={isEditing && editTool === "pen" ? "active" : ""}
                            onClick={() => {
                                if (isEditing && editTool === "pen") {
                                setIsEditing(false);
                                setEditTool(null);
                                setShowDrawToolbar(false);
                                return;
                                }

                                setIsEditing(true);
                                setEditTool("pen");
                                setShowDrawToolbar(true);
                            }}
                            title="그리기 편집"
                            >
                            <PenTool />
                            </button>

                            {/* 드로잉 옵션 패널 (한 페이지 모드 우측 툴바와 동일) */}
                            <div
                              ref={drawToolbarRef}
                              className={`note-create-draw-toolbar ${showDrawToolbar ? "open" : ""}`}
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <label className="note-create-draw-tool-field">
                                <span>색상</span>
                                <input
                                  type="color"
                                  value={drawColor}
                                  onChange={(e) => {
                                    setDrawColor(e.target.value);
                                    setIsEraser(false);
                                  }}
                                />
                              </label>

                              <label className="note-create-draw-tool-field">
                                <span>굵기: {drawSize}</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="20"
                                  value={drawSize}
                                  onChange={(e) => setDrawSize(Number(e.target.value))}
                                />
                              </label>

                              <button
                                type="button"
                                className="note-create-draw-button"
                                onClick={() => setIsEraser((prev) => !prev)}
                                style={{
                                  backgroundColor: isEraser ? "#3e4a3e" : "transparent",
                                  color: isEraser ? "#f5f4ed" : "#3e4a3e",
                                }}
                              >
                                {isEraser ? "✏️ 그리기" : "지우개"}
                              </button>

                              <button
                                type="button"
                                className="note-create-draw-button note-create-draw-clear"
                                onClick={() => {
                                  if (!window.confirm("그렸던 그림이 전체 삭제됩니다. 계속하시겠습니까?")) return;

                                  const canvas = canvasRef.current;
                                  if (!canvas) return;

                                  const ctx = canvas.getContext("2d");
                                  if (!ctx) return;

                                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                                  setIsDrawingDirty(true);
                                  setIsDirty(true);

                                  const nextPages = pages.map((page, index) =>
                                    index === currentPageIndex
                                      ? { ...page, drawingData: canvas.toDataURL("image/png") }
                                      : page
                                  );

                                  applyPagesWithHistory(nextPages);
                                }}
                              >
                                🗑️ 전체 지우기
                              </button>
                            </div>

                            <button
                            type="button"
                            className={canUndo ? "active" : ""}
                            onClick={handleUndo}
                            disabled={!canUndo}
                            title="되돌리기"
                            >
                            <Undo2 />
                            </button>

                            <button
                              type="button"
                              className={canRedo ? "active" : ""}
                              onClick={handleRedo}
                              disabled={!canRedo}
                              title="다시 실행"
                            >
                            <Redo2 />
                            </button>

                            <button
                              type="button"
                              title="저장"
                              onClick={() => {
                                  void handleSave();
                              }}
                            >
                            <Save />
                            </button>
                        </div>

                        {/* 3. 수정하기 버튼 */}
                        <button
                            type="button"
                            className="note-view-bottom-edit-button"
                            onClick={() =>
                              navigate(`/notes/${note.id}/edit`, {
                                state: {
                                  note,
                                  initialPage: currentPageIndex + 1,
                                },
                              })
                            }
                          >
                            수정하기
                        </button>
                        </div>
                    </div>
                    )}
                </div>

                {/* 우측 툴바 - 한 페이지 모드에서만 표시 */}
                {viewMode === "single" && (
                  <div className="note-create-toolbar-wrap">
                    <div className="note-create-toolbar note-view-toolbar">
                      <button
                        type="button"
                        onClick={() => setViewMode("double")}
                        title="두 페이지 보기"
                      >
                        <BookOpen />
                      </button>

                      <button
                        type="button"
                        className={isEditing && editTool === "text" ? "active" : ""}
                        onClick={() => {
                          if (isEditing && editTool === "text") {
                            setIsEditing(false);
                            setEditTool(null);
                            setSelectedTextOverlay(null);
                            textRef.current?.blur();
                            return;
                          }

                          setIsEditing(true);
                          setEditTool("text");
                          setShowDrawToolbar(false);
                          setSelectedTextOverlay(null);
                          textRef.current?.blur();
                        }}
                        title="텍스트 덧쓰기"
                      >
                        <Type />
                      </button>

                      <button
                        type="button"
                        className={isEditing && editTool === "pen" ? "active" : ""}
                        onClick={() => {
                          if (isEditing && editTool === "pen") {
                            setIsEditing(false);
                            setEditTool(null);
                            setShowDrawToolbar(false);
                            return;
                          }

                          setIsEditing(true);
                          setEditTool("pen");
                          setShowDrawToolbar(true);
                        }}
                        title="그리기 편집"
                      >
                        <PenTool />
                      </button>

                      <div
                        ref={drawToolbarRef}
                        className={`note-create-draw-toolbar ${showDrawToolbar ? "open" : ""}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <label className="note-create-draw-tool-field">
                          <span>색상</span>
                          <input
                            type="color"
                            value={drawColor}
                            onChange={(e) => {
                              setDrawColor(e.target.value);
                              setIsEraser(false);
                            }}
                          />
                        </label>

                        <label className="note-create-draw-tool-field">
                          <span>굵기: {drawSize}</span>
                          <input
                            type="range"
                            min="1"
                            max="20"
                            value={drawSize}
                            onChange={(e) => setDrawSize(Number(e.target.value))}
                          />
                        </label>

                        <button
                          type="button"
                          className="note-create-draw-button"
                          onClick={() => setIsEraser((prev) => !prev)}
                          style={{
                            backgroundColor: isEraser ? "#3e4a3e" : "transparent",
                            color: isEraser ? "#f5f4ed" : "#3e4a3e",
                          }}
                        >
                          {isEraser ? "✏️ 그리기" : "지우개"}
                        </button>

                        <button
                          type="button"
                          className="note-create-draw-button note-create-draw-clear"
                          onClick={() => {
                            if (!window.confirm("그렸던 그림이 전체 삭제됩니다. 계속하시겠습니까?")) return;

                            const canvas = canvasRef.current;
                            if (!canvas) return;

                            const ctx = canvas.getContext("2d");
                            if (!ctx) return;

                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            setIsDrawingDirty(true);
                            setIsDirty(true);

                            const nextPages = pages.map((page, index) =>
                              index === currentPageIndex
                                ? { ...page, drawingData: canvas.toDataURL("image/png") }
                                : page
                            );

                            applyPagesWithHistory(nextPages);
                          }}
                        >
                          🗑️ 전체 지우기
                        </button>
                      </div>

                      <button
                        type="button"
                        className={canUndo ? "active" : ""}
                        onClick={handleUndo}
                        disabled={!canUndo}
                        title="되돌리기"
                      >
                        <Undo2 />
                      </button>

                      <button
                        type="button"
                        className={canRedo ? "active" : ""}
                        onClick={handleRedo}
                        disabled={!canRedo}
                        title="다시 실행"
                      >
                        <Redo2 />
                      </button>

                      <button
                        type="button"
                        title="저장"
                        onClick={() => {
                          void handleSave();
                        }}
                      >
                        <Save />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
              {showAutoSaveIndicator && viewMode === "single" && (
                <div className="note-create-autosave-indicator">
                  자동 저장됨 · {lastAutoSavedAt}
                </div>
              )}
        </main>
      </div>
    </div>
  );
}

export default NoteViewPage;