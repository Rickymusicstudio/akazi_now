import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./MyJobs.css";

function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const touchStartY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyJobs();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY.current - touchEndY > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavVisible(false), 300);
      }
    };

    if (mobileNavVisible) {
      window.addEventListener("touchstart", handleTouchStart);
      window.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavVisible]);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();

    setUserProfile(data);
  };

  const fetchMyJobs = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setJobs(data);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this job?");
    if (!confirmed) return;

    await supabase.from("applications").delete().eq("gig_id", id);
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (!error) fetchMyJobs();
  };

  const handleHamburgerClick = () => {
    if (!mobileNavVisible) {
      setSlideDirection("slide-down");
      setMobileNavVisible(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    }
  };

  const handleNavClick = (path) => {
    setSlideDirection("slide-up");
    setTimeout(() => {
      setMobileNavVisible(false);
      navigate(path);
    }, 300);
  };

  return (
    <div className="myjobs-container">
      {/* MOBILE NAV BAR */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="mobile-title">My Jobs</h2>
        <NotificationBell />
      </div>

      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => handleNavClick("/")}>Home</li>
            <li onClick={() => handleNavClick("/gigs")}>Gigs</li>
            <li onClick={() => handleNavClick("/post-job")}>Post a Job</li>
            <li onClick={() => handleNavClick("/my-jobs")}>My Jobs</li>
            <li onClick={() => handleNavClick("/profile")}>Profile</li>
            <li onClick={() => handleNavClick("/inbox")}>Inbox</li>
            <li onClick={() => handleNavClick("/carpools")}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* DESKTOP NAV */}
      <div className="desktop-nav">
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
        </ul>
      </div>

      {/* HERO */}
      <div className="public-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="public-topbar">
          <div className="public-logo">AkaziNow</div>
          <div className="public-auth-buttons">
            <button onClick={() => navigate("/login")}>Sign In</button>
            <button onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>

        <div className="public-hero-content">
          <h1 className="public-heading">Your Posted Gigs</h1>
          <p className="public-subheading">Manage the jobs you've shared with the community.</p>
        </div>
      </div>

      {/* JOB COUNT SECTION */}
      <section className="public-search-section">
        <h2 className="public-search-title">📋 My Jobs</h2>
        <div className="public-count">
          <FaCalendarCheck /> {jobs.length} Jobs Posted
        </div>
      </section>

      {/* JOB CARDS */}
      <section className="services-section">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div className="service-card" key={job.id}>
              <div className="service-text">
                <h2>{job.title}</h2>
                <p>{job.job_description}</p>
                <p><strong>Price:</strong> {job.price} RWF</p>
                <p><strong>Location:</strong> {job.address}</p>
                <p><strong>Contact:</strong> {job.contact_info}</p>
                <p><strong>Status:</strong> {job.status === "closed" ? "❌ Closed" : "✅ Open"}</p>
                <button onClick={() => handleDelete(job.id)}>Delete Job</button>
              </div>
              {job.poster_image && <img src={job.poster_image} alt="gig" />}
            </div>
          ))
        ) : (
          <p className="empty-message">You haven’t posted any jobs yet.</p>
        )}
      </section>
    </div>
  );
}

export default MyJobs;