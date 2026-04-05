import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

function NoteEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    useEffect(() => {
        axios
            .get(`http://localhost:8080/notes/${id}`)
            .then((response) => {
                setTitle(response.data.title);
                setContent(response.data.content);
            })
            .catch((error) => {
                console.error("기존 노트 불러오기 실패:", error);
            });
    }, [id]);

    const handleUpdate = async () => {
        try {
            await axios.put(`http://localhost:8080/notes/${id}`, {
                title,
                content,
            });

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
    </div>
  );
}

export default NoteEditPage;