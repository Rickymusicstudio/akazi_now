import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useParams } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import { FaBars } from "react-icons/fa";
import "./NotificationsDetail.css";

function NotificationsDetail() {
  const [notifications, setNotifications] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { id } = useParams(); // optional: for deep linking

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id) // ✅ FIXED COLUMN NAME
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching notifications:", error.message);
    } else {
      setNotifications(data);
    }
  };

  return (
    <div className="notifications-container">
      <div className="mobile-top-bar">
        <FaBars className="hamburger" onClick={() => setMobileNavOpen(!mobileNavOpen)} />
        <div className="mobile-title">Notification</div>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileNavOpen(false)}>
          <ul>
            <li>Home</li>
            <li>Post a Job</li>
            <li>Profile</li>
          </ul>
        </div>
      )}

      <div className="notifications-right">
        {notifications.length === 0 ? (
          <p style={{ textAlign: "center", marginTop: "2rem" }}>You have no notifications.</p>
        ) : (
          notifications.map((notification) => (
            <div key={notification.id} className="notification-card">
              <p className="notification-message">{notification.message}</p>
              <p className="notification-date">
                Received: {new Date(notification.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsDetail;
