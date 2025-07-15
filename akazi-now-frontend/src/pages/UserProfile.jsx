import { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerOffice from "../assets/office.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./UserProfile.css";

function UserProfile() {
  const [userProfile, setUserProfile] = useState({});
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    if (!error) setUserProfile(data || {});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("users")
      .update(userProfile)
      .eq("auth_user_id", user.id);

    if (!error) {
      alert("✅ Profile updated!");
    } else {
      alert("❌ Update failed");
    }
  };

  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!mobileNavOpen) return;
      const swipeDistance = touchStartY - e.touches[0].clientY;
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
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
            Logout
          </li>
        </ul>
      </div>

      {/* Hero */}
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
          <p className="hero-subtitle">
            Update your details to stay visible to gig posters and drivers.
          </p>
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

      {/* Profile Form Section */}
      <section className="services-section">
        <div className="service-card">
          <form className="postgig-form" onSubmit={handleUpdate}>
            <h2>Edit Profile</h2>
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={userProfile.full_name || ""}
              onChange={handleChange}
            />
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={userProfile.email || ""}
              onChange={handleChange}
            />
            <label>District</label>
            <input
              type="text"
              name="district"
              value={userProfile.district || ""}
              onChange={handleChange}
            />
            <label>Sector</label>
            <input
              type="text"
              name="sector"
              value={userProfile.sector || ""}
              onChange={handleChange}
            />
            <label>Cell</label>
            <input
              type="text"
              name="cell"
              value={userProfile.cell || ""}
              onChange={handleChange}
            />
            <label>Village</label>
            <input
              type="text"
              name="village"
              value={userProfile.village || ""}
              onChange={handleChange}
            />
            <button type="submit">Save Changes</button>
          </form>
        </div>

        <div className="service-card postgig-right-sticker">
          <div className="info-card-content">
            <h3>Your Info is Safe</h3>
            <p>Keep your contact details and location updated to match with gigs.</p>
            <img
              src={stickerOffice}
              alt="Profile Illustration"
              className="info-card-image enlarged-sticker"
            />
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

export default UserProfile;
