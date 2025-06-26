import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import "./CarpoolInbox.css";

function CarpoolInbox() {
  const [reservations, setReservations] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return;

    // Fetch all reservations
    const { data: reservationsData, error: resError } = await supabase
      .from("reservations")
      .select("*")
      .order("reserved_at", { ascending: false });

    if (resError) {
      console.error("❌ Failed to fetch reservations:", resError.message);
      return;
    }

    // Fetch current user's carpools
    const { data: carpoolsData, error: carpoolError } = await supabase
      .from("carpools")
      .select("id, origin, destination, datetime, price, notes, driver_name, contact_info")
      .eq("user_id", user.id);

    if (carpoolError) {
      console.error("❌ Failed to fetch carpools:", carpoolError.message);
      return;
    }

    // Match reservations with your carpools
    const carpoolIds = carpoolsData.map(c => c.id);
    const myReservations = reservationsData
      .filter(res => carpoolIds.includes(res.carpool_id))
      .map(res => {
        const carpool = carpoolsData.find(c => c.id === res.carpool_id);
        return {
          ...res,
          carpool
        };
      });

    setReservations(myReservations);
  };

  return (
    <div className="carpool-inbox-container">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-hamburger" onClick={() => setMobileNavOpen(true)}>☰</div>
        <h2 className="mobile-title">Inbox</h2>
        <NotificationBell />
      </div>

      {/* Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool") }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox") }}>Carpool Inbox</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* Desktop Left Navigation */}
      <div className="carpool-inbox-left">
        <div className="nav-buttons">
          <button onClick={() => navigate("/")}>Home</button>
          <button onClick={() => navigate("/carpools")}>Browse Rides</button>
          <button onClick={() => navigate("/carpool")}>Post Ride</button>
          <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Inbox</h2>
        <NotificationBell />
      </div>

      {/* Right Panel */}
      <div className="carpool-inbox-right">
        {reservations.length === 0 ? (
          <p>No reservations yet.</p>
        ) : (
          reservations.map((res) => (
            <div key={res.id} className="inbox-card">
              <div><strong>Origin:</strong> {res.carpool?.origin}</div>
              <div><strong>Destination:</strong> {res.carpool?.destination}</div>
              <div><strong>Date/Time:</strong> {new Date(res.carpool?.datetime).toLocaleString()}</div>
              <div><strong>Price:</strong> {res.carpool?.price} RWF</div>
              <div><strong>Notes:</strong> {res.carpool?.notes}</div>
              <div><strong>Reserved At:</strong> {new Date(res.reserved_at).toLocaleString()}</div>
              <div><strong>Seats Reserved:</strong> {res.seats_reserved}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CarpoolInbox;
