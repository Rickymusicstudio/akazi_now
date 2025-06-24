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
      .select(`*, driver:driver_id(full_name, phone, image_url), reservations:carpool_reservations(user_id, seats_reserved)`)
      .order("datetime", { ascending: true });

    if (!error) setRides(data || []);
    else console.error("❌ Failed to fetch rides:", error.message);

    setLoading(false);
  };

  const handleSeatChange = (carpoolId, value) => {
    setReservationCounts(prev => ({ ...prev, [carpoolId]: value }));
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
      alert(error.message.includes("duplicate key") ? "You already reserved a seat." : "❌ Reservation failed: " + error.message);
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
    } else alert("❌ Failed to cancel: " + error.message);
  };

  return (
    <>
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Browse Rides</h2>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Fullscreen Nav */}
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
        {/* ✅ Left Nav (Desktop) */}
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

        {/* ✅ Right Panel */}
        <div className="browse-right">
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
                  <div key={ride.id} className="ride-card">
                    <img src={ride.driver?.image_url || defaultAvatar} alt="Driver" className="ride-avatar" />
                    <div className="ride-details">
                      <h3>{ride.origin} → {ride.destination}</h3>
                      <p><strong>Seats:</strong> {ride.available_seats} | <strong>Left:</strong> {seatsLeft}</p>
                      <p><strong>Date/Time:</strong> {new Date(ride.datetime).toLocaleString()}</p>
                      {ride.price && <p><strong>Price:</strong> {ride.price} RWF</p>}
                      {ride.notes && <p><strong>Note:</strong> {ride.notes}</p>}
                      <p><strong>Driver:</strong> {ride.driver?.full_name || "Unknown"}</p>
                      <p><strong>Contact:</strong> {ride.driver?.phone || "N/A"}</p>

                      {hasReserved ? (
                        <button onClick={() => cancelReservation(ride.id)} className="btn cancel">Cancel Reservation</button>
                      ) : seatsLeft > 0 ? (
                        <div className="reservation-box">
                          <input type="number" min="1" max={seatsLeft} value={selectedSeats} onChange={(e) => handleSeatChange(ride.id, parseInt(e.target.value))} />
                          <button onClick={() => reserveSeat(ride.id, selectedSeats)} className="btn reserve">Reserve</button>
                        </div>
                      ) : (
                        <p className="no-seats">No seats left</p>
                      )}
                    </div>
                    {ride.car_image && <img src={ride.car_image} alt="Car" className="car-image" />}
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

export default BrowseRides;
