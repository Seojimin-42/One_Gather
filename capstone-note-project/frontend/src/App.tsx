import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainPage from "./pages/MainPage";
import CheckPage from "./pages/CheckPage";
import NoteCreatePage from "./pages/NoteCreatePage";
import NoteViewPage from "./pages/NoteViewPage";
import NoteEditPage from "./pages/NoteEditPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/check" element={<CheckPage />} />
        <Route path="/notes/new" element={<NoteCreatePage />} />
        <Route path="/notes/:id" element={<NoteViewPage />} />
        <Route path="/notes/:id/edit" element={<NoteEditPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;