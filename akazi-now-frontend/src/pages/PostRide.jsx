import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerRide from "../assets/ride.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./PostGig.css";

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
    const { data } = await supabase.from("users").select("image_url").eq("auth_user_id", user.id).single();
    setUserProfile(data);
  };

  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      if (!mobileNavOpen) return;
      const swipeDistance = touchStartY - e.touches[0].clientY;
      if (swipeDistance > 50) closeMobileNav();
    };
    const handleScroll = () => { if (mobileNavOpen) closeMobileNav(); };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [mobileNavOpen]);

  const closeMobileNav = () => {
    setSlideDirection("slide-up");
    setTimeout(() => {
      setMobileNavOpen(false);
      setSlideDirection("");
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => { setImageFile(e.target.files[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setMessage("❌ Not authenticated");

    let imageUrl = null;
    if (imageFile) {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage.from("car-images").upload(fileName, imageFile, { cacheControl: "3600", upsert: true });
      if (uploadError) return setMessage("❌ Upload failed: " + uploadError.message);
      const { data } = supabase.storage.from("car-images").getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }

    const { error } = await supabase.from("carpools").insert([{ ...form, user_id: user.id, car_image: imageUrl }]);
    if (error) return setMessage("❌ Failed: " + error.message);
    setMessage("✅ Ride posted!");
    setForm({ origin: "", destination: "", available_seats: "", datetime: "", price: "", notes: "" });
    setImageFile(null);
  };

  const handleMenuToggle = () => {
    if (!mobileNavOpen) {
      setSlideDirection("slide-down");
      setMobileNavOpen(true);
    } else closeMobileNav();
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
    <div className="postgig-container">
      <div className="postgig-desktop-nav">
        <div className="postgig-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/carpools")}>Browse Rides</li>
          <li onClick={() => navigate("/post-ride")}>Post Ride</li>
          <li onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</li>
          <li onClick={() => navigate("/abasare")}>Abasare</li>
          <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
        </ul>
      </div>

      <div className="postgig-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="postgig-mobile-topbar">
          <div className="postgig-mobile-left">
            <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="postgig-mobile-avatar" />
            <FaBars className="postgig-mobile-hamburger" onClick={handleMenuToggle} />
          </div>
          <div className="postgig-mobile-title">Post Ride</div>
          <NotificationBell />
        </div>
        <div className="postgig-hero-content">
          <h1 className="postgig-hero-title">Post your Ride</h1>
          <p className="postgig-hero-subtitle">Help others reach their destination while reducing travel cost.</p>
        </div>
        {mobileNavOpen && (
          <div ref={mobileNavRef} className={`postgig-mobile-nav-overlay ${slideDirection}`}>
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

      <section className="postgig-services-section">
        <div className="postgig-form-card">
          <form className="postgig-form" onSubmit={handleSubmit}>
            <h2>Post a Ride</h2>
            {message && <p style={{ color: message.startsWith("✅") ? "green" : "red" }}>{message}</p>}
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

        <div className="postgig-sticker-card">
          <div className="postgig-info-card-content">
            <h3>Post Your Ride</h3>
            <p>Connect with riders and save fuel. Let your empty seats help others travel.</p>
            <img src={stickerRide} alt="Ride Sticker" className="postgig-info-card-image" />
          </div>
        </div>
      </section>

      <footer className="postgig-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="postgig-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default PostRide;
