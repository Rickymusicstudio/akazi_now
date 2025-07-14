import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./MyJobs.css";

function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const lastScrollY = useRef(0);
  const mobileNavRef = useRef(null);

  useEffect(() => {
    fetchUserProfile();
    fetchMyJobs();

    let touchStartY = 0;

    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current - 10 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
      lastScrollY.current = currentY;
    };

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY - touchEndY > 50 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavOpen]);

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();

    setUserProfile(data);
  };

  const fetchMyJobs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) console.error("❌ Failed to fetch jobs:", error.message);
    else setJobs(data || []);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    const { error: appDeleteError } = await supabase
      .from("applications")
      .delete()
      .eq("gig_id", id);

    if (appDeleteError)
      return alert("❌ Failed to delete related applications: " + appDeleteError.message);

    const { error: jobDeleteError } = await supabase
      .from("jobs")
      .delete()
      .eq("id", id);

    if (jobDeleteError) alert("❌ Failed to delete job: " + jobDeleteError.message);
    else {
      alert("✅ Job deleted");
      fetchMyJobs();
    }
  };

  const handleToggleNav = () => {
    if (mobileNavOpen) {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavOpen(false), 300);
    } else {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
      if (mobileNavRef.current) {
        mobileNavRef.current.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <div className="myjobs-wrapper">
      {/* Desktop Navigation Bar */}
      <nav className="desktop-navbar">
        <div className="nav-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <div className="nav-links">
          <button onClick={() => navigate("/gigs")}>Gigs</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }}>Logout</button>
        </div>
        {!user ? (
          <div className="desktop-auth-buttons">
            <button onClick={() => navigate("/login")}>Sign In</button>
            <button onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        ) : null}
      </nav>

      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={handleToggleNav} />
        </div>
        <h2 className="mobile-title">My Jobs</h2>
        <NotificationBell />
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div
          ref={mobileNavRef}
          className={`mobile-nav-overlay ${slideDirection}`}
          style={{ overflowY: "auto" }}
        >
          <ul>
            <li onClick={() => { handleToggleNav(); navigate("/") }}>Home</li>
            <li onClick={() => { handleToggleNav(); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { handleToggleNav(); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { handleToggleNav(); navigate("/profile") }}>Profile</li>
            <li onClick={() => { handleToggleNav(); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { handleToggleNav(); navigate("/carpools") }}>Car Pooling</li>
            <li onClick={async () => {
              await supabase.auth.signOut();
              handleToggleNav();
              navigate("/login");
            }}>Logout</li>
          </ul>
        </div>
      )}

      {/* Hero Section */}
      <div className="hero-section" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="hero-overlay">
          <h1 className="hero-title">Your Posted Gigs</h1>
          <p className="hero-subtitle">Manage the jobs you've shared with the community.</p>
        </div>
      </div>

      {/* Section 2 */}
      <div className="section-two">
        <div className="section-card">
          <h2><span role="img" aria-label="jobs">📋</span> My Jobs</h2>
          <p><span role="img" aria-label="number">🎁</span> {jobs.length} Jobs Posted</p>
        </div>
      </div>

      {/* Job List */}
      <div className="job-list">
        {loading ? null : jobs.length === 0 ? (
          <p className="empty-message">You haven’t posted any jobs yet.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id} className="job-card">
              <h3>{job.title}</h3>
              <p><strong>Posted by:</strong> {job.employer_name}</p>
              <p><strong>Address:</strong> {job.address}</p>
              <p><strong>Description:</strong> {job.job_description}</p>
              <p><strong>Requirement:</strong> {job.requirement || "-"}</p>
              {job.price && <p><strong>Price:</strong> {job.price} Frw</p>}
              <p><strong>Contact:</strong> {job.contact_info}</p>
              <p className={job.status === "closed" ? "job-status closed" : "job-status open"}>
                <strong>Status:</strong> {job.status === "closed" ? "❌ Closed" : "✅ Open"}
              </p>
              <button className="delete-btn" onClick={() => handleDelete(job.id)}>Delete Job</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MyJobs;
