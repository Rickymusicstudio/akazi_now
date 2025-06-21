import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell"; // ✅ Import bell

function BrowseRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationCounts, setReservationCounts] = useState({});
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
    fetchRides();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
  };

  const fetchRides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carpools")
      .select(`
        *,
        driver:driver_id(full_name, phone, image_url),
        reservations:carpool_reservations(user_id, seats_reserved)
      `)
      .order("datetime", { ascending: true });

    if (error) {
      console.error("❌ Failed to fetch rides:", error.message);
    } else {
      setRides(data || []);
    }

    setLoading(false);
  };

  const handleSeatChange = (carpoolId, value) => {
    setReservationCounts(prev => ({
      ...prev,
      [carpoolId]: value
    }));
  };

  const reserveSeat = async (carpoolId, seatsRequested) => {
    if (!userId) {
      alert("Please login to reserve a seat.");
      navigate("/login");
      return;
    }

    const { error } = await supabase.from("carpool_reservations").insert([{
      carpool_id: carpoolId,
      user_id: userId,
      seats_reserved: seatsRequested
    }]);

    if (error) {
      if (error.message.includes("duplicate key")) {
        alert("You already reserved a seat.");
      } else {
        alert("❌ Reservation failed: " + error.message);
      }
    } else {
      alert("✅ Reservation successful!");
      fetchRides();
    }
  };

  const cancelReservation = async (carpoolId) => {
    if (!userId) return;
    const { error } = await supabase
      .from("carpool_reservations")
      .delete()
      .match({ carpool_id: carpoolId, user_id: userId });

    if (error) {
      alert("❌ Failed to cancel: " + error.message);
    } else {
      alert("🗑️ Reservation cancelled.");
      fetchRides();
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", fontFamily: "Segoe UI, sans-serif" }}>
      {/* LEFT NAV */}
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

        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Available Rides</h2>
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
          <p>Loading rides...</p>
        ) : rides.length === 0 ? (
          <p>No rides available right now.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {rides.map((ride) => {
              const reservedCount = ride.reservations?.reduce((sum, r) => sum + (r.seats_reserved || 1), 0);
              const seatsLeft = ride.available_seats - reservedCount;
              const selectedSeats = reservationCounts[ride.id] || 1;
              const hasReserved = ride.reservations?.some(r => r.user_id === userId);

              return (
                <div key={ride.id} style={{
                  background: "#fff",
                  padding: "1.5rem",
                  borderRadius: "16px",
                  boxShadow: "0 6px 12px rgba(0,0,0,0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1.5rem"
                }}>
                  <img
                    src={ride.driver?.image_url || defaultAvatar}
                    alt="Driver"
                    style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover" }}
                  />

                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: "0.25rem" }}>{ride.origin} → {ride.destination}</h3>
                    <p><strong>Seats:</strong> {ride.available_seats} | <strong>Left:</strong> {seatsLeft}</p>
                    <p><strong>Date/Time:</strong> {new Date(ride.datetime).toLocaleString()}</p>
                    {ride.price && <p><strong>Price:</strong> {ride.price} RWF</p>}
                    {ride.notes && <p><strong>Note:</strong> {ride.notes}</p>}
                    <p><strong>Driver:</strong> {ride.driver?.full_name || "Unknown"}</p>
                    <p><strong>Contact:</strong> {ride.driver?.phone || "N/A"}</p>

                    {hasReserved ? (
                      <button onClick={() => cancelReservation(ride.id)} style={{ ...reserveBtnStyle, background: "#ccc", color: "#333" }}>
                        Cancel Reservation
                      </button>
                    ) : seatsLeft > 0 ? (
                      <div style={{ marginTop: "0.5rem" }}>
                        <input
                          type="number"
                          min="1"
                          max={seatsLeft}
                          value={selectedSeats}
                          onChange={(e) => handleSeatChange(ride.id, parseInt(e.target.value))}
                          style={{ width: "60px", marginRight: "10px" }}
                        />
                        <button onClick={() => reserveSeat(ride.id, selectedSeats)} style={reserveBtnStyle}>
                          Reserve
                        </button>
                      </div>
                    ) : (
                      <p style={{ color: "red", fontWeight: "bold" }}>No seats left</p>
                    )}
                  </div>

                  {ride.car_image && (
                    <img
                      src={ride.car_image}
                      alt="Car"
                      style={{ width: "140px", height: "90px", objectFit: "cover", borderRadius: "10px" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
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

const reserveBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  border: "none",
  cursor: "pointer",
};

export default BrowseRides;
