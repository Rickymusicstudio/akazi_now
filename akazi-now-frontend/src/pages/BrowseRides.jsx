import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell";
import { FaBars } from "react-icons/fa";
import "./BrowseRides.css";

function BrowseRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservationCounts, setReservationCounts] = useState({});
  const [userId, setUserId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
        driver:user_id(full_name, phone, image_url),
        reservations:carpool_reservations(user_id, seats_reserved)
      `)
      .order("datetime", { ascending: true });

    if (!error) {
      setRides(data || []);
    }
    setLoading(false);
  };

  const handleSeatChange = (carpoolId, value, maxSeats) => {
    const safeValue = Math.min(maxSeats, Math.max(1, value || 1));
    setReservationCounts(prev => ({
      ...prev,
      [carpoolId]: safeValue
    }));
  };

  const reserveSeat = async (ride, seatsRequested) => {
    const carpoolId = ride.id;
    const reservedCount = Array.isArray(ride.reservations)
      ? ride.reservations.reduce((sum, r) => sum + (r.seats_reserved ?? 0), 0)
      : 0;
    const seatsLeft = ride.available_seats - reservedCount;

    if (!userId) {
      alert("Please login to reserve a seat.");
      navigate("/login");
      return;
    }

    if (ride.reservations?.some(r => r.user_id === userId)) {
      alert("⚠️ You already reserved a seat.");
      return;
    }

    if (seatsRequested > seatsLeft) {
      alert("❌ Not enough seats left.");
      return;
    }

    const { error } = await supabase.from("carpool_reservations").insert([{
      carpool_id: carpoolId,
      user_id: userId,
      seats_reserved: seatsRequested
    }]);

    if (error) {
      alert("❌ Reservation failed: " + error.message);
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

    if (!error) {
      alert("🗑️ Reservation cancelled.");
      fetchRides();
    } else {
      alert("❌ Failed to cancel: " + error.message);
    }
  };

  return (
    <>
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Browse Rides</h2>
        <NotificationBell />
      </div>

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

      <div className="browse-container">
        <div className="browse-left">
          <div className="nav-buttons">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/carpools")}>Browse Rides</button>
            <button onClick={() => navigate("/post-ride")}>Post Ride</button>
            <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Available Rides</h2>
          <NotificationBell />
        </div>

        <div className="browse-right">
          {loading ? (
            <p>Loading rides...</p>
          ) : rides.length === 0 ? (
            <p>No rides available right now.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {rides.map((ride) => {
                const reservedCount = Array.isArray(ride.reservations)
                  ? ride.reservations.reduce((sum, r) => sum + (r.seats_reserved ?? 0), 0)
                  : 0;
                const seatsLeft = Math.max(0, ride.available_seats - reservedCount);
                const selectedSeats = reservationCounts[ride.id] || 1;
                const hasReserved = ride.reservations?.some(r => r.user_id === userId);

                return (
                  <div key={ride.id} className="ride-card">
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
                            onChange={(e) => handleSeatChange(ride.id, parseInt(e.target.value), seatsLeft)}
                            style={{ width: "60px", marginRight: "10px" }}
                          />
                          <button onClick={() => reserveSeat(ride, selectedSeats)} style={reserveBtnStyle}>
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
    </>
  );
}

const reserveBtnStyle = {
  padding: "8px 16px",
  borderRadius: "8px",
  background: "linear-gradient(to right, #6a00ff, #ff007a)",
  color: "white",
  border: "none",
  cursor: "pointer",
};

export default BrowseRides;
