import "./Public.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_clean.png"; // Replace with your actual path
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

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
    <div className="public-homepage">
      <header
        className="hero-banner"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="top-nav">
          <div className="logo">AN</div>
          <div className="auth-buttons">
            <button className="sign-in" onClick={() => navigate("/login")}>Sign In</button>
            <button className="sign-up" onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>

        <h1>Welcome to AkaziNow</h1>
        <p>Your Smart Gig Finder in Rwanda</p>
        <input className="search-bar" placeholder="🔍 Search for gigs..." />
        <p className="gig-count">📅 {gigCount} Gigs Available Now</p>
      </header>

      <section className="features">
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