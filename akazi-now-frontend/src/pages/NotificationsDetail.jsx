import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./NotificationsDetail.css";

function NotificationsDetail() {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotification();
    fetchCurrentUser();
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
    setLoading(false);
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!notification) return <p style={{ padding: "2rem" }}>Notification not found.</p>;

  return (
    <div className="notifications-container">
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Notification</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
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

      {/* Left Panel - Desktop */}
      <div className="notifications-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
          <button onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2>Notification</h2>
        <NotificationBell />
      </div>

      {/* Right Panel */}
      <div className="notifications-right">
        <div className="notification-card">
          <p><strong>{notification.message}</strong></p>
          <p>Received: {new Date(notification.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default NotificationsDetail;
