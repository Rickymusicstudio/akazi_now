import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
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
import JobDetails from "./pages/JobDetails"; // ✅ NEW

function App() {
  return (
    <Router>
      <Routes>
        {/* 🔐 Auth Routes */}
        <Route path="/" element={<Login />} /> {/* ✅ Default is Login now */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />

        {/* 🏠 Main Job Routes */}
        <Route path="/gigs" element={<Gigs />} /> {/* Optional: keep gigs accessible via /gigs */}
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/post-job" element={<PostGig />} />
        <Route path="/applications" element={<MyApplications />} />
        <Route path="/inbox" element={<ApplicationsInbox />} />
        <Route path="/my-jobs" element={<MyJobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />

        {/* 🚗 Carpool Routes */}
        <Route path="/carpools" element={<BrowseRides />} />
        <Route path="/post-ride" element={<Carpool />} />
        <Route path="/carpool" element={<Carpool />} />
        <Route path="/carpool-inbox" element={<CarpoolInbox />} />

        {/* 🔔 Notifications */}
        <Route path="/notifications/:id" element={<NotificationsDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
