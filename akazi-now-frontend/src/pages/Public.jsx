import "./Public.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaCalendarCheck,
} from "react-icons/fa";
import sticker3 from "../assets/sticker1_transparent.png";
import carpoolSticker from "../assets/sticker_clean_1.png"; // Replace with your carpool image

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
      <div
        className="public-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="public-topbar">
          <div className="public-logo">AN</div>
          <div className="public-auth-buttons">
            <button onClick={() => navigate("/login")}>Sign In</button>
            <button onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>

        <div className="public-hero-content">
          <h1 className="public-heading">Welcome to AkaziNow</h1>
          <p className="public-subheading">Your Smart Gig Finder in Rwanda</p>
        </div>
      </div>

      <section className="public-features">
        <div className="feature-card">
          <h3>✔️ Post Gigs Easily</h3>
          <p>Get hiring done fast with our platform</p>
        </div>
        <div className="feature-card">
          <h3>✔️ Apply Instantly</h3>
          <p>Find and apply to gigs with one click</p>
        </div>
        <div className="feature-card">
          <h3>✔️ Trusted by Thousands</h3>
          <p>Join a large community of gig workers</p>
        </div>
      </section>

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

      {/* ✅ JOBS PROMO PANEL */}
      <section className="abasare-panel">
        <div className="abasare-panel-content">
          <div className="abasare-panel-text">
            <h2>Find Jobs or Post Work Easily</h2>
            <p>
              Whether you're looking for quick gigs or want to hire someone fast,
              AkaziNow makes it simple. Post jobs and find qualified workers in your area —
              trusted by thousands of Rwandans.
            </p>
            <button onClick={() => navigate("/gigs")}>Explore Gigs</button>
          </div>
          <div className="abasare-panel-image">
            <img src={sticker3} alt="Job Offer Illustration" />
          </div>
        </div>
      </section>

      {/* ✅ CARPOOL / ABASARE PANEL */}
      <section className="abasare-panel" style={{ background: "#f5f7fa" }}>
        <div className="abasare-panel-content">
          <div className="abasare-panel-text">
            <h2>Need a Ride? Discover Trusted Carpool Drivers</h2>
            <p>
              Our verified Abasare drivers are here to help you get home safely.
              Book or offer rides anytime — ideal for late nights, weekends, or events.
            </p>
            <button onClick={() => navigate("/abasare")}>Meet Abasare</button>
          </div>
          <div className="abasare-panel-image">
            <img src={carpoolSticker} alt="Carpool Illustration" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default Public;
