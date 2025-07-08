import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
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
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session?.user);
    };
    checkSession();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* 🔐 Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ✅ Root path always redirects to /gigs */}
        <Route path="/" element={<Navigate to="/gigs" replace />} />

        {/* 🔐 Protected Routes */}
        <Route path="/gigs" element={<ProtectedRoute><Gigs /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/post-job" element={<ProtectedRoute><PostGig /></ProtectedRoute>} />
        <Route path="/applications" element={<ProtectedRoute><MyApplications /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><ApplicationsInbox /></ProtectedRoute>} />
        <Route path="/my-jobs" element={<ProtectedRoute><MyJobs /></ProtectedRoute>} />
        <Route path="/jobs/:id" element={<ProtectedRoute><JobDetails /></ProtectedRoute>} />
        <Route path="/carpools" element={<ProtectedRoute><BrowseRides /></ProtectedRoute>} />
        <Route path="/post-ride" element={<Navigate to="/carpool" replace />} />
        <Route path="/carpool" element={<ProtectedRoute><Carpool /></ProtectedRoute>} />
        <Route path="/carpool-inbox" element={<ProtectedRoute><CarpoolInbox /></ProtectedRoute>} />
        <Route path="/notifications/:id" element={<ProtectedRoute><NotificationsDetail /></ProtectedRoute>} />

        {/* ✅ Abasare */}
        <Route path="/abasare" element={<ProtectedRoute><Abasare /></ProtectedRoute>} />
        <Route path="/abasare/:id" element={<ProtectedRoute><AbasareDetail /></ProtectedRoute>} />

        {/* ✅ Settings */}
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
