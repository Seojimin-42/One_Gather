import { useState } from "react";
import axios from "axios";

// 일단 이쪽은 메인 페이지에서 팝업창이 뜨게 만드는 구조로 할꺼라서 보류
function NoteCreatePage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSave = async () => {
    try {
      const response = await axios.post("http://localhost:8080/notes", {
        title,
        content,
      });

      console.log("저장 성공 : ", response.data);
      alert("노트가 저장되었습니다.");

      setTitle("");
      setContent("");
    } catch (error) {
      console.error("저장 실패:", error);
      alert("노트 저장에 실패했습니다.");
    }
  };


  return (
    <div>
      <h1>노트 작성 페이지</h1>

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

      <button onClick={handleSave}>저장</button>
    </div>
  );
}

export default NoteCreatePage;