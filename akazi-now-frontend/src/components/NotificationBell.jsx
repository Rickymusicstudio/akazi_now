import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setNotifications(data);
  };

  const goToDetail = (note) => {
    navigate(`/notifications/${note.id}`);
    setShowDropdown(false);
  };

  return (
    <div style={{ position: "absolute", top: "1rem", right: "1.5rem", zIndex: 10 }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: "white",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: "pointer",
        }}
      >
        <FaBell color="#6a00ff" size={20} />
      </button>

      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: 0,
            width: "300px",
            background: "white",
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
            borderRadius: "8px",
            padding: "1rem",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          {notifications.length === 0 ? (
            <p style={{ color: "#777" }}>No notifications yet.</p>
          ) : (
            notifications.map((note) => (
              <div
                key={note.id}
                onClick={() => goToDetail(note)}
                style={{
                  borderBottom: "1px solid #eee",
                  padding: "0.5rem 0",
                  cursor: "pointer",
                }}
              >
                <p style={{ margin: 0, fontWeight: "bold", color: "#333" }}>
                  {note.message}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
