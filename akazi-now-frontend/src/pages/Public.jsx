// src/pages/Public.jsx
import "./Public.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_clean.png";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaCalendarCheck } from "react-icons/fa";

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
      <div className="public-topbar">
        <div className="public-logo">AN</div>
      </div>

      <div className="public-auth-buttons">
        <button onClick={() => navigate("/login")}>Sign In</button>
        <button onClick={() => navigate("/signup")}>Sign Up</button>
      </div>

      <h1 className="public-heading">Welcome to AkaziNow</h1>
      <p className="public-subheading">Your Smart Gig Finder in Rwanda</p>

      <input className="public-search" placeholder="Search for gigs…" />
      <div className="public-count">
        <FaCalendarCheck /> {gigCount} Gigs Available Now
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
    </div>
  );
}

export default Public;
