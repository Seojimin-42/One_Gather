import "../styles/CreateNoteModal.css"
import { useState } from "react";

/* 이미지 임포트 */
import note1 from "../assets/content/content1.png";
import note2 from "../assets/content/content2.png";
import note3 from "../assets/content/content3.png";
import note4 from "../assets/content/content4.png";
import note5 from "../assets/content/content5.png";
import note6 from "../assets/content/content6.png";

type CreateNoteModalProps = {
    onClose: () => void;
    onNext: (templateId: string) => void;
};

type TemplateItem = {
    id: string;
    image: string;
};

const templates: TemplateItem[] = [
    { id: "note1", image: note1 },
    { id: "note2", image: note2 },
    { id: "note3", image: note3 },
    { id: "note4", image: note4 },
    { id: "note5", image: note5 },
    { id: "note6", image: note6 },
];

function CreateNoteModal({ onClose, onNext }: CreateNoteModalProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>(templates[0].id);

    return (
        <div className="create-note-modal-backdrop" onClick={onClose}>
            <div
                className="create-note-modal"
                onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="create-note-close"
                    onClick={onClose}
                >
                    X
                </button>

                <h3 className="create-note-title">내용 생성하기</h3>

                <div className="create-note-template-grid">
                    {templates.map((template) => (
                        <button
                            key={template.id}
                            type="button"
                            className={`template-card ${
                                selectedTemplate === template.id ? "selected" : ""
                            }`}
                            onClick={() => setSelectedTemplate(template.id)}
                            >
                                <img
                                    src={template.image}
                                    alt={template.id}
                                    className="template-preview-image"
                                />
                        </button>
                    ))}
                </div>

                <div className="create-note-footer">
                    <button
                        type="button"
                        className="create-note-next-button"
                        disabled={!selectedTemplate}
                        onClick={() => {
                            if (selectedTemplate) {
                                onNext(selectedTemplate)
                            }
                        }}>
                            다음
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateNoteModal;