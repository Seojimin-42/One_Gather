import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import NoteCreatePage from "./pages/NoteCreatePage";
import NoteViewPage from "./pages/NoteViewPage";
import RecentPage from "./pages/RecentPage";
import FavoritePage from "./pages/FavoritePage";
import MyPage from "./pages/MyPage";

/* 이전에 NoteCreatePage에 분리된 수정 전용 페이지를 만드려고 했으나, 
  NoteCreatePage로 통합했기에 지금은 현재 사용하지 않음. -> 보류 */
// import NoteEditPage from "./pages/NoteEditPage"; 
import SharedNotePage from "./pages/SharedNotePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/notes/new" element={<NoteCreatePage />} />
        <Route path="/notes/:id" element={<NoteViewPage />} />
        <Route path="/notes/:id/edit" element={<NoteCreatePage />} />
        <Route path="/shared/:shareId" element={<SharedNotePage />} />
        <Route path="/recent" element={<RecentPage />} />
        <Route path="/favorite" element={<FavoritePage />} />
        <Route path="/mypage" element={<MyPage/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;