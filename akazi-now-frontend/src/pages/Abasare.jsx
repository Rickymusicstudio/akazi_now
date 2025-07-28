// ✅ unchanged imports
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaSearch } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerRide from "../assets/ride.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./Abasare.css";

// ✅ function start unchanged
function Abasare() {
  const [form, setForm] = useState({ current_location: "", is_available: true });
  const [userId, setUserId] = useState(null);
  const [abasareList, setAbasareList] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTable, setShowTable] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  // ✅ other logic unchanged...

  return (
    <div className="abasare-container">
      {/* ✅ DESKTOP NAV - PROFILE removed */}
      <div className="abasare-desktop-nav">
        <div className="abasare-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/carpools")}>Browse Rides</li>
          <li onClick={() => navigate("/post-ride")}>Post Ride</li>
          <li onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</li>
          <li onClick={() => navigate("/abasare")}>Abasare</li>
          <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
        </ul>
      </div>

      {/* ✅ HERO SECTION */}
      <div className="abasare-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="abasare-mobile-topbar">
          <div className="abasare-mobile-left">
            <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="abasare-mobile-avatar" />
            <FaBars className="abasare-mobile-hamburger" onClick={handleMenuToggle} />
          </div>
          <div className="abasare-mobile-title">Abasare</div>
          <NotificationBell />
        </div>
        <div className="abasare-hero-content">
          <h1 className="abasare-hero-title">Umusare Registration</h1>
          <p className="abasare-hero-subtitle">Become a driver and help others get home safely.</p>
        </div>

        {/* ✅ MOBILE NAV OVERLAY - PROFILE removed */}
        {mobileNavOpen && (
          <div ref={mobileNavRef} className={`abasare-mobile-nav-overlay ${slideDirection}`}>
            <ul>
              <li onClick={() => closeAndNavigate("/")}>Home</li>
              <li onClick={() => closeAndNavigate("/carpools")}>Browse Rides</li>
              <li onClick={() => closeAndNavigate("/post-ride")}>Post Ride</li>
              <li onClick={() => closeAndNavigate("/carpool-inbox")}>Carpool Inbox</li>
              <li onClick={() => closeAndNavigate("/abasare")}>Abasare</li>
              <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
            </ul>
          </div>
        )}
      </div>

      {/* ✅ rest of file unchanged */}
      {/* Table section */}
      {/* Form + sticker section */}
      {/* Footer */}
    </div>
  );
}

export default Abasare;
