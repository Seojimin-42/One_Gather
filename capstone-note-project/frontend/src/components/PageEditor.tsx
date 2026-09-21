import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle, Color, BackgroundColor } from "@tiptap/extension-text-style";
import { FontSize } from "../hooks/FontSize";
import Placeholder from "@tiptap/extension-placeholder";
import ImageResize from "tiptap-extension-resize-image";
import TextAlign from "@tiptap/extension-text-align";

type PageEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onFocus?: () => void;
  onPasteImage?: (file: File) => Promise<void> | void;
  onEditorReady?: (editor: any) => void;
  onOverflow?: () => void;
  className?: string;
};

const DraggableImage = ImageResize.extend({
  draggable: true,
});

export default function PageEditor({
  value,
  onChange,
  onFocus,
  onPasteImage,
  onEditorReady,
  onOverflow,
  className,
}: PageEditorProps) {

const editor = useEditor({
    extensions: [
        StarterKit,
        Underline,
        TextStyle,
        Color,
        BackgroundColor,
        FontSize,
        DraggableImage.configure({
          inline: false,
          maxWidth: 770,
        }),
        Placeholder.configure({
          placeholder: "내용을 입력하세요",
        }),
        TextAlign.configure({                       
          types: ["heading", "paragraph"],           
          alignments: ["left", "center", "right"],   
          defaultAlignment: "left",
        }),
    ],
    content: value || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const proseMirrorEl = editor.view.dom as HTMLElement;
      const wrapEl = proseMirrorEl.closest(".note-create-editor-wrap") as HTMLElement | null;

      if (wrapEl) {
        const children = Array.from(proseMirrorEl.children) as HTMLElement[];
        let maxBottom = 0;
        for (const child of children) {
          const childBottom = child.offsetTop + child.offsetHeight;
          if (childBottom > maxBottom) maxBottom = childBottom;
        }

        if (maxBottom > wrapEl.clientHeight) {
          // 이전 value도 이미 overflow 상태일 수 있으니, 안전하게 빈 문자열로 폴백
          const safeValue = value || "";
          editor.commands.setContent(safeValue, { emitUpdate: false });
          onOverflow?.();
          // 부모 state도 safeValue로 동기화
          onChange(safeValue);
          return;
        }
      }

      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: className ?? "note-create-content-editor",
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items || !onPasteImage) return false;

        const imageItem = Array.from(items).find((item) =>
          item.type.startsWith("image/")
        );

        if (!imageItem) return false;

        const file = imageItem.getAsFile();
        if (!file) return false;

        event.preventDefault();
        void onPasteImage(file);
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    onEditorReady?.(editor);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const currentHtml = editor.getHTML();
    if (currentHtml !== (value || "")) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [editor, value]);

    if (!editor) return null;

   return (
    <div className="note-create-editor-wrap" onClick={onFocus}>
      <EditorContent
        editor={editor}
        className="note-create-editor-content"
      />
    </div>
  );
}