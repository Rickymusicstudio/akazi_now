import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
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
    fetchApplications();
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

  const fetchApplications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("applications")
      .select(`*, jobs(*), users:image_id(image_url, full_name, phone)`)
      .eq("poster_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setApplications(data);
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
    <div className="inbox-container">
      {/* MOBILE NAV BAR */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="mobile-title">Inbox</h2>
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
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* DESKTOP NAV */}
      <div className="inbox-desktop-nav">
        <div className="inbox-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>Logout</li>
        </ul>
      </div>

      {/* HERO */}
      <div className="inbox-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="inbox-hero-content">
          <h1 className="inbox-heading">Application Inbox</h1>
          <p className="inbox-subheading">Review incoming applications to your gigs and offers</p>
        </div>
      </div>

      {/* APPLICATION CARDS */}
      <section className="inbox-cards-section">
        {applications.length > 0 ? (
          applications.map((app) => (
            <div className="inbox-card" key={app.id}>
              <div className="inbox-card-text">
                <h2>{app.users?.full_name || "Anonymous"}</h2>
                <p><strong>Phone:</strong> {app.users?.phone || "N/A"}</p>
                <p><strong>Message:</strong> {app.message}</p>
                <p><strong>Job:</strong> {app.jobs?.title || "N/A"}</p>
              </div>
              {app.users?.image_url && (
                <img src={app.users.image_url} alt="applicant" />
              )}
            </div>
          ))
        ) : (
          <p className="inbox-empty">No applications received yet.</p>
        )}
      </section>
    </div>
  );
}

export default ApplicationsInbox;