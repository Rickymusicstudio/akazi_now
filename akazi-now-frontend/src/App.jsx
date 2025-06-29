import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword"; // ✅ NEW
import ResetPassword from "./pages/ResetPassword";   // ✅ NEW
import UserProfile from "./pages/UserProfile";
import PostGig from "./pages/PostGig";
import Gigs from "./pages/Gigs";
import MyApplications from "./pages/MyApplications";
import ApplicationsInbox from "./pages/ApplicationsInbox";
import MyJobs from "./pages/MyJobs";
import Carpool from "./pages/Carpool";
import BrowseRides from "./pages/BrowseRides";
import CarpoolInbox from "./pages/CarpoolInbox";
import NotificationsDetail from "./pages/NotificationsDetail";
import JobDetails from "./pages/JobDetails";
import ProtectedRoute from "./components/ProtectedRoute";
import Abasare from "./pages/Abasare";
import AbasareDetail from "./pages/AbasareDetail";
import Settings from "./pages/Settings";

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ✅ Added */}
        <Route path="/reset-password" element={<ResetPassword />} />   {/* ✅ Added */}

        {/* 🏁 Default redirect */}
        <Route path="/" element={<Navigate to="/gigs" replace />} />

        {/* 🧱 Protected Routes */}
        <Route path="/gigs" element={<ProtectedRoute><Gigs /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/post-job" element={<ProtectedRoute><PostGig /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><ApplicationsInbox /></ProtectedRoute>} />
        <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
        <Route path="/carpools" element={<ProtectedRoute><BrowseRides /></ProtectedRoute>} />
        <Route path="/post-ride" element={<ProtectedRoute><Carpool /></ProtectedRoute>} />
        <Route path="/carpool" element={<ProtectedRoute><Carpool /></ProtectedRoute>} />
        <Route path="/carpool-inbox" element={<ProtectedRoute><CarpoolInbox /></ProtectedRoute>} />
        <Route path="/notifications/:id" element={<ProtectedRoute><NotificationsDetail /></ProtectedRoute>} />

        {/* ✅ Abasare Routes */}
        <Route path="/abasare" element={<ProtectedRoute><Abasare /></ProtectedRoute>} />
        <Route path="/abasare/:id" element={<ProtectedRoute><AbasareDetail /></ProtectedRoute>} />

        {/* ✅ Settings Page */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
