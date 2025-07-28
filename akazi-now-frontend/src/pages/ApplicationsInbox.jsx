import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import inboxSticker from "../assets/inbox.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./Inbox.css";

function ApplicationsInbox() {
  const [applications, setApplications] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const touchStartY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchApplications();
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

  const fetchApplications = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    console.log("📌 Logged-in user ID:", user.id);

    const { data: jobsData, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, user_id")
      .eq("user_id", user.id);

    if (jobsError) {
      console.error("❌ Jobs fetch error:", jobsError);
      return;
    }

    if (!jobsData || jobsData.length === 0) {
      console.warn("⚠️ No jobs found for this user.");
      return;
    }

    const jobIds = jobsData.map((j) => j.id);
    console.log("✅ Job IDs owned by this user:", jobIds);

    const { data: appsData, error: appsError } = await supabase
      .from("applications")
      .select(`
        *,
        jobs!fk_applications_gig(id, title, contact_info, poster_image, price),
        applicant:users!fk_applications_worker(image_url, full_name, phone)
      `)
      .in("gig_id", jobIds)
      .order("applied_at", { ascending: false });

    if (appsError) {
      console.error("❌ Applications fetch error:", appsError);
      return;
    }

    console.log("📬 Applications fetched:", appsData);
    setApplications(appsData);
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

  const closeAndNavigate = async (path, logout = false) => {
    setSlideDirection("slide-up");
    setTimeout(async () => {
      setMobileNavVisible(false);
      setSlideDirection("");
      if (logout) await supabase.auth.signOut();
      navigate(path);
    }, 300);
  };

  return (
    <div className="postgig-container">
      {/* Desktop Nav */}
      <div className="postgig-desktop-nav">
        <div className="postgig-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
        </ul>
      </div>

      {/* Hero Section */}
      <div className="postgig-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="postgig-mobile-topbar">
          <div className="postgig-mobile-left">
            <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="postgig-mobile-avatar" />
            <FaBars className="postgig-mobile-hamburger" onClick={handleHamburgerClick} />
          </div>
          <div className="postgig-mobile-title">Inbox</div>
          <NotificationBell />
        </div>

        <div className="postgig-hero-content">
          <h1 className="postgig-hero-title">Application Inbox</h1>
          <p className="postgig-hero-subtitle">Review applications submitted to your job posts</p>
        </div>

        {mobileNavVisible && (
          <div ref={mobileNavRef} className={`postgig-mobile-nav-overlay ${slideDirection}`}>
            <ul>
              <li onClick={() => closeAndNavigate("/")}>Home</li>
              <li onClick={() => closeAndNavigate("/gigs")}>Gigs</li>
              <li onClick={() => closeAndNavigate("/post-job")}>Post a Job</li>
              <li onClick={() => closeAndNavigate("/my-jobs")}>My Jobs</li>
              <li onClick={() => closeAndNavigate("/profile")}>Profile</li>
              <li onClick={() => closeAndNavigate("/inbox")}>Inbox</li>
              <li onClick={() => closeAndNavigate("/carpools")}>Car Pooling</li>
              <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
            </ul>
          </div>
        )}
      </div>

      {/* Two-Panel Section */}
      <section className="postgig-services-section">
        <div className="postgig-form-card">
          <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Applications Received</h2>
          {applications.length > 0 ? (
            applications.map((app) => (
              <div key={app.id} style={{
                background: "white",
                borderRadius: "12px",
                padding: "1rem",
                marginBottom: "1.5rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}>
                <h3>{app.applicant?.full_name || "Anonymous"}</h3>
                <p><strong>Phone:</strong> {app.applicant?.phone || "N/A"}</p>
                <p><strong>Message:</strong> {app.message}</p>
                <p><strong>Job:</strong> {app.jobs?.title || "N/A"}</p>
                {app.applicant?.image_url && (
                  <img src={app.applicant.image_url} alt="applicant" style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginTop: "0.5rem"
                  }} />
                )}
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", fontWeight: "bold" }}>
              No applications received yet.
            </p>
          )}
        </div>

        <div className="postgig-sticker-card">
          <div className="postgig-info-card-content">
            <h3>Stay Organized</h3>
            <p>Manage all gig applications in one place. Respond to your best candidates quickly.</p>
            <img src={inboxSticker} alt="Inbox Sticker" className="postgig-info-card-image" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="postgig-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="postgig-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default ApplicationsInbox;
