/* NoteCreatePage */

import "../styles/MainPage.css"
import "../styles/NoteCreatePage.css";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useLocation ,useNavigate } from "react-router-dom";
import { api } from "../api/api";
import { uploadImageToCloudinary } from "../api/cloudinary";

import logo from "../assets/logo.png";
import sidebarBook from "../assets/icon/sidebar_book.png";
import searchIcon from "../assets/icon/search.png";

import { Type,  PenTool, Image as ImageIcon, Undo2, Redo2, Trash2, Save, Sidebar,
  AlignLeft, AlignCenter, AlignRight} from "lucide-react";
import PageEditor from "../components/PageEditor";

/* 이미지 임포트 */
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

type NoteImageItem = {
  url: string;
  widthPercent: number;
  x: number;   // % 단위 (왼쪽 기준)
  y: number;   // % 단위 (위쪽 기준)
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

type EditorSnapshot = {
  title: string;
  pages: NotePage[];
  activePageId: number;
};

const clonePages = (targetPages: NotePage[]) =>
  targetPages.map((page) => ({
    ...page,
    images: page.images.map((image) => ({ ...image })),
    textOverlays: (page.textOverlays ?? []).map((overlay) => ({ ...overlay })),
  }));

const normalizeContentHtml = (html?: string | null) => {
  const rawHtml = html ?? "";

  // img 태그가 있으면 유효한 콘텐츠로 간주
  if (/<img\s/i.test(rawHtml)) return rawHtml;

  const text = rawHtml
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();
  return text.length === 0 ? "" : rawHtml;
};

const isSameSnapshot = (a: EditorSnapshot, b: EditorSnapshot) =>
  JSON.stringify(a) === JSON.stringify(b);

function NoteCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [searchText, setSearchText] = useState("");
  const [activePageId, setActivePageId] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showTextToolbar, setShowTextToolbar] = useState(false);
  const [, setToolbarRefreshKey] = useState(0);
  const refreshToolbarState = useCallback(() => {
    setToolbarRefreshKey((prev) => prev + 1);
  }, []);
  const [displayFontSize, setDisplayFontSize] = useState("20px");
  const [savedNoteId, setSavedNoteId] = useState<number | null>(null);
  const [isLoadingNote, setIsLoadingNote] = useState(() => {
    // location.state에 note가 있으면 (수정 모드) 로딩 시작
    return !!location.state?.note?.id;
});
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState("");
  const [showAutoSaveIndicator, setShowAutoSaveIndicator] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<{
    pageId: number;
    imageIndex: number;
  } | null>(null);
  const autoSaveIndicatorTimerRef = useRef<number | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const bodyAreaRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const imageListRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const editorRefs = useRef<Record<number, any>>({});
  const textToolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const colorPickerActiveRef = useRef(false);

  // 그리기 관련
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [showDrawToolbar, setShowDrawToolbar] = useState(false);
  const [drawColor, setDrawColor] = useState("#3E4A3E");
  const [drawSize, setDrawSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const drawToolbarRef = useRef<HTMLDivElement | null>(null);
  const drawHistoryRefs = useRef<Record<number, ImageData[]>>({});
  const drawHistoryIndexRefs = useRef<Record<number, number>>({});
  const [, setDrawRenderTick] = useState(0);
  const triggerDrawRerender = () => setDrawRenderTick((t) => t + 1);
  const resizingImageRef = useRef<{
    pageId: number;
    imageIndex: number;
    startX: number;
    startWidthPercent: number;
  } | null>(null);
  const draggingImageRef = useRef<{
    pageId: number;
    imageIndex: number;
    startMouseX: number;
    startMouseY: number;
    startX: number;
    startY: number;
  } | null>(null);
  

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const contentUploadPreset =
    import.meta.env.VITE_CLOUDINARY_CONTENT_UPLOAD_PRESET ?? "one_gather_images_content";

  const [pages, setPages] = useState<NotePage[]>([
    { id: 1, title: "", contentHtml: "", images: [], textOverlays: [] },
  ]);

  const initialSnapshot: EditorSnapshot = {
    title: "",
    pages: [{ id: 1, title: "", contentHtml: "", images: [], textOverlays: [] }],
    activePageId: 1,
  };

  const [historyState, setHistoryState] = useState<{
    stack: EditorSnapshot[];
    index: number;
  }>({
    stack: [initialSnapshot],
    index: 0,
  });

  const canUndo = historyState.index > 0;
  const canRedo = historyState.index < historyState.stack.length - 1;

  const applySnapshot = (snapshot: EditorSnapshot) => {
    setTitle(snapshot.title);
    setPages(clonePages(snapshot.pages));
    setActivePageId(snapshot.activePageId);
  };

  const updateEditorState = (
    nextTitle: string,
    nextPages: NotePage[],
    nextActivePageId: number
  ) => {
    const normalizedPages = clonePages(nextPages);

    const snapshot: EditorSnapshot = {
      title: nextTitle,
      pages: normalizedPages,
      activePageId: nextActivePageId,
    };

    setTitle(nextTitle);
    setPages(normalizedPages);
    setActivePageId(nextActivePageId);

    setHistoryState((prev) => {
      const trimmed = prev.stack.slice(0, prev.index + 1);
      const currentSnapshot = trimmed[trimmed.length - 1];

      if (currentSnapshot && isSameSnapshot(currentSnapshot, snapshot)) {
        return prev;
      }

      return {
        stack: [...trimmed, snapshot],
        index: trimmed.length,
      };
    });
  };

  const isCanvasEmpty = (canvas: HTMLCanvasElement): boolean => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    // alpha 채널(매 4번째 값)이 모두 0이면 빈 캔버스
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 0) return false;
    }
    return true;
  };

  const handleUndo = () => {
    if (isDrawingMode) {
      const pageId = activePageId;
      const history = drawHistoryRefs.current[pageId];
      const currentIndex = drawHistoryIndexRefs.current[pageId] ?? -1;
      if (!history || currentIndex <= 0) return;

      const newIndex = currentIndex - 1;
      const canvas = canvasRefs.current[pageId];
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.putImageData(history[newIndex], 0, 0);
        drawHistoryIndexRefs.current[pageId] = newIndex;
        triggerDrawRerender();

        const isEmpty = isCanvasEmpty(canvas);
        const dataUrl = isEmpty ? undefined : canvas.toDataURL("image/png");
        setPages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, drawingData: dataUrl } : p))
        );
      }
      return;
    }

    if (!canUndo) return;

    const snapshot = historyState.stack[historyState.index - 1];
    applySnapshot(snapshot);

    setHistoryState((prev) => ({
      ...prev,
      index: prev.index - 1,
    }));
  };

  const handleRedo = () => {
    if (isDrawingMode) {
      const pageId = activePageId;
      const history = drawHistoryRefs.current[pageId];
      const currentIndex = drawHistoryIndexRefs.current[pageId] ?? -1;
      if (!history || currentIndex >= history.length - 1) return;

      const newIndex = currentIndex + 1;
      const canvas = canvasRefs.current[pageId];
      const ctx = canvas?.getContext("2d");
      if (ctx && canvas) {
        ctx.putImageData(history[newIndex], 0, 0);
        drawHistoryIndexRefs.current[pageId] = newIndex;
        triggerDrawRerender();

        const isEmpty = isCanvasEmpty(canvas);
        const dataUrl = isEmpty ? undefined : canvas.toDataURL("image/png");
        setPages((prev) =>
          prev.map((p) => (p.id === pageId ? { ...p, drawingData: dataUrl } : p))
        );
      }
      return;
    }

    if (!canRedo) return;

    const snapshot = historyState.stack[historyState.index + 1];
    applySnapshot(snapshot);

    setHistoryState((prev) => ({
      ...prev,
      index: prev.index + 1,
    }));
  };

  const templateId = location.state?.templateId ?? location.state?.note?.templateId ?? "note1";
  const selectedTemplateId = templateId.replace("note", "");
  const selectedTemplateImage = templateMap[templateId] ?? note1;

  const handleAddPage = () => {
    const newPageId = Date.now();
    const nextPages = [
      ...pages,
      { id: newPageId, title: "", contentHtml: "", images: [] },
    ];
    updateEditorState(title, nextPages, newPageId);
  };

  const handleChangePageContentHtml = (id: number, html: string) => {
    const nextPages = pages.map((page) =>
      page.id === id ? { ...page, contentHtml: html } : page
    );

    updateEditorState(title, nextPages, activePageId);
  };

  const handleChangePageTitle = (id: number, newTitle: string) => {
    const nextPages = pages.map((page) =>
      page.id === id ? { ...page, title: newTitle } : page
    );

    // 1페이지의 제목은 노트 대표 제목(title)으로도 사용
    const isFirstPage = pages[0]?.id === id;
    const nextNoteTitle = isFirstPage ? newTitle : title;

    updateEditorState(nextNoteTitle, nextPages, activePageId);
  };

  const normalizedPagesForSave = pages.map((page) => ({
    ...page,
    contentHtml: normalizeContentHtml(page.contentHtml),
  }));

  const activePageNumber = Math.max(
    1,
    normalizedPagesForSave.findIndex(
      (page) => page.id === activePageId
    ) + 1
  );

  const mergedContent = normalizedPagesForSave
    .map((page) => page.contentHtml)
    .filter((contentHtml) => contentHtml.trim() !== "")
    .join("\n\n");

  const autoSaveTimerRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);
  const [saveRetryTick, setSaveRetryTick] = useState(0);

  const snapshotString = useMemo(
    () =>
      JSON.stringify({
        title,
        pages: pages.map((page) => ({
          id: page.id,
          title: page.title ?? "",             
          contentHtml: page.contentHtml,
          images: page.images,
          drawingData: page.drawingData,
          textOverlays: page.textOverlays ?? [],
        })),
      }),
    [title, pages]
  );

  const initialSnapshotString = JSON.stringify({
    title: "",
    pages: [{ id: 1, title: "", contentHtml: "", images: [] }],
  });

  const lastSavedSnapshotRef = useRef(initialSnapshotString);

  const hasAnyInput =
    title.trim() !== "" ||
    pages.some(
      (page) =>
        normalizeContentHtml(page.contentHtml).trim() !== "" ||
        page.images.length > 0 ||
        !!page.drawingData ||
        (page.textOverlays ?? []).length > 0
    );

  const hasUnsavedChanges =
    hasAnyInput && snapshotString !== lastSavedSnapshotRef.current;

  const formatAutoSaveTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSave = useCallback(async (silent = false, force = false) => {
    if (isSavingRef.current) {
      console.log("[Create] handleSave 중복 호출 무시 (이미 저장 중)", { silent });
      return false;
    }

    if (!force && snapshotString === lastSavedSnapshotRef.current && savedNoteId !== null) {
      console.log("[Create] handleSave 스킵 (변경사항 없음)", { silent });
      return true;
    }

    isSavingRef.current = true;

    try {
      console.log("[Create] handleSave 호출", {
        silent,
        savedNoteId,
        snapshotMatches: snapshotString === lastSavedSnapshotRef.current,
        drawingData: normalizedPagesForSave.map((p) => ({
          id: p.id,
          length: p.drawingData?.length ?? 0,
      })),
    });

      if (savedNoteId === null) {
        const response = await api.post("/notes", {
          title,
          contentHtml: mergedContent,
          pages: normalizedPagesForSave,
          templateId,
          lastEditedPage: activePageNumber,
        });

        console.log("첫 저장 성공:", response.data);
        setSavedNoteId(response.data.id); // 백엔드가 저장된 노트 id를 응답으로 준다고 가정
        lastSavedSnapshotRef.current = snapshotString;

        if (!silent) {
          alert("노트가 저장되었습니다.");
        }
      } else {
        await api.put(`/notes/${savedNoteId}`, {
          title,
          contentHtml: mergedContent,
          pages: normalizedPagesForSave,
          templateId,
          lastEditedPage: activePageNumber,
        });

        lastSavedSnapshotRef.current = snapshotString;

        if (!silent) {
          alert("노트가 수정되었습니다.");
        }
      }

      if (silent) {
        const formattedTime = formatAutoSaveTime(new Date());
        setLastAutoSavedAt(formattedTime);
        setShowAutoSaveIndicator(true);

        if (autoSaveIndicatorTimerRef.current) {
          window.clearTimeout(autoSaveIndicatorTimerRef.current);
        }

        autoSaveIndicatorTimerRef.current = window.setTimeout(() => {
          setShowAutoSaveIndicator(false);
        }, 2500);
      }

      return true;
    } catch (error) {
      console.error("저장 실패:", error);

      if (!silent) {
        alert("노트 저장에 실패했습니다.");
      }

      return false;
    } finally {
      isSavingRef.current = false;

      if (hasUnsavedChangesRef.current) {
        console.log("[Create] 저장 후에도 변경사항 있음 - 재렌더 트리거");
        setSaveRetryTick((t) => t + 1);
      }
    }
  }, [savedNoteId, title, mergedContent, normalizedPagesForSave, snapshotString, activePageNumber,]);

  const handleSaveRef = useRef(handleSave);
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);

  useEffect(() => {
    handleSaveRef.current = handleSave;
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [handleSave, hasUnsavedChanges]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    if (isLoadingNote) return;

    if (isSavingRef.current) {
      console.log("[Create] 자동저장 스킵 (이미 저장 중)");
      return;
    }

    console.log("[Create] 자동저장 타이머 시작 (1.2초)");

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = window.setTimeout(() => {
      console.log("[Create] 자동저장 실행");
      autoSaveTimerRef.current = null;
      void handleSaveRef.current(true);
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [savedNoteId, hasUnsavedChanges, isLoadingNote, saveRetryTick]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        // 디바운스 타이머가 살아있으면 즉시 저장 트리거
        if (autoSaveTimerRef.current) {
          window.clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
          void handleSaveRef.current(true);
        }
        // 사용자에게 확인 모달 표시
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
        if (hasUnsavedChangesRef.current) {
          void handleSaveRef.current(true);
        }
      }
    };
  }, []);

  const handleComplete = async () => {
    console.log("[Create] handleComplete 호출");

    if (autoSaveTimerRef.current) {
      window.clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    while (isSavingRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log("[Create] handleComplete - force 저장 실행");
    const isSaved = await handleSave(false, true);

    if (isSaved) {
      // 저장 직후 백엔드 처리 안정화를 위한 약간의 지연
      await new Promise((resolve) => setTimeout(resolve, 300));

      const targetId = savedNoteId ?? location.state?.note?.id;

      // ⭐ 검증용 GET - 저장된 데이터가 정말 우리가 보낸 것인지 확인
      let verifyNote: any = null;
      if (targetId) {
        try {
          const verifyResponse = await api.get(`/notes/${targetId}`, {
            headers: { "Cache-Control": "no-cache" },  // 캐시 우회
          });
          verifyNote = verifyResponse.data;
          console.log("[Create] 저장 검증 GET 결과:", {
            updatedAt: verifyNote.updatedAt,
            pages: (verifyNote.pages ?? []).map((p: any) => ({
              id: p.id,
              drawingDataLength: p.drawingData?.length ?? 0,
            })),
            sentDrawingData: normalizedPagesForSave.map((p) => ({
              id: p.id,
              drawingDataLength: p.drawingData?.length ?? 0,
            })),
          });

          // 보낸 데이터와 백엔드에 저장된 데이터가 일치하는지 비교
          const sentPagesStr = JSON.stringify(
            normalizedPagesForSave.map((p) => ({ id: p.id, drawingData: p.drawingData }))
          );
          const savedPagesStr = JSON.stringify(
            (verifyNote.pages ?? []).map((p: any) => ({ id: p.id, drawingData: p.drawingData }))
          );

          if (sentPagesStr !== savedPagesStr) {
            console.error("⚠️ [Create] 저장된 데이터가 보낸 데이터와 다름!");
            console.log("[Create] 데이터 불일치 - 재저장 시도");
            await handleSave(false, true);
            await new Promise((resolve) => setTimeout(resolve, 300));

            // 재저장 후 다시 검증 GET
            try {
              const reVerifyResponse = await api.get(`/notes/${targetId}`, {
                headers: { "Cache-Control": "no-cache" },
              });
              verifyNote = reVerifyResponse.data;
            } catch (e) {
              console.error("[Create] 재검증 실패:", e);
            }
          }
        } catch (error) {
          console.error("[Create] 저장 검증 실패:", error);
        }

        // ⭐ 핵심: 검증된 최신 데이터를 navigate state로 전달
        // View가 별도 GET을 하기 전에 이 데이터로 먼저 화면을 그릴 수 있음
        navigate(`/notes/${targetId}`, {
          state: {
            freshNote: verifyNote,
            fromCreate: true,
            initialPage: activePageNumber,
          },
        });
      } else {
        navigate("/");
      }
    }
  };
  
  const handleDeletePage = () => {
    if (pages.length === 1) {
      alert("마지막 페이지는 삭제할 수 없습니다.");
      return;
    }

    const currentIndex = pages.findIndex((page) => page.id === activePageId);
    const nextPages = pages.filter((page) => page.id !== activePageId);

    const nextIndex = currentIndex > 0 ? currentIndex - 1 : 0;
    const nextActivePageId = nextPages[nextIndex].id;

    updateEditorState(title, nextPages, nextActivePageId);
  };

  const handleDeleteSelectedImage = useCallback(() => {
    if (!selectedImageIndex) return;

    const { pageId, imageIndex } = selectedImageIndex;

    const targetPage = pages.find((page) => page.id === pageId);
    if (!targetPage) return;
    if (imageIndex < 0 || imageIndex >= targetPage.images.length) return;

    const nextPages = pages.map((page) =>
      page.id === pageId
        ? {
            ...page,
            images: page.images.filter((_, idx) => idx !== imageIndex),
          }
        : page
    );

    updateEditorState(title, nextPages, activePageId);
    setSelectedImageIndex(null);
  }, [selectedImageIndex, pages, title, activePageId]);

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  // 그리기 핸들러
  const getCanvasPos = (canvas: HTMLCanvasElement, e: React.MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, pageId: number) => {
    if (!isDrawingMode) return;
    if (pageId !== activePageId) return;

    setShowDrawToolbar(false);

  const canvas = canvasRefs.current[pageId];
    if (!canvas) return;

    // 첫 그림 전이면 빈 상태를 history에 먼저 저장
    if (!drawHistoryRefs.current[pageId] || drawHistoryRefs.current[pageId].length === 0) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawHistoryRefs.current[pageId] = [snapshot];
        drawHistoryIndexRefs.current[pageId] = 0;
      }
    }

    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPos(canvas, e);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, pageId: number) => {
    if (!isDrawingMode || !isDrawingRef.current) return;
    if (pageId !== activePageId) return;

    const canvas = canvasRefs.current[pageId];
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx || !lastPosRef.current) return;

    const pos = getCanvasPos(canvas, e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = isEraser ? "rgba(0,0,0,1)" : drawColor;
    ctx.lineWidth = drawSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (isEraser) {
      ctx.globalCompositeOperation = "destination-out";
    } else {
      ctx.globalCompositeOperation = "source-over";
    }

    ctx.stroke();
    lastPosRef.current = pos;
  };

  const handleCanvasMouseUp = (pageId: number) => {
    if (pageId !== activePageId) {  
      isDrawingRef.current = false;
      lastPosRef.current = null;
      return;
    }

    if (isDrawingRef.current) {
      const canvas = canvasRefs.current[pageId];
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const history = drawHistoryRefs.current[pageId] || [];
          const currentIndex = drawHistoryIndexRefs.current[pageId] ?? -1;
          const trimmed = history.slice(0, currentIndex + 1);
          drawHistoryRefs.current[pageId] = [...trimmed, snapshot];
          drawHistoryIndexRefs.current[pageId] = trimmed.length;
          triggerDrawRerender();

          const isEmpty = isCanvasEmpty(canvas);
          const dataUrl = isEmpty ? undefined : canvas.toDataURL("image/png");
          setPages((prev) =>
            prev.map((p) => (p.id === pageId ? { ...p, drawingData: dataUrl } : p))
          );
        }
      }
    }
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  const handleClearCanvas = () => {
    if (!window.confirm("그렸던 그림이 전체 삭제됩니다. 계속하시겠습니까?")) return;

    const pageId = activePageId;
    const canvas = canvasRefs.current[pageId];
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 전체 지우기 전 현재 상태를 history에 저장 (undo 가능하도록)
    if (!drawHistoryRefs.current[pageId] || drawHistoryRefs.current[pageId].length === 0) {
      const initial = ctx.getImageData(0, 0, canvas.width, canvas.height);
      drawHistoryRefs.current[pageId] = [initial];
      drawHistoryIndexRefs.current[pageId] = 0;
    }

    // canvas 전체 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 지워진 상태를 history에 저장
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const history = drawHistoryRefs.current[pageId] || [];
    const currentIndex = drawHistoryIndexRefs.current[pageId] ?? -1;
    const trimmed = history.slice(0, currentIndex + 1);
    drawHistoryRefs.current[pageId] = [...trimmed, snapshot];
    drawHistoryIndexRefs.current[pageId] = trimmed.length;
    triggerDrawRerender();

    setPages((prev) =>
      prev.map((p) => (p.id === pageId ? { ...p, drawingData: undefined } : p))
    );
  };

  const uploadImageToCloudinaryLocal = async (file: File) => {
    const result = await uploadImageToCloudinary(file, "content");
    return result.imageUrl;
  };

  const handleImageDragStart = (
    e: React.MouseEvent,
    pageId: number,
    imageIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetPage = pages.find((p) => p.id === pageId);
    if (!targetPage) return;
    const img = targetPage.images[imageIndex];
    if (!img) return;

    draggingImageRef.current = {
      pageId,
      imageIndex,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: img.x,
      startY: img.y,
    };
  };

  const handleImageResizeStart = (
    e: React.MouseEvent<HTMLDivElement>,
    pageId: number,
    imageIndex: number
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const targetPage = pages.find((page) => page.id === pageId);
    if (!targetPage) return;

    const targetImage = targetPage.images[imageIndex];
    if (!targetImage) return;

    resizingImageRef.current = {
      pageId,
      imageIndex,
      startX: e.clientX,
      startWidthPercent: targetImage.widthPercent,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // 리사이즈
      if (resizingImageRef.current) {
        const { pageId, imageIndex, startX, startWidthPercent } =
          resizingImageRef.current;

        const deltaX = e.clientX - startX;
        const deltaPercent = deltaX / 6;
        const nextWidth = Math.max(25, Math.min(100, startWidthPercent + deltaPercent));

        setPages((prevPages) =>
          prevPages.map((page) =>
            page.id === pageId
              ? {
                  ...page,
                  images: page.images.map((image, idx) =>
                    idx === imageIndex
                      ? { ...image, widthPercent: nextWidth }
                      : image
                  ),
                }
              : page
          )
        );
      }

      // 드래그 이동
      if (draggingImageRef.current) {
        const { pageId, imageIndex, startMouseX, startMouseY, startX, startY } =
          draggingImageRef.current;

        const paperEl = document.querySelector(
          `.note-create-paper[data-page-id="${pageId}"]`
        ) as HTMLElement | null;
        if (!paperEl) return;

        const rect = paperEl.getBoundingClientRect();
        const deltaXPercent = ((e.clientX - startMouseX) / rect.width) * 100;
        const deltaYPercent = ((e.clientY - startMouseY) / rect.height) * 100;

        const nextX = Math.max(0, Math.min(85, startX + deltaXPercent));
        const nextY = Math.max(0, Math.min(85, startY + deltaYPercent));

        setPages((prevPages) =>
          prevPages.map((page) =>
            page.id === pageId
              ? {
                  ...page,
                  images: page.images.map((image, idx) =>
                    idx === imageIndex
                      ? { ...image, x: nextX, y: nextY }
                      : image
                  ),
                }
              : page
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (resizingImageRef.current || draggingImageRef.current) {
        const currentPages = clonePages(pages);
        updateEditorState(title, currentPages, activePageId);
        resizingImageRef.current = null;
        draggingImageRef.current = null;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pages, title, activePageId]);

  const appendImageToActivePage = async (imageUrl: string) => {
    const canAdd = await canAddImageToActivePage(imageUrl);

    if (!canAdd) {
      alert("이 페이지에는 이미지를 더 넣을 수 없습니다. 새 페이지를 추가한 뒤 넣어주세요.");
      return;
    }

    const nextPages = pages.map((page) =>
      page.id === activePageId
        ? {
            ...page,
            images: [
              ...page.images,
              {
                url: imageUrl,
                widthPercent: 50,
                x: 10,
                y: 10
              },
            ],
          }
        : page
    );

    updateEditorState(title, nextPages, activePageId);
  };

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const imageUrl = await uploadImageToCloudinaryLocal(file);
      if (!imageUrl) return;

      const nextPages = pages.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              images: [
                ...page.images,
                { url: imageUrl, widthPercent: 50, x: 10, y: 10 },
              ],
            }
          : page
      );
      updateEditorState(title, nextPages, activePageId);
    } catch (error) {
      console.error("콘텐츠 이미지 업로드 실패:", error);
      alert("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploadingImage(false);
      e.target.value = "";
    }
  };

  const IMAGE_GAP = 12;
  const IMAGE_MAX_HEIGHT = 420;
  const PAGE_BOTTOM_SPARE = 18;
  const MIN_TEXT_HEIGHT = 120;

  const loadImageElement = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const canAddImageToActivePage = async (imageUrl: string) => {
    const bodyAreaEl = bodyAreaRefs.current[activePageId];
    const imageListEl = imageListRefs.current[activePageId];

    if (!bodyAreaEl) {
      return true;
    }

    const editorEl = bodyAreaEl.querySelector(
      ".note-create-content-editor"
    ) as HTMLElement | null;

    const img = await loadImageElement(imageUrl);

    const availableWidth =
      imageListEl?.clientWidth || Math.max(bodyAreaEl.clientWidth - 36, 100);

    const scaledHeight = Math.min(
      (img.naturalHeight / img.naturalWidth) * availableWidth,
      IMAGE_MAX_HEIGHT
    );

    const currentImagesHeight = imageListEl?.scrollHeight ?? 0;
    const nextImagesHeight =
      currentImagesHeight > 0
        ? currentImagesHeight + IMAGE_GAP + scaledHeight
        : scaledHeight;

    // 에디터 안 실제 텍스트의 마지막 위치를 기준으로 계산
    let actualTextHeight = 0;
    if (editorEl) {
      const lastChild = editorEl.lastElementChild as HTMLElement | null;
      if (lastChild) {
        actualTextHeight = lastChild.offsetTop + lastChild.offsetHeight;
      }
    }

    const textHeight = Math.max(actualTextHeight, MIN_TEXT_HEIGHT);
    const requiredHeight = nextImagesHeight + textHeight + PAGE_BOTTOM_SPARE;

    return requiredHeight <= bodyAreaEl.clientHeight;
  };

useEffect(() => {
  const handleWindowKeyDown = (e: globalThis.KeyboardEvent) => {
    const isModifierPressed = e.ctrlKey || e.metaKey;
    if (!isModifierPressed) return;

    const key = e.key.toLowerCase();

    if (key === "z" && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
    }

    if (key === "y" || (key === "z" && e.shiftKey)) {
      e.preventDefault();
      handleRedo();
    }

    if (key === "s") {
      e.preventDefault();
      void handleSave(true);
    }
  };

  window.addEventListener("keydown", handleWindowKeyDown);
  return () => window.removeEventListener("keydown", handleWindowKeyDown);
}, [handleSave, canUndo, canRedo]);

useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!hasUnsavedChanges) return;

    e.preventDefault();
    e.returnValue = "";
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [hasUnsavedChanges]);

  useEffect(() => {
    const handleDeleteSelectedImageByKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Backspace") return;
      if (!selectedImageIndex) return;

      const target = e.target as HTMLElement | null;
      const isTypingElement =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable;

      if (isTypingElement) return;

      e.preventDefault();
      handleDeleteSelectedImage();
    };

    window.addEventListener("keydown", handleDeleteSelectedImageByKey);
    return () =>
      window.removeEventListener("keydown", handleDeleteSelectedImageByKey);
  }, [selectedImageIndex, handleDeleteSelectedImage]);


  useEffect(() => {
    const editingNoteId = location.state?.note?.id;
    if (!editingNoteId) return;

    let isCancelled = false;

    api
      .get(`/notes/${editingNoteId}`)
      .then((response) => {
        if (isCancelled) return;

        const note = response.data;

        const rawPages = Array.isArray(note.pages) ? note.pages : [];

        const loadedPages: NotePage[] =
          rawPages.length > 0
              ? rawPages.map((page: any, index: number) => ({
                  id: typeof page.id === "number" ? page.id : index + 1,
                  title: page.title ?? (index === 0 ? (note.title ?? "") : ""),
                  contentHtml: page.contentHtml || (index === 0 ? (note.contentHtml ?? "") : ""),
                  images: Array.isArray(page.images) ? page.images : [],
                  drawingData: page.drawingData ?? undefined,
                  textOverlays: Array.isArray(page.textOverlays)
                    ? page.textOverlays
                    : [],
                }))
              : [
                  {
                      id: 1,
                      title: note.title ?? "",
                      contentHtml: note.contentHtml ?? "",
                      images: [],
                      drawingData: undefined,
                      textOverlays: [],
                  },
              ];

        const loadedTitle = note.title ?? "";

        const initialPageFromState =
          typeof location.state?.initialPage === "number"
            ? location.state.initialPage
            : undefined;

        const requestedPageNumber =
          initialPageFromState ??
          note.lastViewedPage ??
          note.lastEditedPage ??
          1;

        const safePageIndex = Math.min(
          Math.max(requestedPageNumber - 1, 0),
          loadedPages.length - 1
        );

        const nextActivePageId =
          loadedPages[safePageIndex]?.id ??
          loadedPages[0]?.id ??
          1;

        const loadedSnapshot: EditorSnapshot = {
          title: loadedTitle,
          pages: clonePages(loadedPages),
          activePageId: nextActivePageId,
        };

        const loadedSnapshotString = JSON.stringify({
          title: loadedTitle,
          pages: loadedPages.map((page) => ({
            id: page.id,
            title: page.title ?? "",                  
            contentHtml: page.contentHtml,
            images: page.images,
            drawingData: page.drawingData,
            textOverlays: page.textOverlays ?? [],
          })),
        });

        setTitle(loadedTitle);
        setPages(loadedPages);
        setActivePageId(nextActivePageId);
        setSavedNoteId(note.id ?? null);

        setHistoryState({
          stack: [loadedSnapshot],
          index: 0,
        });

        lastSavedSnapshotRef.current = loadedSnapshotString;

        setLastAutoSavedAt("");
        setShowAutoSaveIndicator(false);

        setIsLoadingNote(false);
      })
      .catch((error) => {
        console.error("노트 불러오기 실패:", error);
      });

    return () => {
      isCancelled = true;
    };
  }, [location.state]);

  // activePageId가 바뀌면 해당 페이지로 스크롤
  useEffect(() => {
    if (!activePageId) return;
 
    // 로딩이 끝난 뒤 DOM이 렌더된 다음 실행되도록 setTimeout 사용
    const timer = window.setTimeout(() => {
      const scrollArea = document.querySelector(".note-create-scroll-area") as HTMLElement | null;
      const targetPage = document.querySelector(
        `.note-create-paper[data-page-id="${activePageId}"]`
      ) as HTMLElement | null;
 
      if (!scrollArea || !targetPage) return;
 
      const scrollAreaRect = scrollArea.getBoundingClientRect();
      const targetPageRect = targetPage.getBoundingClientRect();
 
      const nextScrollTop =
        scrollArea.scrollTop + targetPageRect.top - scrollAreaRect.top - 18;
 
      scrollArea.scrollTo({ top: nextScrollTop, behavior: "smooth" });
    }, 100);
 
    return () => window.clearTimeout(timer);
  }, [activePageId]);

  // 활성 페이지가 바뀔 때마다 recentNotes/favoriteNotes의 lastViewedPage 갱신
  useEffect(() => {
    if (!savedNoteId) return;

    const activePageIndex = pages.findIndex((page) => page.id === activePageId);
    if (activePageIndex === -1) return;

    const currentPageNumber = activePageIndex + 1;
    const viewedAt = new Date().toISOString();

    const noteForStorage = {
      id: savedNoteId,
      title,
      pages: pages.map((p) => ({ id: p.id })),
      lastViewedAt: viewedAt,
      lastViewedPage: currentPageNumber,
    };

    // recentNotes 갱신
    const storedRecent = localStorage.getItem("recentNotes");
    const recentNotes = storedRecent ? JSON.parse(storedRecent) : [];
    const updatedRecent = recentNotes.map((item: any) =>
      item.id === savedNoteId
        ? { ...item, ...noteForStorage }
        : item
    );
    localStorage.setItem("recentNotes", JSON.stringify(updatedRecent));

    // favoriteNotes 갱신
    const storedFavorite = localStorage.getItem("favoriteNotes");
    const favoriteNotes = storedFavorite ? JSON.parse(storedFavorite) : [];
    const updatedFavorite = favoriteNotes.map((item: any) =>
      item.id === savedNoteId
        ? { ...item, ...noteForStorage }
        : item
    );
    localStorage.setItem("favoriteNotes", JSON.stringify(updatedFavorite));
  }, [activePageId, savedNoteId]);

  const handleNavigateWithSaveCheck = useCallback(
    async (path: string) => {
      // 처음 한 번도 저장 안 했고, 입력한 내용이 있으면
      // 바로 이동하지 말고 커스텀 모달을 띄움
      if (savedNoteId === null && hasAnyInput) {
        setPendingPath(path);
        setShowLeaveModal(true);
        return;
      }

      // 변경사항이 없으면 바로 이동
      if (!hasUnsavedChanges) {
        navigate(path);
        return;
      }

      // 이미 한 번 저장된 노트는 자동저장 후 이동
      const saved = await handleSave(true);
      if (!saved) return;

      navigate(path);
    },
    [savedNoteId, hasAnyInput, hasUnsavedChanges, handleSave, navigate]
  );

  const handleSaveAndLeave = async () => {
    if (!pendingPath) return;

    const saved = await handleSave(false);
    if (!saved) return;

    setShowLeaveModal(false);
    navigate(pendingPath);
    setPendingPath(null);
  };

  const handleLeaveWithoutSave = () => {
    if (!pendingPath) return;

    setShowLeaveModal(false);
    navigate(pendingPath);
    setPendingPath(null);
  };

  const handleCancelLeave = () => {
    setShowLeaveModal(false);
    setPendingPath(null);
  };

  useEffect(() => {
    return () => {
      if (autoSaveIndicatorTimerRef.current) {
        window.clearTimeout(autoSaveIndicatorTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedImageIndex && selectedImageIndex.pageId !== activePageId) {
      setSelectedImageIndex(null);
    }
  }, [activePageId, selectedImageIndex]);

  const activeEditor = editorRefs.current[activePageId] ?? null;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerActiveRef.current) {
        return;
      }

      const target = e.target as Node | null;

      if (target && textToolbarRef.current?.contains(target)) {
        return;
      }
      if (target && toolbarRef.current?.contains(target)) {
        return;
      }

      setShowTextToolbar(false);
    };

    if (showTextToolbar) {
      window.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showTextToolbar]);

  const fontSizeOptions = ["16px", "18px", "20px", "22px", "24px", "28px", "32px"];

  useEffect(() => {
    if (!activeEditor) return;

    const refresh = () => {
      refreshToolbarState();
    };

    refresh();

    activeEditor.on("selectionUpdate", refresh);
    activeEditor.on("transaction", refresh);
    activeEditor.on("update", refresh);

    return () => {
      activeEditor.off("selectionUpdate", refresh);
      activeEditor.off("transaction", refresh);
      activeEditor.off("update", refresh);
    };
  }, [activeEditor, activePageId, refreshToolbarState]);

  const getCurrentFontSizeIndex = () => {
    const index = fontSizeOptions.indexOf(displayFontSize);
    return index === -1 ? fontSizeOptions.indexOf("20px") : index;
  };

  const applyFontSize = (size: string) => {
    activeEditor?.chain().focus().setFontSize(size).run();
    setDisplayFontSize(size);
  };

  const decreaseFontSize = () => {
    const index = getCurrentFontSizeIndex();
    const nextIndex = Math.max(0, index - 1);
    applyFontSize(fontSizeOptions[nextIndex]);
  };

  const increaseFontSize = () => {
    const index = getCurrentFontSizeIndex();
    const nextIndex = Math.min(fontSizeOptions.length - 1, index + 1);
    applyFontSize(fontSizeOptions[nextIndex]);
  };

  useEffect(() => {
    if (!activeEditor) {
      setDisplayFontSize("20px");
      return;
    }

    const syncFontSize = () => {
      const size =
        activeEditor.getAttributes("textStyle")?.fontSize || "20px";
      setDisplayFontSize(size);
    };

    syncFontSize();

    activeEditor.on("selectionUpdate", syncFontSize);
    activeEditor.on("transaction", syncFontSize);
    activeEditor.on("update", syncFontSize);

    return () => {
      activeEditor.off("selectionUpdate", syncFontSize);
      activeEditor.off("transaction", syncFontSize);
      activeEditor.off("update", syncFontSize);
    };
  }, [activeEditor, activePageId]);

  // pages가 변경될 때 각 페이지의 drawingData를 canvas에 복원
  useEffect(() => {
    pages.forEach((page) => {
      if (!page.drawingData) return;
      const canvas = canvasRefs.current[page.id];
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 이미 복원된 canvas는 다시 그리지 않음 (history가 있으면 이미 복원됨)
      if (drawHistoryRefs.current[page.id]?.length) return;

      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // 복원된 상태를 history에 초기 스냅샷으로 저장
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        drawHistoryRefs.current[page.id] = [snapshot];
        drawHistoryIndexRefs.current[page.id] = 0;
      };
      img.src = page.drawingData;
    });
  }, [pages]);

  return (
    <div className="page">
      <div className="layout">
        <aside className={`sidebar note-create-sidebar ${isSidebarOpen ? "open" : ""}`}>
          <div className="sidebar-top">
            <div
              className="sidebar-logo"
              onClick={() => {
                setSearchText("");
                void handleNavigateWithSaveCheck("/");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSearchText("");
                  void handleNavigateWithSaveCheck("/");
                }
              }}
            >
              <img src={logo} alt="One Gather 로고" />
            </div>

            <div className="sidebar-menu">
              <button type="button" onClick={() => void handleNavigateWithSaveCheck("/")}>
                전체노트
              </button>

              <button type="button" onClick={() => void handleNavigateWithSaveCheck("/recent")}>
                최근학습
              </button>

              <button type="button" onClick={() => void handleNavigateWithSaveCheck("/favorite")}>
                즐겨찾기
              </button>

              <button type="button" onClick={() => void handleNavigateWithSaveCheck("/mypage")}>
                마이페이지
              </button>
            </div>
          </div>

          <div className="sidebar-bottom">
            <img src={sidebarBook} alt="책 장식" />
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

            <section className="content note-create-content-section">
              <div className="note-create-board">
                <div className="note-create-topbar">
                  <button
                    type="button"
                    className="note-create-complete-button"
                    onClick={handleComplete}>
                    작성 완료
                  </button>
                </div>

                <div className="note-create-workspace">
                  <div className="note-create-paper-column">
                      <div className={`note-create-scroll-area ${pages.length > 1 ? "has-multiple-pages" : ""}`}>
                        <div className="note-create-pages">
                          {pages.map((page, index) => (
                            <div
                              key={page.id}
                              className={`note-create-paper template-${selectedTemplateId} ${activePageId === page.id ? "active" : ""}`}
                              data-page-id={page.id}
                              style={{ backgroundImage: `url(${selectedTemplateImage})` }}
                               onClick={() => {
                                setActivePageId(page.id);
                                setSelectedImageIndex(null);
                              }}
                            >
                              <input
                                type="text"
                                placeholder="제목을 입력하세요"
                                value={page.title ?? ""}
                                onChange={(e) => handleChangePageTitle(page.id, e.target.value)}
                                onClick={() => setSelectedImageIndex(null)}
                                className="note-create-title-input"
                              />

                              <div
                                  className="note-create-body-area"
                                  ref={(el) => {
                                    bodyAreaRefs.current[page.id] = el;
                                  }}
                                >

                                  <PageEditor
                                    value={page.contentHtml}
                                    onChange={(html) => handleChangePageContentHtml(page.id, html)}
                                    onFocus={() => {
                                      setActivePageId(page.id);
                                      setSelectedImageIndex(null);
                                    }}
                                    onPasteImage={async (file) => {
                                    try {
                                      setIsUploadingImage(true);
                                      const imageUrl = await uploadImageToCloudinaryLocal(file);
                                      if (!imageUrl) return;

                                      const nextPages = pages.map((p) =>
                                        p.id === page.id
                                          ? {
                                              ...p,
                                              images: [
                                                ...p.images,
                                                { url: imageUrl, widthPercent: 50, x: 10, y: 10 },
                                              ],
                                            }
                                          : p
                                      );
                                      updateEditorState(title, nextPages, activePageId);
                                    } catch (error) {
                                      console.error("붙여넣기 이미지 업로드 실패:", error);
                                      alert("붙여넣은 이미지 업로드에 실패했습니다.");
                                    } finally {
                                      setIsUploadingImage(false);
                                    }
                                  }}
                                    onEditorReady={(editor) => {
                                      editorRefs.current[page.id] = editor;
                                    }}
                                    onOverflow={() => {
                                      alert("페이지가 가득 찼습니다. + 버튼으로 새 페이지를 추가하세요.");
                                    }}
                                    className="note-create-content-editor"
                                  />
                                </div>

                                {/* 자유 배치 이미지 오버레이 */}
                                {page.images.map((img, idx) => (
                                  <div
                                    key={`img-${idx}`}
                                    className={`note-create-image-overlay ${
                                      selectedImageIndex?.pageId === page.id &&
                                      selectedImageIndex?.imageIndex === idx
                                        ? "selected"
                                        : ""
                                    }`}
                                    style={{
                                      left: `${img.x}%`,
                                      top: `${img.y}%`,
                                      width: `${img.widthPercent}%`,
                                    }}
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      setSelectedImageIndex({ pageId: page.id, imageIndex: idx });
                                      setActivePageId(page.id);
                                      handleImageDragStart(e, page.id, idx);
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                  >
                                    <img
                                      src={img.url}
                                      alt={`이미지 ${idx + 1}`}
                                      draggable={false}
                                      style={{
                                        width: "100%",
                                        height: "auto",
                                        borderRadius: "8px",
                                        pointerEvents: "none",
                                      }}
                                    />

                                    {selectedImageIndex?.pageId === page.id &&
                                      selectedImageIndex?.imageIndex === idx && (
                                      <>
                                        <div
                                          className="note-create-image-overlay-resize-handle"
                                          onMouseDown={(e) => handleImageResizeStart(e, page.id, idx)}
                                        />
                                        <button
                                          className="note-create-image-delete-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSelectedImage();
                                          }}
                                        >
                                          ×
                                        </button>
                                      </>
                                    )}
                                  </div>
                                ))}

                              {(page.textOverlays ?? []).map((overlay) => (
                                <div
                                  key={overlay.id}
                                  className="note-create-text-overlay"
                                  style={{
                                    left: `${overlay.x}%`,
                                    top: `${overlay.y}%`,
                                    maxWidth: `calc(100% - ${overlay.x}% - 42px)`,
                                  }}
                                  dangerouslySetInnerHTML={{
                                    __html: overlay.html,
                                  }}
                                />
                              ))}  

                              {activePageId === page.id && (
                                <div className="note-create-page-number">{index + 1}</div>
                              )}

                              <canvas
                                ref={(el) => { canvasRefs.current[page.id] = el; }}
                                className={`note-create-draw-canvas ${isDrawingMode && activePageId === page.id ? "active" : ""}`}
                                width={860}
                                height={1180}
                                onMouseDown={(e) => handleCanvasMouseDown(e, page.id)}
                                onMouseMove={(e) => handleCanvasMouseMove(e, page.id)}
                                onMouseUp={() => handleCanvasMouseUp(page.id)}
                                onMouseLeave={() => handleCanvasMouseUp(page.id)}
                              />
                            </div>
                        ))}

                        <div className="note-create-add-page-row">
                          <div
                            className="note-create-add-page-bar"
                            onClick={handleAddPage}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                handleAddPage();
                              }
                            }}
                          >
                          <span className="note-create-add-page-icon">+</span>
                        </div>
                      </div>
                    </div>  
                  </div>
                </div>

                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageFileChange}
                />

                <div className="note-create-toolbar-wrap">
                  <div
                    ref={textToolbarRef}
                    className={`note-create-text-toolbar ${showTextToolbar ? "open" : ""}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={activeEditor?.isActive("bold") ? "active" : ""}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        activeEditor?.chain().focus().toggleBold().run();
                        setDisplayFontSize("20px");
                      }}
                    >
                      굵게
                    </button>

                    <button
                      type="button"
                      className={activeEditor?.isActive("italic") ? "active" : ""}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        activeEditor?.chain().focus().toggleItalic().run();
                        setDisplayFontSize("");
                      }}
                    >
                      기울임
                    </button>

                    <button
                      type="button"
                      className={activeEditor?.isActive("underline") ? "active" : ""}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        activeEditor?.chain().focus().toggleUnderline().run();
                        refreshToolbarState();
                      }}
                    >
                      밑줄
                    </button>

                    <div className="note-create-align-group">
                      <button
                        type="button"
                        className={activeEditor?.isActive({ textAlign: "left" }) ? "active" : ""}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          activeEditor?.chain().focus().setTextAlign("left").run();
                          refreshToolbarState();
                        }}
                        title="왼쪽 정렬"
                      >
                        <AlignLeft size={22} />
                      </button>

                      <button
                        type="button"
                        className={activeEditor?.isActive({ textAlign: "center" }) ? "active" : ""}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          activeEditor?.chain().focus().setTextAlign("center").run();
                          refreshToolbarState();
                        }}
                        title="가운데 정렬"
                      >
                        <AlignCenter size={22} />
                      </button>

                      <button
                        type="button"
                        className={activeEditor?.isActive({ textAlign: "right" }) ? "active" : ""}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          activeEditor?.chain().focus().setTextAlign("right").run();
                          refreshToolbarState();
                        }}
                        title="오른쪽 정렬"
                      >
                        <AlignRight size={22} />
                      </button>
                    </div>

                    <label className="note-create-text-tool-field">
                      <span>글자색</span>
                      <input
                        type="color"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          colorPickerActiveRef.current = true;
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => {
                          colorPickerActiveRef.current = true;
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            colorPickerActiveRef.current = false;
                          }, 150);
                        }}
                        onChange={(e) => {
                          activeEditor?.chain().setColor(e.target.value).run();
                          refreshToolbarState();
                        }}
                      />
                    </label>

                    <label className="note-create-text-tool-field">
                      <span>배경색</span>
                      <input
                        type="color"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          colorPickerActiveRef.current = true;
                        }}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={() => {
                          colorPickerActiveRef.current = true;
                        }}
                        onBlur={() => {
                          window.setTimeout(() => {
                            colorPickerActiveRef.current = false;
                          }, 150);
                        }}
                        onChange={(e) => {
                          activeEditor?.chain().setBackgroundColor(e.target.value).run();
                          refreshToolbarState();
                        }}
                      />
                    </label>

                    <div className="note-create-text-tool-field">
                      <span>글자 크기</span>

                      <div className="note-create-fontsize-compact">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={decreaseFontSize}
                        >
                          -
                        </button>

                        <div className="note-create-fontsize-current">
                          {displayFontSize.replace("px", "")}
                        </div>

                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={increaseFontSize}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        className="note-create-fontsize-reset"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          activeEditor?.chain().focus().unsetFontSize().run();
                          setDisplayFontSize("20px");
                        }}
                      >
                        기본
                      </button>
                    </div>
                  </div>

                  <div className="note-create-toolbar" ref={toolbarRef}>
                    <button
                      type="button"
                      className={showTextToolbar ? "active" : ""}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowTextToolbar((prev) => !prev);
                        setShowDrawToolbar(false);
                      }}
                      title="텍스트 서식"
                    >
                      <Type />
                    </button>

                    <button
                      type="button"
                      className={isDrawingMode ? "active" : ""}
                      onClick={(e) => {
                        e.stopPropagation();

                        // 이미 그리기 모드면 → 해제
                        if (isDrawingMode) {
                          setIsDrawingMode(false);
                          setShowDrawToolbar(false);
                          return;
                        }

                        // 처음 누르면 → 그리기 모드 ON + 툴바 열기
                        setIsDrawingMode(true);
                        setShowDrawToolbar(true);
                        setShowTextToolbar(false);
                      }}
                      title="그리기"
                    >
                      <PenTool />
                    </button>

                    {/* 그리기 툴바 패널 */}
                    <div
                      ref={drawToolbarRef}
                      className={`note-create-draw-toolbar ${showDrawToolbar ? "open" : ""}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="note-create-draw-tool-field">
                        <span>색상</span>
                        <input
                          type="color"
                          value={drawColor}
                          onChange={(e) => {
                            setDrawColor(e.target.value);
                            setIsEraser(false);
                          }}
                        />
                      </div>

                      <div className="note-create-draw-tool-field">
                        <span>굵기: {drawSize}</span>
                        <input
                          type="range"
                          min={1}
                          max={20}
                          value={drawSize}
                          onChange={(e) => setDrawSize(Number(e.target.value))}
                          className="note-create-draw-size-slider"
                        />
                      </div>

                      <button
                        type="button"
                        className={isEraser ? "active" : ""}
                        onClick={() => setIsEraser((prev) => !prev)}
                      >
                        {isEraser ? "✏️ 펜으로" : "지우개"}
                      </button>

                      <button
                        type="button"
                        onClick={handleClearCanvas}
                        className="note-create-draw-clear-btn"
                      >
                        🗑️ 전체 지우기
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleImageButtonClick}
                      disabled={isUploadingImage}
                      title="이미지 업로드"
                    >
                      <ImageIcon />
                    </button>

                    <button
                      type="button"
                      onClick={handleUndo}
                      disabled={
                        isDrawingMode
                          ? (drawHistoryIndexRefs.current[activePageId] ?? 0) <= 0
                          : !canUndo
                      }
                    >
                      <Undo2 />
                    </button>

                    <button
                      type="button"
                      onClick={handleRedo}
                      disabled={
                        isDrawingMode
                          ? (drawHistoryIndexRefs.current[activePageId] ?? -1) >=
                            ((drawHistoryRefs.current[activePageId]?.length ?? 0) - 1)
                          : !canRedo
                      }
                    >
                      <Redo2 />
                    </button>

                    <button type="button" onClick={handleDeletePage}>
                      <Trash2 />
                    </button>

                    <button
                      type="button"
                      title="저장"
                      onClick={() => {
                        void handleSave(true);
                      }}
                    >
                      <Save />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
            {showAutoSaveIndicator && (
              <div className="note-create-autosave-indicator">
                자동 저장됨 · {lastAutoSavedAt}
              </div>
            )}

            {showLeaveModal && (
              <div className="note-create-leave-modal-backdrop">
                <div className="note-create-leave-modal">
                  <h3>저장되지 않은 노트가 있습니다.</h3>
                  <p>저장 후 이동하시겠습니까?</p>

                  <div className="note-create-leave-modal-actions">
                    <button type="button" onClick={handleSaveAndLeave}>
                      저장 후 이동
                    </button>

                    <button type="button" onClick={handleLeaveWithoutSave}>
                      저장하지 않고 나가기
                    </button>

                    <button type="button" onClick={handleCancelLeave}>
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}

export default NoteCreatePage;