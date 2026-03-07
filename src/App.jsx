import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LiveCompetitionProvider } from "./contexts/LiveCompetitionContext";

// Layouts stay static — they wrap routes and are always needed
import LandingLayout from "./layouts/LandingLayout/LandingLayout";
import StudentLayout from "./layouts/StudentLayout/StudentLayout";
import AdminLayout from "./layouts/AdminLayout/AdminLayout";

// Auth & route guards stay static — needed on every navigation
import UserProtectedRoute from "./components/ProtectedRoute/UserProtectedRoute";
import AdminProtectedRoute from "./components/ProtectedRoute/AdminProtectedRoute";
import AdminRedirect from "./components/AdminRedirect";
import { AuthProvider } from "./contexts/AuthContext";
import CompetitionRejoinManager from "./components/CompetitionRejoinManager/CompetitionRejoinManager";

// ─── LAZY-LOADED PAGES (code-split per route) ───────────────────────
// Student pages
const Home = React.lazy(() => import("./pages/Home/Home"));
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const MyCompetitions = React.lazy(() => import("./pages/Dashboard/MyCompetitions"));
const MyCourses = React.lazy(() => import("./pages/Dashboard/MyCourses"));
const PuzzleHistory = React.lazy(() => import("./pages/Dashboard/PuzzleHistory"));
const CasualPuzzlePage = React.lazy(() => import("./pages/PuzzlePage/CasualPuzzlePage"));
const PuzzlePage = React.lazy(() => import("./pages/PuzzlePage/PuzzlePage"));
const DailyTrainingPage = React.lazy(() => import("./pages/DailyTraining/DailyTrainingPage"));
const CompetitionLeaderboard = React.lazy(() => import("./pages/Leaderboard/Leaderboard"));
const Profile = React.lazy(() => import("./pages/Profile/Profile"));
const EditProfile = React.lazy(() => import("./pages/Profile/EditProfile"));
const UserSettings = React.lazy(() => import("./pages/Settings/Settings"));
const LiveCompetitionPage = React.lazy(() => import("./pages/LiveCompetition/LiveCompetitionPage"));
const CompetitionLobby = React.lazy(() => import("./pages/CompetitionLobby/CompetitionLobby"));
const Gallery = React.lazy(() => import("./pages/Gallery/Gallery"));
const CapturePuzzle = React.lazy(() => import("./pages/Learn/CapturePuzzle"));

// Admin pages
const AdminLogin = React.lazy(() => import("./pages/Admin/AdminLogin/AdminLogin"));
const AdminDashboard = React.lazy(() => import("./pages/Admin/AdminDashboard/AdminDashboard"));
const CategoryList = React.lazy(() => import("./pages/Admin/CategoryList/CategoryList"));
const PuzzleList = React.lazy(() => import("./pages/Admin/PuzzleList/PuzzleList"));
const PuzzleLibrary = React.lazy(() => import("./pages/Admin/PuzzleLibrary/PuzzleLibrary"));
const CreatePuzzle = React.lazy(() => import("./pages/Admin/CreatePuzzle/CreatePuzzle"));
const EditPuzzle = React.lazy(() => import("./pages/Admin/EditPuzzle/EditPuzzle"));
const CompetitionList = React.lazy(() => import("./pages/Admin/CompetitionList/CompetitionList"));
const CreateCompetition = React.lazy(() => import("./pages/Admin/CreateCompetition/CreateCompetition"));
const EditCompetition = React.lazy(() => import("./pages/Admin/EditCompetition/EditCompetition"));
const CompetitionHistory = React.lazy(() => import("./pages/Admin/CompetitionHistory/CompetitionHistory"));
const LiveTournament = React.lazy(() => import("./pages/Admin/LiveTournament/LiveTournament"));
const CompetitionParticipants = React.lazy(() => import("./pages/Admin/CompetitionParticipants/CompetitionParticipants"));
const StudentList = React.lazy(() => import("./pages/Admin/StudentList/StudentList"));
const AdminManagement = React.lazy(() => import("./pages/Admin/AdminManagement/AdminManagement"));
const AdminLeaderboard = React.lazy(() => import("./pages/Admin/Leaderboard/Leaderboard"));
const Reports = React.lazy(() => import("./pages/Admin/Reports/Reports"));
const SystemMonitor = React.lazy(() => import("./pages/Admin/SystemMonitor/SystemMonitor"));
const AdminSettings = React.lazy(() => import("./pages/Admin/Settings/Settings"));

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LiveCompetitionProvider>
          <Router>
            <CompetitionRejoinManager />
            <Suspense fallback={null}>
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
            </Suspense>
          </Router>
        </LiveCompetitionProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
