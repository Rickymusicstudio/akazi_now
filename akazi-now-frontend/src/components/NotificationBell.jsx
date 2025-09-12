import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import "./NotificationBell.css";

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    // Optional: live updates via channel (uncomment if you want realtime)
    // const channel = supabase
    //   .channel("notifications_changes")
    //   .on(
    //     "postgres_changes",
    //     { event: "*", schema: "public", table: "notifications" },
    //     () => loadNotifications()
    //   )
    //   .subscribe();
    // return () => { supabase.removeChannel(channel); };
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Match your actual columns: id, message, status, created_at, application_id
    const { data: notes, error } = await supabase
      .from("notifications")
      .select("id,message,status,created_at,application_id")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !notes) return;
    setNotifications(notes);
  };

  const handleNotificationClick = async (note) => {
    // Mark as read using 'status'
    await supabase.from("notifications").update({ status: "read" }).eq("id", note.id);

    // Go to detail page
    navigate(`/notifications/${note.id}`);
    setShowDropdown(false);
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown((s) => !s)}
        aria-label="Notifications"
      >
        <FaBell color="#b8860b" size={20} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          {notifications.length === 0 ? (
            <p className="notification-empty">No notifications yet.</p>
          ) : (
            notifications.map((note) => (
              <div
                key={note.id}
                className="notification-item"
                onClick={() => handleNotificationClick(note)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleNotificationClick(note)}
              >
                {/* Title placeholder: once you add related_listing_id + join, place it here */}
                {/* <p className="notification-item-title"><strong>{note.itemTitle}</strong></p> */}
                <p className="notification-message">{note.message}</p>
                <span className="notification-time">
                  {new Date(note.created_at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
