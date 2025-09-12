import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa";
import "./NotificationBell.css";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    // Optional: live updates
    const channel = supabase
      .channel("notifications-bell")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => loadNotifications()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const loadNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notes, error } = await supabase
      .from("notifications")
      .select("id,message,status,created_at,related_listing_id,sender_id")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !notes?.length) {
      setNotifications([]);
      return;
    }

    // enrich with sender name and item title
    const listingIds = [...new Set(notes.map(n => n.related_listing_id).filter(Boolean))];
    const senderIds  = [...new Set(notes.map(n => n.sender_id).filter(Boolean))];

    const [listingsRes, sendersRes] = await Promise.all([
      listingIds.length
        ? supabase.from("market_listings").select("id,title").in("id", listingIds)
        : Promise.resolve({ data: [] }),
      senderIds.length
        ? supabase.from("users").select("auth_user_id,full_name").in("auth_user_id", senderIds)
        : Promise.resolve({ data: [] }),
    ]);

    const listingMap = Object.fromEntries((listingsRes.data || []).map(l => [l.id, l.title]));
    const senderMap  = Object.fromEntries((sendersRes.data || []).map(u => [u.auth_user_id, u.full_name]));

    const merged = notes.map(n => ({
      ...n,
      itemTitle: n.related_listing_id ? (listingMap[n.related_listing_id] || "Item") : null,
      senderName: n.sender_id ? (senderMap[n.sender_id] || "User") : null,
    }));

    setNotifications(merged);
  };

  const handleNotificationClick = async (note) => {
    // mark as read
    await supabase.from("notifications").update({ status: "read" }).eq("id", note.id);

    // Deep-link to chat with sender (if available)
    if (note.sender_id) {
      const listingQuery = note.related_listing_id ? `&listing=${note.related_listing_id}` : "";
      navigate(`/messages?with=${note.sender_id}${listingQuery}`);
    } else {
      // fallback: open inbox if no sender id available
      navigate("/inbox");
    }
    setShowDropdown(false);
  };

  const unreadCount = notifications.filter((n) => n.status !== "read").length;

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell-button"
        onClick={() => setShowDropdown((s) => !s)}
        aria-label="Notifications"
      >
        <FaBell size={20} />
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
              >
                {(note.senderName || note.itemTitle) && (
                  <p className="notification-item-title">
                    {note.senderName ? `${note.senderName}` : "Someone"}
                    {note.itemTitle ? ` • ${note.itemTitle}` : ""}
                  </p>
                )}
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
