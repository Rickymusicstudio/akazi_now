import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerOffice from "../assets/profile.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./UserProfile.css";

function UserProfile() {
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    setUserProfile(data);
    setEditForm(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update(editForm)
      .eq("auth_user_id", user.id);
    fetchUserProfile();
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
      <div className="postgig-desktop-nav">
        <div className="postgig-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
        </ul>
      </div>

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
          <h2 className="mobile-title">My Profile</h2>
          <NotificationBell />
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Manage Your Profile</h1>
          <p className="hero-subtitle">Update your personal and location info</p>
        </div>

        {mobileNavOpen && (
          <div
            ref={mobileNavRef}
            className={`mobile-nav-overlay ${slideDirection}`}
          >
            <ul>
              <li onClick={() => closeAndNavigate("/")}>Home</li>
              <li onClick={() => closeAndNavigate("/gigs")}>Gigs</li>
              <li onClick={() => closeAndNavigate("/post-job")}>Post a Job</li>
              <li onClick={() => closeAndNavigate("/my-jobs")}>My Jobs</li>
              <li onClick={() => closeAndNavigate("/profile")}>Profile</li>
              <li onClick={() => closeAndNavigate("/inbox")}>Inbox</li>
              <li onClick={() => closeAndNavigate("/carpools")}>Car Pooling</li>
              <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
            </ul>
          </div>
        )}
      </div>

      <section className="services-section">
        <div className="service-card" style={{ background: "#fff8d4" }}>
          <form className="postgig-form">
            <h2>Edit Profile</h2>
            <label>Full Name</label>
            <input name="full_name" value={editForm.full_name} onChange={handleInputChange} />
            <label>Phone</label>
            <input name="phone" value={editForm.phone} onChange={handleInputChange} />
            <label>District</label>
            <input name="district" value={editForm.district} onChange={handleInputChange} />
            <label>Sector</label>
            <input name="sector" value={editForm.sector} onChange={handleInputChange} />
            <label>Cell</label>
            <input name="cell" value={editForm.cell} onChange={handleInputChange} />
            <label>Village</label>
            <input name="village" value={editForm.village} onChange={handleInputChange} />
            <button type="button" onClick={handleSave}>Save Changes</button>
          </form>
        </div>

        <div className="service-card postgig-right-sticker" style={{ background: "#fff3e6" }}>
          <div className="info-card-content">
            <h3>Keep Your Info Updated</h3>
            <p>Your profile helps job posters and seekers trust and connect with you.</p>
            <img src={stickerOffice} alt="Profile Sticker" className="info-card-image enlarged-sticker" />
          </div>
        </div>
      </section>

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

export default UserProfile;
