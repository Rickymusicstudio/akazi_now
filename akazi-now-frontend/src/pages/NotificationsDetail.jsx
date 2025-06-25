import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import "./Notifications.css"; // assumes you have your CSS here

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("❌ Could not fetch user:", authError?.message || "No user found");
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ Supabase error fetching notifications:", error.message);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <div className="notifications-container">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Notification</h2>
        <NotificationBell />
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-job") }}>Post a Job</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/my-jobs") }}>My Jobs</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/profile") }}>Profile</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/inbox") }}>Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Car Pooling</li>
            <li onClick={async () => {
              await supabase.auth.signOut();
              navigate("/login");
            }}>
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* Notifications Content */}
      <div className="notifications-right">
        {notifications.length === 0 ? (
          <p className="empty-message">You have no notifications.</p>
        ) : (
          notifications.map((note) => (
            <div key={note.id} className="notification-card">
              <p><span role="img" aria-label="party">🎉</span> <strong>Your application for <span style={{ color: "#6a00ff" }}>{note.topic}</span> has been accepted!</strong></p>
              <p className="notification-date">Received: {new Date(note.created_at).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
