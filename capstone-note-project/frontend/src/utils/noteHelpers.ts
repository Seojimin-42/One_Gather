export type NoteImageItem = {
  url: string;
  widthPercent: number;
};

export type NoteTextOverlay = {
  id: number;
  x: number;
  y: number;
  width: number;
  html: string;
};

export type NotePage = {
  id: number;
  title: string;
  contentHtml: string;
  images: NoteImageItem[];
  drawingData?: string;
  textOverlays?: NoteTextOverlay[];
};

// HTML 내용이 비어있는지 확인
export const isEmptyContentHtml = (html?: string | null) => {
  const text = (html ?? "")
    .replace(/<br\s*\/?>/gi, "")
    .replace(/&nbsp;/gi, "")
    .replace(/<[^>]*>/g, "")
    .trim();

  return text.length === 0;
};

// 이미지의 wrapperstyle/containerstyle 커스텀 속성을 실제 div wrapper로 변환
export function transformImageHtml(html: string): string {
  if (!html) return html;

  const BASE_WIDTH = 776;

  return html.replace(/<img([^>]*?)>/g, (match, attrs) => {
    const wrapperMatch = attrs.match(/wrapperstyle="([^"]*)"/);
    const containerMatch = attrs.match(/containerstyle="([^"]*)"/);

    if (!wrapperMatch && !containerMatch) return match;

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
  });
}

// 노트 응답에서 페이지 배열 정규화
export const normalizePages = (fetchedNote: any): NotePage[] => {
  if (Array.isArray(fetchedNote.pages) && fetchedNote.pages.length > 0) {
    return fetchedNote.pages.map((page: any, index: number) => ({
      id: page.id,
      title: page.title ?? (index === 0 ? (fetchedNote.title ?? "") : ""),
      contentHtml:
        page.contentHtml ||
        (index === 0
          ? (fetchedNote.contentHtml ?? fetchedNote.content ?? "")
          : ""),
      images: Array.isArray(page.images) ? page.images : [],
      drawingData: page.drawingData,
      textOverlays: Array.isArray(page.textOverlays) ? page.textOverlays : [],
    }));
  }

  return [
    {
      id: 1,
      title: fetchedNote.title ?? "",
      contentHtml: fetchedNote.contentHtml ?? fetchedNote.content ?? "",
      images: [],
      drawingData: undefined,
      textOverlays: [],
    },
  ];
};