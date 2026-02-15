import { MainLayout } from "@/layouts/MainLayout";
import { CalendarView } from "@/pages/CalendarView";
import { ListView } from "@/pages/ListView";
import { MatrixView } from "@/pages/MatrixView";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/list" replace />} />
          <Route path="list" element={<ListView />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="matrix" element={<MatrixView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
