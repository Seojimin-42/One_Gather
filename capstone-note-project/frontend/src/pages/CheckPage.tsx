import { useEffect, useState } from "react";
import axios from "axios";

// 벡앤드 연결 확인 페이지
function CheckPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8080/api/check")
      .then((response) => setMessage(response.data))
      .catch((error) => console.error("연결 실패:", error));
  }, []);

  return <div>{message}</div>;
}

export default CheckPage;