import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell";
import defaultAvatar from "../assets/avatar.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import { FaBars } from "react-icons/fa";
import "./Carpool.css";

function Carpool() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    available_seats: "",
    datetime: "",
    price: "",
    notes: "",
  });

  const [carImageFile, setCarImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [profilePic, setProfilePic] = useState(defaultAvatar);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const navigate = useNavigate();
  const touchStartYRef = useRef(0);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartYRef.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartYRef.current - touchEndY > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
    };
    if (mobileNavOpen) {
      window.addEventListener("touchstart", handleTouchStart);
      window.addEventListener("touchmove", handleTouchMove);
    }
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavOpen]);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("full_name, contact_info, image_url")
      .eq("auth_user_id", user.id)
      .single();

    if (!error && data) {
      setUserProfile(data);
      if (data.image_url) setProfilePic(data.image_url);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("❌ Please login first.");

    let carImageUrl = null;
    if (carImageFile) {
      const ext = carImageFile.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `carpool-images/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("carpool-images").upload(filePath, carImageFile);
      if (uploadError) return setMessage("❌ Failed to upload car image.");
      const { data } = supabase.storage.from("carpool-images").getPublicUrl(filePath);
      carImageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("carpools").insert([{
      user_id: user.id,
      driver_id: user.id,
      ...form,
      car_image: carImageUrl,
      contact_info: userProfile?.contact_info || null,
      driver_name: userProfile?.full_name || null,
    }]);

    if (error) {
      setMessage("❌ Failed to post carpool: " + error.message);
    } else {
      setMessage("✅ Carpool offer posted!");
      setForm({ origin: "", destination: "", available_seats: "", datetime: "", price: "", notes: "" });
      setCarImageFile(null);
    }
  };

  return (
    <div className="carpool-container">
      {/* Top Nav */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img src={profilePic} alt="Profile" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={() => {
            setSlideDirection("slide-down");
            setMobileNavOpen(true);
          }} />
        </div>
        <h2 className="mobile-title">Post Ride</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/"); }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpools"); }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool"); }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox"); }}>Carpool Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare"); }}>Abasare</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* Hero Section */}
      <div className="carpool-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="carpool-hero-content">
          <h1 className="carpool-heading">Post Carpool Ride</h1>
          <p className="carpool-subheading">Share your available seats and earn money while helping others.</p>
        </div>
      </div>

      {/* Center Card Form Section */}
      <section className="carpool-cards-section">
        <div className="carpool-card">
          {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}
          <form onSubmit={handleSubmit}>
            <label>Origin</label>
            <input type="text" name="origin" value={form.origin} onChange={handleChange} required />

            <label>Destination</label>
            <input type="text" name="destination" value={form.destination} onChange={handleChange} required />

            <label>Available Seats</label>
            <input type="number" name="available_seats" value={form.available_seats} onChange={handleChange} required />

            <label>Date and Time</label>
            <input type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} required />

            <label>Price (Frw)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} />

            <label>Note (Optional)</label>
            <textarea name="notes" rows="3" value={form.notes} onChange={handleChange} />

            <label>Car Image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setCarImageFile(e.target.files[0])} />

            <button type="submit">Post Ride</button>
          </form>
        </div>
      </section>
    </div>
  );
}

export default Carpool;
