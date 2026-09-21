import "../styles/NoteDetailModal.css";
import { useEffect, useState, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { uploadImageToCloudinary } from "../api/cloudinary";

import galleryIcon from "../assets/icon/gallery.png";

type Note = {
    id: number;
    title: string;
    content: string;
    createdAt?: string;
    updatedAt?: string;
    deleted?: boolean;
};

type CoverStyle = {
    title: string;
    color: string;
    opacity: number;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    titleHidden: boolean;
}

type NoteDetailModalProps = {
    note: Note;
    onClose: () => void;
    isTitleHidden: boolean;
    onToggleTitleHidden: () => void;

    coverColor: string;
    coverOpacity: number;
    coverImageUrl?: string | null;
    coverImagePublicId?: string | null;
    onSaveCover: (coverStyle: CoverStyle) => void | Promise<void>;
    
    onDelete: () => void;
    onShare: () => void | Promise<void>;
    shelfIndexes: ShelfIndex[];
    selectedShelfIndexId: number | null;
    onChangeShelfIndex: (shelfIndexId: number | null) => void;
    onDuplicate: (targetShelfIndexId: number | null) => void | Promise<void>;
};

type ShelfIndex = {
  id: number;
  name: string;
};

function NoteDetailModal({ note, onClose, isTitleHidden, onToggleTitleHidden, 
    coverColor, coverOpacity, coverImageUrl, coverImagePublicId, onSaveCover, onDelete,
    onShare, shelfIndexes, selectedShelfIndexId, onChangeShelfIndex, onDuplicate,}: NoteDetailModalProps) {
    
    const normalizeHexColor = (value?: string) => {
        if (!value) return "#3E4A3E";
        return value.startsWith("#") ? value : `#${value}`;
    };

    const [selectedColor, setSelectedColor] = useState(normalizeHexColor(coverColor));
    const [opacity, setOpacity] = useState(coverOpacity);
    const [editedTitle, setEditedTitle] = useState(note.title);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
        coverImageUrl ?? null
        );
    const [selectedImagePublicId, setSelectedImagePublicId] = useState<string | null>(
        coverImagePublicId ?? null
    );

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const hasCoverImage = Boolean(selectedImageUrl);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateTargetShelfIndexId, setDuplicateTargetShelfIndexId] = useState<number | null>(selectedShelfIndexId);  
    const [isSaving, setIsSaving] = useState(false);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const handleOpenDuplicateModal = () => {
        // 사본 모달 열 때마다 기본값을 현재 분류로 다시 설정
        setDuplicateTargetShelfIndexId(selectedShelfIndexId);
        setIsDuplicateModalOpen(true);
    };

    const handleConfirmDuplicate = async () => {
        if (isDuplicating) return;   // 이미 진행 중이면 무시
        setIsDuplicating(true);      // 잠금

        try {
            await onDuplicate(duplicateTargetShelfIndexId);
            setIsDuplicateModalOpen(false);
            onClose();
        } catch (error) {
            console.error("노트 복제 실패:", error);
            alert("노트 복제에 실패했습니다.");
        } finally {
            setIsDuplicating(false); // 잠금 해제 (에러 시에도)
        }
    };

    useEffect(() => {
        setEditedTitle(note.title);
        setSelectedColor(normalizeHexColor(coverColor));
        setOpacity(coverOpacity);
        setSelectedImageUrl(coverImageUrl ?? null);
        setSelectedImagePublicId(coverImagePublicId ?? null);
    }, [note.title, coverColor, coverOpacity, coverImageUrl, coverImagePublicId, note.id]);

    const resetColor = () => {
        setSelectedImageUrl(null);
        setSelectedImagePublicId(null);
        setSelectedColor("#3E4A3E");
        setOpacity(100);
    }

    const hexToRgba = (hex: string, opacityValue: number) => {
        const cleanHex = hex.replace("#", "");

        const r = parseInt(cleanHex.slice(0, 2), 16);
        const g = parseInt(cleanHex.slice(2, 4), 16);
        const b = parseInt(cleanHex.slice(4, 6), 16);

        return `rgba(${r}, ${g}, ${b}, ${opacityValue / 100})`;
    };

    const handleColorInputChange = (value: string) => {
        // 1) # 앞에 붙이기
        let formattedValue = value.startsWith("#") ? value : `#${value}`;

        // 2) # 뒤에는 0-9, A-F, a-f만 허용 (#를 제외하고 영문/숫자 외 문자 제거)
        const hexPart = formattedValue
            .slice(1)
            .replace(/[^0-9A-Fa-f]/g, "")
            .slice(0, 6); // 6자리까지만
        
        formattedValue = `#${hexPart}`;
        
        setSelectedColor(formattedValue);
    };

    const handleCoverClick = () => {
        fileInputRef.current?.click();
    }

    const handleCoverImageChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("이미지 파일만 선택할 수 있습니다.");
            return;
        }

        try {
            const uploadResult = await uploadImageToCloudinary(file, "cover");
            setSelectedImageUrl(uploadResult.imageUrl);
            setSelectedImagePublicId(uploadResult.publicId);
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            alert("이미지 업로드에 실패했습니다.");
        }
    };

    const getShortTitle = (title: string) => {
        return title.length > 11 ? `${title.slice(0, 11)}⋯` : title;
    };

    const handleDone = async () => {
        if (isSaving) return;  // 중복 클릭 방지

        if (!hasCoverImage && !/^#[0-9A-Fa-f]{6}$/.test(selectedColor)) {
            alert("색상은 #000000 형식으로 입력해주세요.");
            return;
        }

        setIsSaving(true);

        try {
            await onSaveCover({
                title: editedTitle.trim() || "제목 없음",
                color: /^#[0-9A-Fa-f]{6}$/.test(selectedColor)
                    ? selectedColor
                    : "#3E4A3E",
                opacity,
                imageUrl: selectedImageUrl,
                imagePublicId: selectedImagePublicId,
                titleHidden: isTitleHidden,
            });

            onClose();
        } catch (error) {
            console.error("표지 정보 저장 실패:", error);
            alert("표지 정보 저장에 실패했습니다.");
            setIsSaving(false);  // 실패 시에만 해제 (성공 시엔 모달이 닫히므로 불필요)
        }
    };

    return (
        <div className="note-detail-modal-backdrop" onClick={onClose}>
            <div
                className="note-detail-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    className="note-detail-close"
                    type="button"
                    onClick={onClose}
                >
                    X
                </button>

                <h3 className="note-detail-title">노트 상세정보</h3>

                <div className="note-detail-body">
                    <div 
                        className="note-detail-preview"
                        onClick={handleCoverClick}
                        style={{ 
                            backgroundColor: hasCoverImage
                                ? "#ffffff"
                                : /^#[0-9A-Fa-f]{6}$/.test(selectedColor)
                                ? hexToRgba(selectedColor, opacity)
                                : "#3E4A3E",
                        }}
                    >
                        {selectedImageUrl && (
                            <img
                                src={selectedImageUrl}
                                alt="노트 표지"
                                className="note-detail-preview-image"
                                style={{ opacity: opacity / 100 }}
                            />
                        )}

                        {!isTitleHidden && (
                            <span className="note-preview-text">
                                {getShortTitle(editedTitle || "NOTE")}
                            </span>
                        )}

                        <div className="cover-image-overlay">
                            <div className="gallery-icon-box">
                                <img 
                                    src={galleryIcon} 
                                    alt="이미지 불러오기" 
                                    className="gallery-icon"
                                />
                            </div>
                            <p>이미지 불러오기</p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="cover-image-input"
                            onChange={handleCoverImageChange}
                        />
                    </div>

                    <div className="note-detail-info">
                        <div className="note-detail-row">
                            <span>제목</span>

                            <input
                                value={isTitleHidden ? "" : editedTitle}
                                onChange={(e) => setEditedTitle(e.target.value)}
                                placeholder={isTitleHidden ? "표시안함" : "제목을 입력하세요"}
                                title={editedTitle}
                            />

                            <button
                                type="button"
                                className={
                                    isTitleHidden
                                        ? "hide-title-button show-title-button"
                                        : "hide-title-button"
                                }
                                onClick={onToggleTitleHidden}
                            >
                                {isTitleHidden ? "표시하기" : "표시안함"}
                            </button>
                        </div>

                        <div className="note-category-row">
                            <span>분류</span>

                            <select
                                className="note-category-select"
                                value={selectedShelfIndexId ?? ""}
                                onChange={(e) =>
                                    onChangeShelfIndex(
                                        e.target.value ? Number(e.target.value) : null
                                    )
                                }
                                title="이 노트를 선택한 분류로 이동합니다"
                            >
                                <option value="">분류 없음</option>

                                {shelfIndexes.map((index) => (
                                    <option key={index.id} value={index.id}>
                                        {index.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="duplicate-note-button"
                                onClick={handleOpenDuplicateModal}
                            >
                                사본 만들기
                            </button>
                        </div>

                        <div className="note-detail-color-row">
                            <span>색상</span>
                            
                            <div className="color-picker-area">
                                <div className={hasCoverImage ? "color-picker-disabled" : ""}>
                                    <HexColorPicker
                                        color={selectedColor}
                                        onChange={(color) => {
                                            if (!hasCoverImage) {
                                                setSelectedColor(color);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="selected-color-info">
                                    <p className="selected-color-label">선택 색상</p>
                                    
                                    <input
                                        className="selected-color-input"
                                        value={selectedColor}
                                        onChange={(e) => handleColorInputChange(e.target.value)}
                                        maxLength={7}
                                        disabled={hasCoverImage}
                                    />

                                    <p className="opacity-label">투명도</p>

                                    <input
                                        className="opacity-slider"
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={opacity}
                                        onChange={(e) => setOpacity(Number(e.target.value))}
                                    />

                                    <button
                                        className="reset-color-button"
                                        type="button"
                                        onClick={resetColor}
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="note-detail-actions">
                    <button 
                        type="button" 
                        className="share-note-button"
                        onClick={onShare}
                    >
                        링크로 노트 공유하기
                    </button>

                    <button
                        type="button"
                        className="delete-note-button"
                        onClick={onDelete}
                    >노트 삭제</button>

                    <button 
                        type="button" 
                        className="done-button" 
                        onClick={handleDone}
                        disabled={isSaving}
                    >
                        {isSaving ? "저장 중..." : "완료"}
                    </button>
                </div>

                {isDuplicateModalOpen && (
                    <div
                        className="duplicate-modal-backdrop"
                        onClick={() => setIsDuplicateModalOpen(false)}
                    >
                        <div
                            className="duplicate-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="duplicate-modal-close"
                                type="button"
                                onClick={() => setIsDuplicateModalOpen(false)}
                            >
                                X
                            </button>

                            <h3 className="duplicate-modal-title">사본 만들기</h3>

                            <div className="duplicate-modal-body">
                                <span className="duplicate-modal-label">사본을 만들 분류</span>
                                <select
                                    className="duplicate-modal-select"
                                    value={duplicateTargetShelfIndexId ?? ""}
                                    onChange={(e) =>
                                        setDuplicateTargetShelfIndexId(
                                            e.target.value ? Number(e.target.value) : null
                                        )
                                    }
                                >
                                    <option value="">분류 없음</option>
                                    {shelfIndexes.map((index) => (
                                        <option key={index.id} value={index.id}>
                                            {index.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <p className="duplicate-modal-hint">
                                원본은 그대로 두고, 새 노트가 만들어집니다.<br />
                                제목은 "{note.title} (사본)"으로 설정됩니다.
                            </p>

                            <div className="duplicate-modal-actions">
                                <button
                                    type="button"
                                    className="duplicate-cancel-button"
                                    onClick={() => setIsDuplicateModalOpen(false)}
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    className="duplicate-confirm-button"
                                    onClick={handleConfirmDuplicate}
                                    disabled={isDuplicating}
                                >
                                    {isDuplicating ? "복사 중..." : "복사하기"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>                
        </div>
    );
}

export default NoteDetailModal;