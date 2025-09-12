import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import "./NotificationsDetail.css";

function NotificationsDetail() {
  const { id } = useParams();
  const [notification, setNotification] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAll = async () => {
    setLoading(true);

    // Load the notification
    const { data: notif, error: nErr } = await supabase
      .from("notifications")
      .select("*")
      .eq("id", id)
      .single();

    if (nErr) {
      console.error("❌ Failed to load notification:", nErr.message);
      setNotification(null);
      setListing(null);
      setLoading(false);
      return;
    }
    setNotification(notif);

    // If linked to an isoko item, load it
    if (notif?.related_listing_id) {
      const { data: item, error: lErr } = await supabase
        .from("market_listings")
        .select("id,title,price,currency,location,category,first_image_url")
        .eq("id", notif.related_listing_id)
        .single();

      if (!lErr) setListing(item);
      else console.warn("⚠️ Linked listing not found:", lErr.message);
    } else {
      setListing(null);
    }

    setLoading(false);
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!notification) return <p style={{ padding: "2rem" }}>Notification not found.</p>;

  return (
    <div className="notifications-container">
      {/* Mobile Top Bar */}
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
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool"); }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* Left Panel (desktop) */}
      <div className="notifications-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpool")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>
            Logout
          </button>
        </div>
        <h2>Notification</h2>
        <NotificationBell />
      </div>

      {/* Right Panel */}
      <div className="notifications-right">
        <div className="notification-card">
          <p className="notif-message"><strong>{notification.message}</strong></p>
          <p className="notif-date">Received: {new Date(notification.created_at).toLocaleString()}</p>

          {listing ? (
            <div className="notif-item">
              <div className="notif-item-thumb">
                {listing.first_image_url ? (
                  <img src={listing.first_image_url} alt={listing.title} loading="lazy" />
                ) : (
                  <div className="notif-item-thumb--placeholder">No image</div>
                )}
              </div>
              <div className="notif-item-info">
                <h4 className="notif-item-title">{listing.title}</h4>
                <div className="notif-item-meta">
                  {listing.price != null && (
                    <div><b>Price:</b> {Number(listing.price).toLocaleString()} {listing.currency || "RWF"}</div>
                  )}
                  {listing.location && <div><b>Location:</b> {listing.location}</div>}
                  {listing.category && <div><b>Category:</b> {listing.category}</div>}
                </div>
                <div className="notif-item-actions">
                  <button className="notif-btn" onClick={() => navigate("/isoko")}>
                    View item
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="notif-item-empty">This notification isn’t linked to a specific item.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsDetail;
