import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import "./Abasare.css";

function Abasare() {
  const [drivers, setDrivers] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from("abasare")
      .select(`
        id,
        is_available,
        location,
        updated_at,
        users ( full_name, phone, image_url )
      `)
      .order("updated_at", { ascending: false });

    if (!error) {
      setDrivers(data || []);
    } else {
      console.error("❌ Failed to load drivers:", error.message);
    }
  };

  return (
    <>
      {/* ✅ Mobile Nav Bar */}
      <div className="mobile-top-bar">
        <FaBars className="mobile-hamburger" onClick={() => setMobileNavOpen(true)} />
        <h2 className="mobile-title">Abasare</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className="mobile-nav-overlay">
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/") }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare") }}>Abasare</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools") }}>Rides</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      <div className="abasare-container">
        <div className="abasare-left">
          <div className="nav-buttons">
            <button onClick={() => navigate("/")}>Home</button>
            <button onClick={() => navigate("/abasare")}>Abasare</button>
            <button onClick={() => navigate("/carpools")}>Rides</button>
            <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
          </div>
          <h2 style={{ marginTop: "4rem" }}>Available Drivers</h2>
          <NotificationBell />
        </div>

        <div className="abasare-right">
          {drivers.length === 0 ? (
            <p>No drivers listed yet.</p>
          ) : (
            drivers.map((driver) => (
              <div className="abasare-card" key={driver.id}>
                <img
                  src={driver.users?.image_url || defaultAvatar}
                  alt="Driver"
                  className="avatar"
                />
                <div><strong>Name:</strong> {driver.users?.full_name || "Unknown"}</div>
                <div><strong>Phone:</strong> {driver.users?.phone || "N/A"}</div>
                <div><strong>Location:</strong> {driver.location}</div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span style={{ color: driver.is_available ? "green" : "red", fontWeight: "bold" }}>
                    {driver.is_available ? "✅ Available" : "❌ Not Available"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default Abasare;
