import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

type Note = {
    id: number;
    title: string;
    content: string;
};

function NoteViewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [note, setNote] = useState<Note | null>(null);

    useEffect(() => {
        axios
            .get(`http://localhost:8080/notes/${id}`)
            .then((response) => {
                setNote(response.data);
            })
            .catch((error) => {
                console.error("노트 상세 조회 실패:", error);
            });
    }, [id]);

    const handleDelete = async () => {
        const confirmed = window.confirm("정말 이 노트를 삭제하시겠습니까?");

        if(!confirmed) {
            return;
        }

        try {
            await axios.delete(`http://localhost:8080/notes/${id}`);
            alert("노트가 삭제되었습니다.");
            navigate("/");
        } catch (error) {
            console.error("노트 삭제 실패:", error);
            alert("노트 삭제에 실패했습니다.");
        }
    };

    if(!note) {
        return <div>노트를 불러오는 중입니다.</div>
    }

    return (
        <div>
            <h1>노트 상세 페이지</h1>
            <h2>{note.title}</h2>
            <p>{note.content}</p>

            <button onClick={() => navigate(`/notes/${id}/edit`)}>
                수정하기
            </button>

            <button onClick={handleDelete}>삭제하기</button>
        </div>
    );
}

export default NoteViewPage;