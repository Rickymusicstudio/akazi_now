import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
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

    const { data, error } = await supabase
      .from("reservations")
      .select(`
        *,
        users(full_name, contact_info),
        carpools(origin, destination, datetime, price, notes)
      `)
      .eq("carpools.user_id", user.id)
      .order("reserved_at", { ascending: false });

    if (error) {
      console.error("❌ Failed to fetch reservations:", error.message);
    } else {
      setReservations(data);
    }
  };

  return (
    <div className="carpool-inbox-container">
      {/* ✅ Mobile Top Nav */}
      <div className="mobile-top-bar">
        <div className="mobile-hamburger" onClick={() => setMobileNavOpen(true)}>
          <FaBars />
        </div>
        <h2 className="mobile-title">Inbox</h2>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Fullscreen Dropdown Nav */}
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

      {/* ✅ Left Panel (Desktop Nav) */}
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

      {/* ✅ Right Panel (Inbox List) */}
      <div className="carpool-inbox-right">
        {reservations.length === 0 ? (
          <p>No reservations yet.</p>
        ) : (
          reservations.map((res) => (
            <div key={res.id} className="inbox-card">
              <div><strong>Name:</strong> {res.users?.full_name || "N/A"}</div>
              <div><strong>Contact:</strong> {res.users?.contact_info || "N/A"}</div>
              <div><strong>From:</strong> {res.carpools?.origin}</div>
              <div><strong>To:</strong> {res.carpools?.destination}</div>
              <div><strong>Date/Time:</strong> {new Date(res.carpools?.datetime).toLocaleString()}</div>
              <div><strong>Price:</strong> {res.carpools?.price} RWF</div>
              <div><strong>Note:</strong> {res.carpools?.notes}</div>
              <div><strong>Seats Reserved:</strong> {res.seats_reserved}</div>
              <div><strong>Reserved At:</strong> {new Date(res.reserved_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CarpoolInbox;
