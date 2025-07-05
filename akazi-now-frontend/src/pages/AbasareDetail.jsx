import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import defaultAvatar from "../assets/avatar.png";
import { FaBars } from "react-icons/fa";
import "./AbasareDetail.css";

function AbasareDetail() {
  const { id } = useParams(); // user_id
  const navigate = useNavigate();
  const [driver, setDriver] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    fetchDriverDetails();
  }, [id]);

  const fetchDriverDetails = async () => {
    const { data, error } = await supabase
      .from("abasare")
      .select(`
        *,
        user:users!auth_user_id(full_name, image_url, phone)
      `)
      .eq("user_id", id)
      .single();

    if (error) {
      console.error("❌ Failed to load driver details:", error.message);
    } else {
      setDriver(data);
    }
  };

  if (!driver) return <p>Loading Umusare details...</p>;

  return (
    <>
      {/* ✅ Mobile Top Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Umusare Profile</h2>
        <NotificationBell />
      </div>

      {/* ✅ Mobile Navigation Overlay */}
      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare") }}>Abasare</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* ✅ 50/50 Layout */}
      <div className="browse-container">
        {/* Left Panel (gradient/nav) */}
        <div className="browse-left">
          <div className="nav-buttons">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/carpools")}>Browse Rides</button>
            <button onClick={() => navigate("/post-ride")}>Post Ride</button>
            <button onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</button>
            <button onClick={() => navigate("/abasare")}>Abasare</button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
          </div>
          <h2 style={{ fontSize: "28px", fontWeight: "bold", marginTop: "3rem" }}>Umusare Profile</h2>
          <NotificationBell />
        </div>

        {/* Right Panel (white/details) */}
        <div className="browse-right">
          <div className="abasare-card">
            <img
              src={driver.user?.image_url || defaultAvatar}
              alt="Umusare"
              className="abasare-detail-avatar"
            />
            <h2>{driver.user?.full_name || "Unnamed"}</h2>
            <p><strong>Phone:</strong> {driver.user?.phone || "N/A"}</p>
            <p><strong>Current Location:</strong> {driver.current_location}</p>
            <p><strong>Status:</strong> {driver.is_available ? "✅ Available" : "⛔ Not Available"}</p>
            <p><strong>Average Rating:</strong> {driver.average_rating ? `${driver.average_rating.toFixed(1)} / 5` : "Not yet rated"}</p>
          </div>
        </div>
      </div>
    </>
  );
}

export default AbasareDetail;
