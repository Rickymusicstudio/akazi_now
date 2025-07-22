import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import defaultAvatar from "../assets/avatar.png";
import stickerRide from "../assets/ride.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import { FaBars } from "react-icons/fa";
import "./PostRide.css";

function PostRide() {
  const [form, setForm] = useState({
    origin: "",
    destination: "",
    available_seats: "",
    datetime: "",
    price: "",
    notes: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [message, setMessage] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();

    setUserProfile(data);
  };

  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!mobileNavOpen) return;
      const touchEndY = e.touches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;
      if (swipeDistance > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => {
          setMobileNavOpen(false);
          setSlideDirection("");
        }, 300);
      }
    };

    const handleScroll = () => {
      if (!mobileNavOpen) return;
      setSlideDirection("slide-up");
      setTimeout(() => {
        setMobileNavOpen(false);
        setSlideDirection("");
      }, 300);
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mobileNavOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMessage("❌ Not authenticated");
      return;
    }

    let imageUrl = null;
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("car-images")
        .upload(fileName, imageFile, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        setMessage("❌ Image upload failed: " + uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("car-images").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("carpools").insert([{
      ...form,
      user_id: user.id,
      car_image: imageUrl
    }]);

    if (error) {
      setMessage("❌ Failed to post ride: " + error.message);
    } else {
      setMessage("✅ Ride posted!");
      setForm({
        origin: "",
        destination: "",
        available_seats: "",
        datetime: "",
        price: "",
        notes: "",
      });
      setImageFile(null);
    }
  };

  const handleMenuToggle = () => {
    if (!mobileNavOpen) {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => {
        setMobileNavOpen(false);
        setSlideDirection("");
      }, 300);
    }
  };

  const closeAndNavigate = async (path, logout = false) => {
    setSlideDirection("slide-up");
    setTimeout(async () => {
      setMobileNavOpen(false);
      setSlideDirection("");
      if (logout) await supabase.auth.signOut();
      navigate(path);
    }, 300);
  };

  return (
    <div className="public-container">
      {/* Desktop Nav */}
      <div className="postgig-desktop-nav">
        <div className="postgig-nav-left-logo" onClick={() => navigate("/")}>
          AkaziNow
        </div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/carpools")}>Browse Rides</li>
          <li onClick={() => navigate("/post-ride")}>Post Ride</li>
          <li onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/abasare")}>Abasare</li>
          <li onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
            Logout
          </li>
        </ul>
      </div>

      {/* Hero Section */}
      <div className="public-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="mobile-top-bar">
          <div className="mobile-left-group">
            <img
              src={userProfile?.image_url || defaultAvatar}
              alt="avatar"
              className="mobile-profile-pic"
            />
            <FaBars className="mobile-hamburger" onClick={handleMenuToggle} />
          </div>
          <h2 className="mobile-title">Post Ride</h2>
          <NotificationBell />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Share Your Ride</h1>
          <p className="hero-subtitle">Post a carpool and help others reach their destination</p>
        </div>

        {mobileNavOpen && (
          <div
            ref={mobileNavRef}
            className={`mobile-nav-overlay ${slideDirection}`}
          >
            <ul>
              <li onClick={() => closeAndNavigate("/")}>Home</li>
              <li onClick={() => closeAndNavigate("/carpools")}>Browse Rides</li>
              <li onClick={() => closeAndNavigate("/post-ride")}>Post Ride</li>
              <li onClick={() => closeAndNavigate("/carpool-inbox")}>Carpool Inbox</li>
              <li onClick={() => closeAndNavigate("/profile")}>Profile</li>
              <li onClick={() => closeAndNavigate("/abasare")}>Abasare</li>
              <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
            </ul>
          </div>
        )}
      </div>

      {/* Main Section */}
      <section className="services-section">
        <div className="service-card" style={{ background: "#fff8d4" }}>
          <form className="postgig-form" onSubmit={handleSubmit}>
            <h2>Post a Ride</h2>
            {message && (
              <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>
            )}
            <label>Origin</label>
            <input type="text" name="origin" value={form.origin} onChange={handleChange} required />
            <label>Destination</label>
            <input type="text" name="destination" value={form.destination} onChange={handleChange} required />
            <label>Available Seats</label>
            <input type="number" name="available_seats" value={form.available_seats} onChange={handleChange} required />
            <label>Date & Time</label>
            <input type="datetime-local" name="datetime" value={form.datetime} onChange={handleChange} required />
            <label>Price (Frw)</label>
            <input type="number" name="price" value={form.price} onChange={handleChange} />
            <label>Extra Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} />
            <label>Upload Car Picture</label>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <button type="submit">Post Ride</button>
          </form>
        </div>

        <div className="service-card postgig-right-sticker" style={{ background: "#e6f7ff" }}>
          <div className="info-card-content">
            <h3>Share Your Ride</h3>
            <p>Help others reach their destination while reducing travel cost. It's easy!</p>
            <img src={stickerRide} alt="Ride Illustration" className="info-card-image enlarged-sticker" />
          </div>
        </div>
      </section>

      {/* Footer */}
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

export default PostRide;
