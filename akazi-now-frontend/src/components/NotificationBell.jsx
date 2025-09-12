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
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch notifications for this user (only the needed fields)
    const { data: notes, error } = await supabase
      .from("notifications")
      .select("id,message,read,created_at,related_listing_id")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !notes) return;

    // Collect unique listing IDs and fetch their titles
    const listingIds = [
      ...new Set(notes.map((n) => n.related_listing_id).filter(Boolean)),
    ];

    let listingMap = {};
    if (listingIds.length > 0) {
      const { data: listings } = await supabase
        .from("market_listings")
        .select("id,title")
        .in("id", listingIds);

      if (listings) {
        listingMap = Object.fromEntries(listings.map((l) => [l.id, l]));
      }
    }

    // Merge: attach itemTitle if present
    const merged = notes.map((n) => ({
      ...n,
      itemTitle: n.related_listing_id
        ? listingMap[n.related_listing_id]?.title || "Item"
        : null,
    }));

    setNotifications(merged);
  };

  const handleNotificationClick = async (note) => {
    // Mark as read (best-effort)
    await supabase.from("notifications").update({ read: true }).eq("id", note.id);

    // ➜ Go to the notification detail page
    navigate(`/notifications/${note.id}`);
    setShowDropdown(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <FaBell color="#b8860b" size={20} />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
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
                onKeyDown={(e) => (e.key === "Enter" ? handleNotificationClick(note) : null)}
              >
                {note.itemTitle && (
                  <p className="notification-item-title">
                    <strong>{note.itemTitle}</strong>
                  </p>
                )}
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
