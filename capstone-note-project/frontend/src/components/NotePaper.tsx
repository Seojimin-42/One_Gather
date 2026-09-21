import { Fragment } from "react";
import type { NotePage } from "../utils/noteHelpers";
import { transformImageHtml, isEmptyContentHtml } from "../utils/noteHelpers";

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

type NotePaperProps = {
  page: NotePage;
  pageIndex: number;
  templateId: string;
  extraClassName?: string;
};

function NotePaper({
  page,
  pageIndex,
  templateId,
  extraClassName = "",
}: NotePaperProps) {
  const selectedTemplateImage = templateMap[templateId] ?? note1;
  const selectedTemplateNum = templateId.replace("note", "");
  const isContentEmpty = isEmptyContentHtml(page.contentHtml);

  return (
    <div
      className={`note-create-paper template-${selectedTemplateNum} note-view-paper ${extraClassName}`}
      style={{ backgroundImage: `url(${selectedTemplateImage})` }}
    >
      {/* 제목 */}
      <div className="note-create-title-input note-view-paper-title">
        {page.title && page.title.trim() !== "" ? page.title : "\u00A0"}
      </div>

      {/* 본문 */}
      <div className="note-view-body">
        {!isContentEmpty && (
          <div
            className="note-view-content-html"
            dangerouslySetInnerHTML={{
              __html: transformImageHtml(page.contentHtml || ""),
            }}
          />
        )}

        {isContentEmpty && (
          <div className="note-view-content-empty">내용이 없습니다.</div>
        )}

        {page.images && page.images.length > 0 && (
          <div className="note-view-image-list">
            {page.images.map((img, idx) => (
              <div
                key={idx}
                className="note-view-image-item"
                style={{ width: `${img.widthPercent}%` }}
              >
                <img
                  src={img.url}
                  alt={`첨부 이미지 ${idx + 1}`}
                  className="note-view-inline-image"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 텍스트 오버레이 (읽기 전용) */}
      {(page.textOverlays ?? []).map((overlay) => (
        <Fragment key={overlay.id}>
          <div
            className="note-view-text-overlay"
            style={{
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              maxWidth: `calc(100% - ${overlay.x}% - 42px)`,
            }}
            dangerouslySetInnerHTML={{ __html: overlay.html }}
          />
        </Fragment>
      ))}

      {/* 드로잉 이미지 (읽기 전용) */}
      {page.drawingData && (
        <img
          src={page.drawingData}
          alt="드로잉"
          className="note-view-drawing-overlay"
        />
      )}

      {/* 페이지 번호 */}
      <div className="note-create-page-number">{pageIndex + 1}</div>
    </div>
  );
}

export default NotePaper;