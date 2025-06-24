import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell";
import "./CarpoolInbox.css";

function CarpoolInbox() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDriverRides();
  }, []);

  const fetchDriverRides = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("carpools")
      .select(`
        *,
        reservations:carpool_reservations(*, user:user_id(full_name, phone))
      `)
      .eq("driver_id", user.id)
      .order("datetime", { ascending: true });

    if (error) {
      console.error("❌ Failed to load inbox:", error.message);
    } else {
      setRides(data || []);
    }
    setLoading(false);
  };

  return (
    <>
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-hamburger" onClick={() => setMobileNavOpen(true)}>☰</div>
        <h2 className="mobile-title">Carpool Inbox</h2>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Fullscreen Nav Overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-ride") }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox") }}>Carpool Inbox</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      <div className="carpool-inbox-container">
        {/* ✅ Desktop Left Nav */}
        <div className="carpool-inbox-left">
          <div className="nav-buttons">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/carpools")}>Browse Rides</button>
            <button onClick={() => navigate("/post-ride")}>Post Ride</button>
            <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Carpool Inbox</h2>
          <NotificationBell />
        </div>

        {/* ✅ Right Panel */}
        <div className="carpool-inbox-right">
          {loading ? (
            <p>Loading...</p>
          ) : rides.length === 0 ? (
            <p>No rides found.</p>
          ) : (
            rides.map((ride) => (
              <div key={ride.id} className="inbox-card">
                <h3>{ride.origin} → {ride.destination}</h3>
                <p><strong>Date/Time:</strong> {new Date(ride.datetime).toLocaleString()}</p>
                <h4 style={{ marginTop: "1rem" }}>Reservations:</h4>
                {ride.reservations?.length ? (
                  <ul>
                    {ride.reservations.map((r, idx) => (
                      <li key={idx}>
                        <strong>{r.user?.full_name || "Unknown"}</strong> — {r.user?.phone || "N/A"} — {r.seats_reserved} seat(s)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ color: "#999" }}>No one has reserved this ride yet.</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const navStyle = {
  background: "none",
  border: "none",
  color: "white",
  fontWeight: "bold",
  fontSize: "14px",
  cursor: "pointer",
};

export default CarpoolInbox;
