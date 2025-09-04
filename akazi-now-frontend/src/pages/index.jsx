import "./index.css";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import stickerJobs from "../assets/sticker1_transparent.png";
import stickerCar from "../assets/sticker_clean_2.png";
import stickerDriver from "../assets/sticker_clean_1.png";
import storeSticker from "../assets/store.png"; // <-- your Isoko sticker
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaCalendarCheck,
} from "react-icons/fa";

function Index() {
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
      {/* HERO SECTION */}
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
            Find gigs, share rides, or get a driver — all on AkaziNow.
          </p>
        </div>
      </div>

      {/* SEARCH SECTION */}
      <section className="public-search-section">
        <h2 className="public-search-title">🚗 Search Carpool</h2>

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
          <button className="search-button" onClick={() => navigate("/carpools")}>
            Search
          </button>
        </div>

        <div className="public-count">
          <FaCalendarCheck /> {gigCount} Gigs Available Now
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section className="services-section">
        <div className="service-card" style={{ background: "#fff8d4" }}>
          <div className="service-text">
            <h2>Find a Gig</h2>
            <p>Explore short jobs in tech, delivery, house help and more.</p>
            <button onClick={() => navigate("/gigs")}>Browse Gigs</button>
          </div>
          <img src={stickerJobs} alt="Gigs" />
        </div>

        <div className="service-card" style={{ background: "#e0f7ff" }}>
          <div className="service-text">
            <h2>Book a Ride</h2>
            <p>Find or share a ride quickly and affordably.</p>
            <button onClick={() => navigate("/carpools")}>Browse Rides</button>
          </div>
          <img src={stickerCar} alt="Carpool" />
        </div>

        <div className="service-card" style={{ background: "#f0e8ff" }}>
          <div className="service-text">
            <h2>Find a Driver</h2>
            <p>Connect with trusted Abasare to get home safe.</p>
            <button onClick={() => navigate("/abasare")}>View Drivers</button>
          </div>
        <img src={stickerDriver} alt="Abasare" />
        </div>

        {/* NEW: ISOKO CARD */}
        <div className="service-card" style={{ background: "#d1f7dfff" }}>
          <div className="service-text">
            <h2>Isoko Marketplace </h2>
            <p>Buy & sell locally — electronics, houses, cars, and more.</p>
            <button onClick={() => navigate("/isoko")}>Explore Isoko</button>
          </div>
          <img src={storeSticker} alt="Isoko" />
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

export default Index;
