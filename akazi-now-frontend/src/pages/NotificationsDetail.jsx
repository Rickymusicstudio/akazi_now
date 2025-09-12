import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";

import defaultAvatar from "../assets/avatar.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./NotificationsDetail.css";

function NotificationsDetail() {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const touchStartY = useRef(0);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
    fetchNotification();
  }, [id]);

  useEffect(() => {
    const handleTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY.current - touchEndY > 50) {
        setSlideDirection("nd-slide-up");
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

  const fetchNotification = async () => {
    const { data: notif, error } = await supabase
      .from("notifications")
      .select("id,message,status,created_at")
      .eq("id", id)
      .single();

    if (!error && notif) {
      setNotification(notif);
      if (notif.status === "unread") {
        await supabase.from("notifications").update({ status: "read" }).eq("id", id);
      }
    } else {
      setNotification(null);
    }
  };

  const handleHamburgerClick = () => {
    if (!mobileNavVisible) {
      setSlideDirection("nd-slide-down");
      setMobileNavVisible(true);
    } else {
      setSlideDirection("nd-slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    }
  };

  const closeAndNavigate = async (path, logout = false) => {
    setSlideDirection("nd-slide-up");
    setTimeout(async () => {
      setMobileNavVisible(false);
      setSlideDirection("");
      if (logout) await supabase.auth.signOut();
      navigate(path);
    }, 300);
  };

  return (
    <div className="nd-container">
      {/* Desktop Nav */}
      <div className="nd-desktop-nav">
        <div className="nd-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
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

      {/* Hero */}
      <div className="nd-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="nd-mobile-topbar">
          <div className="nd-mobile-left">
            <img
              src={userProfile?.image_url || defaultAvatar}
              alt="avatar"
              className="nd-mobile-avatar"
            />
            <FaBars className="nd-mobile-hamburger" onClick={handleHamburgerClick} />
          </div>
          <div className="nd-mobile-title">Notification</div>
          <NotificationBell />
        </div>

        <div className="nd-hero-content">
          <h1 className="nd-hero-title">Notification Detail</h1>
          <p className="nd-hero-subtitle">Review messages sent to you.</p>
        </div>

        {mobileNavVisible && (
          <div ref={mobileNavRef} className={`nd-mobile-nav-overlay ${slideDirection}`}>
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

      {/* Content */}
      <section className="nd-cards-section">
        <div className="nd-card">
          <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>Message</h2>
          {notification ? (
            <div className="nd-message">
              <p className="nd-message-text"><strong>{notification.message}</strong></p>
              <p className="nd-message-time">
                Received: {new Date(notification.created_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <p style={{ textAlign: "center", fontWeight: "bold" }}>Notification not found.</p>
          )}
        </div>

        <div className="nd-side-card">
          <div className="nd-side-content">
            <h3>Stay Notified</h3>
            <p>Keep an eye on your bell icon for new messages.</p>
          </div>
        </div>
      </section>

      <footer className="nd-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="nd-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default NotificationsDetail;
