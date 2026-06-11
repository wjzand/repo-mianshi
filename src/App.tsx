import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Home from "@/pages/Home";
import InterviewForm from "@/pages/InterviewForm";
import InterviewDetail from "@/pages/InterviewDetail";
import Dashboard from "@/pages/Dashboard";
import QuestionBank from "@/pages/QuestionBank";
import Diary from "@/pages/Diary";
import Profile from "@/pages/Profile";
import SimulationSetup from "@/pages/SimulationSetup";
import SimulationRoom from "@/pages/SimulationRoom";
import SimulationReportPage from "@/pages/SimulationReportPage";
import SimulationHistory from "@/pages/SimulationHistory";
import FailQuestionBank from "@/pages/FailQuestionBank";

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/interview/new" element={<InterviewForm />} />
          <Route path="/interview/edit/:id" element={<InterviewForm />} />
          <Route path="/interview/:id" element={<InterviewDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/questions" element={<QuestionBank />} />
          <Route path="/diary" element={<Diary />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/simulation/setup" element={<SimulationSetup />} />
          <Route path="/simulation/room" element={<SimulationRoom />} />
          <Route path="/simulation/report/:sessionId" element={<SimulationReportPage />} />
          <Route path="/simulation/history" element={<SimulationHistory />} />
          <Route path="/simulation/fail-questions" element={<FailQuestionBank />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
