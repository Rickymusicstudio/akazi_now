import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell"; // ✅ Import bell

function CarpoolInbox() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
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
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "Segoe UI, sans-serif" }}>
      {/* LEFT PANEL */}
      <div style={{
        width: "50%",
        background: "linear-gradient(135deg, #6a00ff, #ff007a)",
        color: "white",
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: "1rem",
          left: "1.5rem",
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          fontWeight: "bold",
          fontSize: "14px"
        }}>
          <button onClick={() => navigate("/")} style={navStyle}>Home</button>
          <button onClick={() => navigate("/carpools")} style={navStyle}>Browse Rides</button>
          <button onClick={() => navigate("/post-ride")} style={navStyle}>Post Ride</button>
          <button onClick={() => navigate("/carpool-inbox")} style={navStyle}>Carpool Inbox</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ ...navStyle, color: "#ffcccc" }}>Logout</button>
        </div>

        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Carpool Inbox</h2>
        <NotificationBell /> {/* ✅ Added bell below heading */}
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: "50%",
        height: "100vh",
        overflowY: "auto",
        padding: "2rem",
        backgroundColor: "#fff",
        boxSizing: "border-box"
      }}>
        {loading ? (
          <p>Loading...</p>
        ) : rides.length === 0 ? (
          <p>No rides found.</p>
        ) : (
          rides.map((ride) => (
            <div key={ride.id} style={{
              background: "#fff",
              padding: "1.5rem",
              borderRadius: "16px",
              boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
              marginBottom: "1rem"
            }}>
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
