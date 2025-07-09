import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { useNavigate } from "react-router-dom";
import "./CarpoolInbox.css";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";

function CarpoolInbox() {
  const [reservations, setReservations] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [profilePic, setProfilePic] = useState(defaultAvatar);
  const navigate = useNavigate();
  const lastScrollY = useRef(0);

  useEffect(() => {
    fetchReservations();
    loadProfilePicture();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current - 10 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileNavOpen]);

  const fetchReservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("carpool_reservations")
      .select(`
        *,
        carpools (
          origin,
          destination,
          datetime,
          price,
          car_image,
          driver_name
        )
      `)
      .eq("user_id", user.id)
      .order("reserved_at", { ascending: false });

    if (!error) {
      setReservations(data || []);
    }
  };

  const loadProfilePicture = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();

    if (!error && data?.image_url) {
      setProfilePic(data.image_url);
    }
  };

  return (
    <div className="carpool-inbox-container">
      {/* Mobile Top Bar */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img src={profilePic} alt="avatar" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={() => {
            setSlideDirection("slide-down");
            setMobileNavOpen(true);
          }} />
        </div>
        <div className="mobile-title">Inbox</div>
        <NotificationBell />
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileNavOpen && (
        <div className={`mobile-nav-overlay ${slideDirection ? `carpoolinbox-${slideDirection}` : ""}`}>
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/"); }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools"); }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool"); }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox"); }}>Carpool Inbox</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* Left Panel for Desktop */}
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
              {res.carpools?.car_image && (
                <img src={res.carpools.car_image} alt="car" style={{ width: "100%", borderRadius: "12px", marginBottom: "0.5rem" }} />
              )}
              <div><strong>From:</strong> {res.carpools?.origin}</div>
              <div><strong>To:</strong> {res.carpools?.destination}</div>
              <div><strong>Date:</strong> {new Date(res.carpools?.datetime).toLocaleString()}</div>
              <div><strong>Price:</strong> {res.carpools?.price} Frw</div>
              <div><strong>Driver:</strong> {res.carpools?.driver_name}</div>
              <div><strong>Seats Reserved:</strong> {res.seats_reserved}</div>
              <div><strong>Reserved at:</strong> {new Date(res.reserved_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CarpoolInbox;
