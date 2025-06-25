import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./NotificationsDetail.css";

function NotificationsDetail() {
  const [notifications, setNotifications] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setNotifications(data || []);
    }
  };

  return (
    <div className="notifications-container">
      {/* MOBILE NAV HEADER */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Notification</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/"); }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-job"); }}>Post a Job</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/my-jobs"); }}>My Jobs</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/profile"); }}>Profile</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/inbox"); }}>Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools"); }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* DESKTOP LEFT PANEL */}
      <div className="notifications-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>Notification</h2>
        <NotificationBell />
      </div>

      {/* RIGHT PANEL */}
      <div className="notifications-right">
        {notifications.length === 0 ? (
          <p style={{ textAlign: "center" }}>You have no notifications.</p>
        ) : (
          notifications.map((note) => (
            <div key={note.id} className="notification-card">
              <p><strong>🎉 Your application for {note.payload?.title || "a gig"} has been {note.payload?.status || "updated"}!</strong></p>
              <p style={{ fontSize: "14px", color: "gray" }}>
                Received: {new Date(note.created_at).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsDetail;