import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import "./NotificationBell.css"; // ✅ Make sure this CSS file exists

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setNotifications(data);
  };

  const handleNotificationClick = async (note) => {
    // ✅ Optionally mark as read
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", note.id);

    // ✅ Redirect to inbox
    navigate("/inbox");
    setShowDropdown(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaBell color="#b8860b" size={20} />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <p style={{ color: "#777" }}>No notifications yet.</p>
          ) : (
            notifications.map((note) => (
              <div
                key={note.id}
                className="notification-item"
                onClick={() => handleNotificationClick(note)}
              >
                <p className="notification-message">{note.message}</p>
                <p className="notification-time">
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
