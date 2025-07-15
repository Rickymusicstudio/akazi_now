import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Gigs.css";

function Gigs() {
  const [jobs, setJobs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!mobileNavVisible) return;
      const touchEndY = e.touches[0].clientY;
      const swipeDistance = touchStartY - touchEndY;

      if (swipeDistance > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => {
          setMobileNavVisible(false);
          setSlideDirection("");
        }, 300);
      }
    };

    const handleScroll = () => {
      if (!mobileNavVisible) return;
      setSlideDirection("slide-up");
      setTimeout(() => {
        setMobileNavVisible(false);
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
  }, [mobileNavVisible]);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*");
    if (!error) setJobs(data);
  };

  const fetchUserProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data);
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

  return (
    <div className="public-container">
      {/* TOP NAV (mobile) */}
      <div
        className="mobile-top-bar"
        style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}
      >
        <div className="mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="mobile-profile-pic"
          />
          <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="mobile-title">Gigs</h2>
        <NotificationBell />
      </div>

      {/* NAV OVERLAY (mobile) */}
      {mobileNavVisible && (
        <div
          ref={mobileNavRef}
          className={`mobile-nav-overlay ${slideDirection}`}
          style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}
        >
          <ul>
            <li onClick={() => { setMobileNavVisible(false); navigate("/"); }}>Home</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/gigs"); }}>Gigs</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/post-job"); }}>Post a Job</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/my-jobs"); }}>My Jobs</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/profile"); }}>Profile</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/inbox"); }}>Inbox</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/carpools"); }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* DESKTOP NAVIGATION */}
      <div className="desktop-nav">
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>Logout</li>
        </ul>
      </div>

      {/* HERO */}
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
          <h1 className="public-heading">Explore Gigs. Earn Fast. Start Today.</h1>
          <p className="public-subheading">
            Discover flexible jobs available in your area now.
          </p>
        </div>
      </div>

      {/* GIG COUNT */}
      <section className="public-search-section">
        <h2 className="public-search-title">💼 Gigs Available</h2>
        <div className="public-count">
          <FaCalendarCheck /> {jobs.length} Gigs Posted
        </div>
      </section>

      {/* JOB CARDS */}
      <section className="services-section">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div className="service-card" key={job.id} style={{ background: "#fff8d4" }}>
              <div className="service-text">
                <h2>{job.title}</h2>
                <p>{job.job_description}</p>
                <p><strong>Price:</strong> {job.price} RWF</p>
                <p><strong>Location:</strong> {job.address}</p>
                <p><strong>Contact:</strong> {job.contact_info}</p>
                <button onClick={() => navigate(`/jobs/${job.id}`)}>View Details</button>
              </div>
              {job.poster_image && (
                <img src={job.poster_image} alt="gig" />
              )}
            </div>
          ))
        ) : (
          <p style={{ marginTop: "2rem", fontWeight: "bold" }}>
            No gigs available at the moment.
          </p>
        )}
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

export default Gigs;
