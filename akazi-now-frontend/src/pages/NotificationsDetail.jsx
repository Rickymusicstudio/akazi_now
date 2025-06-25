import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import "./Signup.css";

function NotificationsDetail() {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);
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
    <div className="signup-container">
      {/* Left Panel */}
      <div className="signup-left" style={{
        background: "linear-gradient(135deg, #6a00ff, #ff007a)",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        color: "white",
      }}>
        <div style={{
          position: "absolute",
          top: "1rem",
          left: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          fontWeight: "bold",
          fontSize: "14px",
        }}>
          <button onClick={() => navigate("/")} style={navStyle}>Home</button>
          <button onClick={() => navigate("/post-job")} style={navStyle}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")} style={navStyle}>My Jobs</button>
          <button onClick={() => navigate("/profile")} style={navStyle}>Profile</button>
          <button onClick={() => navigate("/inbox")} style={navStyle}>Inbox</button>
          <button onClick={() => navigate("/carpool")} style={navStyle}>Car Pooling</button>
          <button onClick={async () => {
            await supabase.auth.signOut();
            navigate("/login");
          }} style={{ ...navStyle, color: "#ffcccc" }}>
            Logout
          </button>
        </div>
        <h2 style={{ marginTop: "4rem" }}>Notification</h2>
        <div style={{ marginTop: "1rem" }}>
          <NotificationBell />
        </div>
      </div>

      {/* Right Panel */}
      <div className="signup-right" style={{ padding: "2rem" }}>
        <div style={cardStyle}>
          <p style={{ fontWeight: "bold", fontSize: "16px" }}>{notification.message}</p>
          <p style={{ fontSize: "12px", color: "#888" }}>
            Received: {new Date(notification.created_at).toLocaleString()}
          </p>
        </div>

        {/* ✅ Chat Box Here */}
        <div style={{ marginTop: "2rem" }}>
          <ChatBox
            senderId={currentUserId}
            receiverId={notification.sender_id} // assumes you store this in notifications table
            context={`notification-${notification.id}`}
          />
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "16px",
  boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
};

const navStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

export default NotificationsDetail;
