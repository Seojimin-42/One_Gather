import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Note = {
  id: number;
  title: string;
  content: string;
}

function MainPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:8080/notes")
      .then((response) => {
        setNotes(response.data);
      })
      .catch((error) => {
        console.error("노트 목록 불러오기 실패:", error);
      });
  }, []);

  return (
    <div>

      <h1>메인 페이지</h1>

      <button onClick={() => navigate("/notes/new")}>
        노트 작성하러 가기
      </button>

      <h2>노트 작성하러 가기</h2>

      {notes.length === 0 ? (
        <p>작성된 노트가 없습니다.</p>
      ) : (
        <ul>
          {notes.map((note) => (
            <li 
              key={note.id}
              onClick={() => navigate(`/notes/${note.id}`)}
              style={{ cursor: "pointer", marginBottom: "20px" }}
              >
              <h3>{note.title}</h3>
              <p>{note.content}</p>
            </li>
          ) )}
        </ul>
      )}

    </div>
  )
}

export default MainPage;