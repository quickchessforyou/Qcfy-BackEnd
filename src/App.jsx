import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LiveCompetitionProvider } from "./contexts/LiveCompetitionContext";
// Old imports removed to fix duplicates
import LandingLayout from "./layouts/LandingLayout/LandingLayout";
import StudentLayout from "./layouts/StudentLayout/StudentLayout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";
import MainLayout from "./layouts/MainLayout/MainLayout"; // Keeping for reference or fallback

// Pages
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import MyCompetitions from "./pages/Dashboard/MyCompetitions";
import MyCourses from "./pages/Dashboard/MyCourses";
import PuzzleHistory from "./pages/Dashboard/PuzzleHistory";

import CasualPuzzlePage from "./pages/PuzzlePage/CasualPuzzlePage";
import PuzzlePage from "./pages/PuzzlePage/PuzzlePage";
import DailyTrainingPage from "./pages/DailyTraining/DailyTrainingPage";
import CompetitionLeaderboard from "./pages/Leaderboard/Leaderboard";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/Profile/EditProfile";
import UserSettings from "./pages/Settings/Settings";
import LiveCompetitionPage from "./pages/LiveCompetition/LiveCompetitionPage";
import CompetitionLobby from "./pages/CompetitionLobby/CompetitionLobby";
import Gallery from "./pages/Gallery/Gallery";

// Admin Imports
import CapturePuzzle from "./pages/Learn/CapturePuzzle";
//import PrivacyPolicy from "./pages/PrivacyPolicy/PrivacyPolicy";

import AdminLogin from "./pages/Admin/AdminLogin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard/AdminDashboard";

import CategoryList from "./pages/Admin/CategoryList/CategoryList";
import PuzzleList from "./pages/Admin/PuzzleList/PuzzleList";
import PuzzleLibrary from "./pages/Admin/PuzzleLibrary/PuzzleLibrary";
import CreatePuzzle from "./pages/Admin/CreatePuzzle/CreatePuzzle";
import EditPuzzle from "./pages/Admin/EditPuzzle/EditPuzzle";
import CompetitionList from "./pages/Admin/CompetitionList/CompetitionList";
import CreateCompetition from "./pages/Admin/CreateCompetition/CreateCompetition";
import EditCompetition from "./pages/Admin/EditCompetition/EditCompetition";
import CompetitionHistory from "./pages/Admin/CompetitionHistory/CompetitionHistory";
import LiveTournament from "./pages/Admin/LiveTournament/LiveTournament";
import CompetitionParticipants from "./pages/Admin/CompetitionParticipants/CompetitionParticipants";
import StudentList from "./pages/Admin/StudentList/StudentList";
import AdminManagement from "./pages/Admin/AdminManagement/AdminManagement";
import AdminLeaderboard from "./pages/Admin/Leaderboard/Leaderboard";
import Reports from "./pages/Admin/Reports/Reports";
import SystemMonitor from "./pages/Admin/SystemMonitor/SystemMonitor";
import AdminSettings from "./pages/Admin/Settings/Settings";
//import Competitions from "./pages/Competitions/Competitions";

import UserProtectedRoute from "./components/ProtectedRoute/UserProtectedRoute";
import AdminProtectedRoute from "./components/ProtectedRoute/AdminProtectedRoute";
import AdminRedirect from "./components/AdminRedirect"; // NEW
import { AuthProvider } from "./contexts/AuthContext";
import CompetitionRejoinManager from "./components/CompetitionRejoinManager/CompetitionRejoinManager";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LiveCompetitionProvider>
          <Router>
            <CompetitionRejoinManager />
            <Routes>
              {/* LANDING PAGE LAYOUT (Public) */}
              <Route element={<LandingLayout />}>
                <Route path="/" element={<Home />} />
                {/* <Route path="/privacy-policy" element={<PrivacyPolicy />} /> */}
                <Route path="/learn/capture" element={<CapturePuzzle />} />
                <Route path="/gallery" element={<Gallery />} />
                {/* Keep these valid for direct links, or handle in Home as sections */}
              </Route>

              {/* STUDENT DASHBOARD LAYOUT (Protected) */}
              <Route
                element={
                  <UserProtectedRoute>
                    <StudentLayout />
                  </UserProtectedRoute>
                }
              >
                <Route path="/Dashboard" element={<Dashboard />} />
                <Route path="/Dashboard/competitions" element={<MyCompetitions />} />
                <Route path="/Dashboard/courses" element={<MyCourses />} />
                <Route path="/Dashboard/puzzles" element={<PuzzleHistory />} />

                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/settings" element={<UserSettings />} />

                {/* Puzzles */}
                <Route path="/puzzles" element={<CasualPuzzlePage />} />
                <Route path="/play" element={<DailyTrainingPage />} />
                <Route path="/competition/:id/puzzle" element={<PuzzlePage />} />
                <Route path="/tournament/:id/puzzle" element={<PuzzlePage />} />

                {/* Competitions */}
                <Route path="/leaderboard/:competitionId" element={<CompetitionLeaderboard />} />
                <Route path="/competition/:id/lobby" element={<CompetitionLobby />} />
                <Route path="/live-competition/:id" element={<LiveCompetitionPage />} />
              </Route>

              {/* ADMIN LAYOUT */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminRedirect />} />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }



              >
                <Route path="" element={<AdminDashboard />} />

                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="puzzles" element={<PuzzleList />} />
                <Route path="puzzle-library" element={<PuzzleLibrary />} />
                <Route path="puzzles/create" element={<CreatePuzzle />} />
                <Route path="puzzles/edit/:id" element={<EditPuzzle />} />
                <Route path="competitions" element={<CompetitionList />} />
                <Route path="competitions/create" element={<CreateCompetition />} />
                <Route path="competitions/edit/:id" element={<EditCompetition />} />
                <Route path="competitions/:id/participants" element={<CompetitionParticipants />} />
                <Route path="competitions/live" element={<LiveTournament />} />
                <Route path="competitions/history" element={<CompetitionHistory />} />
                <Route path="students" element={<StudentList />} />
                <Route path="admins" element={<AdminManagement />} />
                <Route path="leaderboard" element={<AdminLeaderboard />} />
                <Route path="reports" element={<Reports />} />
                <Route path="monitoring" element={<SystemMonitor />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Routes>
          </Router>
        </LiveCompetitionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
