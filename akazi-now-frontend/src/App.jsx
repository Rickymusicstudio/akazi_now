import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

/* Auth */
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

/* Core user/pages */
import UserProfile from "./pages/UserProfile";
import Settings from "./pages/Settings";
import Index from "./pages/index"; // Public landing

/* Gigs */
import PostGig from "./pages/PostGig";
import Gigs from "./pages/Gigs";
import MyApplications from "./pages/MyApplications";
import ApplicationsInbox from "./pages/ApplicationsInbox";
import MyJobs from "./pages/MyJobs";
import JobDetails from "./pages/JobDetails";
import NotificationsDetail from "./pages/NotificationsDetail";

/* Carpools / Rides */
import Carpool from "./pages/Carpool"; // legacy post ride (older version)
import PostRide from "./pages/PostRide"; // new PostRide component
import BrowseRides from "./pages/BrowseRides";
import CarpoolInbox from "./pages/CarpoolInbox";

/* Abasare */
import Abasare from "./pages/Abasare";
import AbasareDetail from "./pages/AbasareDetail";

/* Protection */
import ProtectedRoute from "./components/ProtectedRoute";

/* ✅ ISOKO (Market) */
import Isoko from "./pages/Isoko";
import PostIsoko from "./pages/PostIsoko";
import IsokoCategory from "./pages/IsokoCategory";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public Landing */}
        <Route path="/" element={<Index />} />

        {/* Public Gigs & Browse */}
        <Route path="/gigs" element={<Gigs />} />
        <Route path="/carpools" element={<BrowseRides />} />
        <Route path="/browse-rides" element={<BrowseRides />} /> {/* alias */}
        <Route path="/abasare" element={<Abasare />} />

        {/* ✅ ISOKO MARKET */}
        <Route path="/isoko" element={<Isoko />} />
        <Route
          path="/isoko/post-item"
          element={
            <ProtectedRoute>
              <PostIsoko />
            </ProtectedRoute>
          }
        />
        <Route path="/isoko/categories/:name" element={<IsokoCategory />} />

        {/* Protected Actions (Gigs/Carpools/Profile/etc.) */}
        <Route
          path="/post-job"
          element={
            <ProtectedRoute>
              <PostGig />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carpool"
          element={
            <ProtectedRoute>
              <Carpool />
            </ProtectedRoute>
          }
        />
        <Route
          path="/post-ride"
          element={
            <ProtectedRoute>
              <PostRide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/applications"
          element={
            <ProtectedRoute>
              <MyApplications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inbox"
          element={
            <ProtectedRoute>
              <ApplicationsInbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-jobs"
          element={
            <ProtectedRoute>
              <MyJobs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/carpool-inbox"
          element={
            <ProtectedRoute>
              <CarpoolInbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications/:id"
          element={
            <ProtectedRoute>
              <NotificationsDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/abasare/:id"
          element={
            <ProtectedRoute>
              <AbasareDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
