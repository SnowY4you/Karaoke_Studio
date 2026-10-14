import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import StudioPage from "@/pages/StudioPage";
import StagePage from "@/pages/StagePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudioPage />} />
        <Route path="/stage" element={<StagePage />} />
      </Routes>
      <Toaster theme="dark" position="bottom-right" toastOptions={{ style: { background: "#0d2338", border: "1px solid #1e4d6b", color: "#fff" } }} />
    </BrowserRouter>
  );
}

export default App;
