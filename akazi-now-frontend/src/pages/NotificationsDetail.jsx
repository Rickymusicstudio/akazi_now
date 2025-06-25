import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./NotificationsDetail.css"; // ⬅️ New mobile-only styling

function NotificationsDetail() {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotification();
  }, [id]);

  const fetchNotification = async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ Failed to load notification:", error.message);
    } else {
      setNotification(data);
    }
  };

  if (!notification) return <p style={{ padding: "2rem" }}>Loading...</p>;

  return (
    <div className="signup-container">
      {/* Mobile Nav */}
      <div className="notification-mobile-top">
        <FaBars className="notification-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="notification-title">Notification</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="notification-mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/profile") }}>Profile</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool") }}>Car Pooling</li>
            <li onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}>Logout</li>
          </ul>
        </div>
      )}

      {/* Left Panel (Desktop) */}
      <div className="signup-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}
            style={{ color: "#ffcccc" }}
          >
            Logout
          </button>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>Notification</h2>
        <NotificationBell />
      </div>

      {/* Right Panel */}
      <div className="signup-right notification-right-panel">
        <div className="notification-card">
          <p style={{ fontWeight: "bold", fontSize: "16px" }}>{notification.message}</p>
          <p style={{ fontSize: "12px", color: "#888" }}>
            Received: {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default NotificationsDetail;
