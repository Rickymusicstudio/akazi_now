import "./Public.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { FaCalendarCheck, FaSearch, FaUser, FaLocationArrow } from "react-icons/fa";

function Public() {
  const navigate = useNavigate();
  const [gigCount, setGigCount] = useState(0);

  const [leavingFrom, setLeavingFrom] = useState("");
  const [goingTo, setGoingTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState(1);

  useEffect(() => {
    fetchGigCount();
  }, []);

  const fetchGigCount = async () => {
    const { data, error } = await supabase.from("jobs").select("id");
    if (!error && data) {
      setGigCount(data.length);
    }
  };

  const handleSearch = () => {
    alert(`Searching: ${leavingFrom} ➡️ ${goingTo} on ${date} for ${passengers} passenger(s)`);
    // 🔍 You can redirect to /carpools or filter on a public results page
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

          <div className="search-bar">
            <div className="search-item">
              <FaLocationArrow />
              <input
                placeholder="Leaving from"
                value={leavingFrom}
                onChange={(e) => setLeavingFrom(e.target.value)}
              />
            </div>
            <div className="search-item">
              <FaLocationArrow />
              <input
                placeholder="Going to"
                value={goingTo}
                onChange={(e) => setGoingTo(e.target.value)}
              />
            </div>
            <div className="search-item">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="search-item">
              <FaUser />
              <input
                type="number"
                min="1"
                value={passengers}
                onChange={(e) => setPassengers(e.target.value)}
              />
            </div>
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>

          <div className="public-count">
            <FaCalendarCheck /> {gigCount} Gigs Available Now
          </div>
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
    </div>
  );
}

export default Public;
