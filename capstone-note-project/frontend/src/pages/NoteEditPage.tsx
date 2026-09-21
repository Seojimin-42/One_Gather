import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/api";

type Note = {
  id: number;
  title: string;
  content?: string;
  contentHtml?: string; 
  createdAt?: string;
  updatedAt?: string;
  lastViewedAt?: string;
  lastViewedPage?: number;
  lastEditedPage?: number;
  deleted?: boolean;

  coverImageUrl?: string | null;
  coverStoragePath?: string | null;
  coverImagePublicId?: string | null;
  coverColor?: string;
  coverOpacity?: number;
  titleHidden?: boolean;
};

function NoteEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

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

    useEffect(() => {
      const fetchNote = async () => {
        try {
          const response = await api.get(`/notes/${id}`);
          const fetchedNote = response.data;

          setTitle(fetchedNote.title);
          setContent(fetchedNote.contentHtml ?? fetchedNote.content ?? "");

          const currentViewedPage = 1;

          await api.post(`/notes/${id}/view`, {
            page: currentViewedPage,
          });

          const viewedAt = new Date().toISOString();
          const noteWithViewedAt = {
            ...fetchedNote,
            lastViewedAt: viewedAt,
            lastViewedPage: currentViewedPage,
          };

          updateViewedNoteInLocalStorage(noteWithViewedAt);
        } catch (error) {
          console.error("기존 노트 불러오기 또는 열람 기록 저장 실패:", error);
        }
      };

      if (id) {
        fetchNote();
      }
    }, [id]);

    const handleUpdate = async () => {
      try {
        const currentEditedPage = 1;

        const response = await api.put(`/notes/${id}`, {
          title,
          contentHtml: content,
          lastEditedPage: currentEditedPage,
        });

        const updatedNote = response.data;

        const storedRecent = localStorage.getItem("recentNotes");
        const recentNotes: Note[] = storedRecent ? JSON.parse(storedRecent) : [];

        const updatedRecentNotes = recentNotes.map((item) =>
          item.id === Number(id)
            ? {
                ...item,
                ...updatedNote,
                lastEditedPage: currentEditedPage,
              }
            : item
        );

        localStorage.setItem("recentNotes", JSON.stringify(updatedRecentNotes));

        const storedFavorite = localStorage.getItem("favoriteNotes");
        const favoriteNotes: Note[] = storedFavorite ? JSON.parse(storedFavorite) : [];

        const updatedFavoriteNotes = favoriteNotes.map((item) =>
          item.id === Number(id)
            ? {
                ...item,
                ...updatedNote,
                lastEditedPage: currentEditedPage,
              }
            : item
        );

        localStorage.setItem("favoriteNotes", JSON.stringify(updatedFavoriteNotes));

        alert("노트가 수정되었습니다.");
        navigate(`/notes/${id}`);
      } catch (error) {
        console.error("노트 수정 실패", error);
      }
    };

    return (
    <div>
      <h1>노트 수정 페이지</h1>

      <div>
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <textarea
          placeholder="내용을 입력하세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          cols={50}
        />
      </div>

      <button onClick={handleUpdate}>수정 저장</button>
      <button onClick={() => navigate(`/notes/${id}`)}>취소</button>
    </div>
  );
}

export default NoteEditPage;