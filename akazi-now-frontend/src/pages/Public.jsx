// FULL UPDATED Public.jsx
import "./Public.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import stickerJobs from "../assets/sticker1_transparent.png";
import stickerCar from "../assets/sticker3_transparent.png";
import stickerDriver from "../assets/sticker_driver.png";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaCalendarCheck,
} from "react-icons/fa";

function Public() {
  const navigate = useNavigate();
  const [gigCount, setGigCount] = useState(0);

  useEffect(() => {
    fetchGigCount();
  }, []);

  const fetchGigCount = async () => {
    const { data, error } = await supabase.from("jobs").select("id");
    if (!error && data) {
      setGigCount(data.length);
    }
  };

  return (
    <div className="public-container">
      {/* HERO */}
      <div
        className="public-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="public-topbar">
          <div className="public-logo">AkaziNow</div>
          <div className="public-auth-buttons">
            <button onClick={() => navigate("/login")}>Sign In</button>
            <button onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>

        <div className="public-hero-content">
          <h1 className="public-heading">Smart Work. Smart Travel. Anytime.</h1>
          <p className="public-subheading">
            Find quick jobs, share rides, or get a trusted driver — all in one place.
          </p>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <section className="public-search-section">
        <div className="public-search-bar">
          <div className="search-field">
            <FaMapMarkerAlt className="icon" />
            <input type="text" placeholder="Leaving from" />
          </div>
          <div className="search-field">
            <FaMapMarkerAlt className="icon" />
            <input type="text" placeholder="Going to" />
          </div>
          <div className="search-field">
            <FaCalendarAlt className="icon" />
            <input type="date" />
          </div>
          <div className="search-field">
            <FaUser className="icon" />
            <input type="number" placeholder="1" min="1" />
          </div>
          <button className="search-button">Search</button>
        </div>

        <div className="public-count">
          <FaCalendarCheck /> {gigCount} Gigs Available Now
        </div>
      </section>

      {/* SERVICE PANELS */}
      <section className="services-section">
        {/* GIGS */}
        <div className="service-card" style={{ background: "#fff8d4" }}>
          <div className="service-text">
            <h2>Find a Gig</h2>
            <p>
              Explore short-term jobs in delivery, tech, domestic help and more.
            </p>
            <button onClick={() => navigate("/public")}>Browse Gigs</button>
          </div>
          <img src={stickerJobs} alt="Gigs" />
        </div>

        {/* CARPOOL */}
        <div className="service-card" style={{ background: "#e0f7ff" }}>
          <div className="service-text">
            <h2>Book a Ride</h2>
            <p>Going somewhere? Share or book a ride easily and affordably.</p>
            <button onClick={() => navigate("/public-rides")}>Browse Rides</button>
          </div>
          <img src={stickerCar} alt="Carpool" />
        </div>

        {/* ABASARE */}
        <div className="service-card" style={{ background: "#f0e8ff" }}>
          <div className="service-text">
            <h2>Find a Driver</h2>
            <p>Get home safe. Browse available Abasare near you.</p>
            <button onClick={() => navigate("/public-abasare")}>View Drivers</button>
          </div>
          <img src={stickerDriver} alt="Abasare" />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="public-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default Public;
