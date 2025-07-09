// src/pages/Public.jsx
import "./Public.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaCalendarCheck } from "react-icons/fa";

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

      {/* 🔍 SEARCH BAR MOVED HERE */}
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
    </div>
  );
}

export default Public;
