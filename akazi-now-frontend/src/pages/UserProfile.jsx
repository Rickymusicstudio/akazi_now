import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerOffice from "../assets/login.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./UserProfile.css";

function UserProfile() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    district: "",
    sector: "",
    cell: "",
    village: "",
  });
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const touchStartY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY.current - touchEndY > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavVisible(false), 300);
      }
    };
    if (mobileNavVisible) {
      window.addEventListener("touchstart", handleTouchStart);
      window.addEventListener("touchmove", handleTouchMove);
    }
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavVisible]);

  const fetchProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return navigate("/login");
    const { data, error } = await supabase
      .from("users")
      .select("full_name, email, district, sector, cell, village, image_url")
      .eq("auth_user_id", user.id)
      .single();
    if (!error && data) {
      setForm(data);
      setUserProfile(data);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("users")
      .update(form)
      .eq("auth_user_id", user.id);
    if (!error) alert("✅ Profile updated!");
  };

  const handleHamburgerClick = () => {
    if (!mobileNavVisible) {
      setSlideDirection("slide-down");
      setMobileNavVisible(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    }
  };

  const handleNavClick = (path) => {
    setSlideDirection("slide-up");
    setTimeout(() => {
      setMobileNavVisible(false);
      navigate(path);
    }, 300);
  };

  return (
    <div>
      {/* MOBILE TOP NAV */}
      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="mobile-title">Profile</h2>
        <NotificationBell />
      </div>

      {mobileNavVisible && (
        <div className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => handleNavClick("/")}>Home</li>
            <li onClick={() => handleNavClick("/gigs")}>Gigs</li>
            <li onClick={() => handleNavClick("/post-job")}>Post a Job</li>
            <li onClick={() => handleNavClick("/my-jobs")}>My Jobs</li>
            <li onClick={() => handleNavClick("/profile")}>Profile</li>
            <li onClick={() => handleNavClick("/inbox")}>Inbox</li>
            <li onClick={() => handleNavClick("/carpools")}>Car Pooling</li>
            <li
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/index");
              }}
            >
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* HERO SECTION */}
      <div className="userprofile-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div>
          <h1>Welcome to Your Profile</h1>
          <p>Manage your personal information</p>
        </div>
      </div>

      {/* MAIN SECTION BELOW HERO */}
      <section className="userprofile-main">
        <div className="userprofile-form-container">
          <h2>Edit Profile</h2>
          <form className="userprofile-form" onSubmit={handleSubmit}>
            <label>Full Name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} />
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
            <label>District</label>
            <input name="district" value={form.district} onChange={handleChange} />
            <label>Sector</label>
            <input name="sector" value={form.sector} onChange={handleChange} />
            <label>Cell</label>
            <input name="cell" value={form.cell} onChange={handleChange} />
            <label>Village</label>
            <input name="village" value={form.village} onChange={handleChange} />
            <button type="submit">Save Changes</button>
          </form>
        </div>

        <div className="userprofile-sticker">
          <img src={stickerOffice} alt="illustration" />
        </div>
      </section>
    </div>
  );
}

export default UserProfile;
