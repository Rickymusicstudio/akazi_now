import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import NotificationBell from "../components/NotificationBell.jsx";
import { useNavigate } from "react-router-dom";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import inboxSticker from "../assets/inbox.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./Inbox.css";

function CarpoolInbox() {
  const [reservations, setReservations] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const touchStartY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReservations();
    fetchUserProfile();
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

  const fetchReservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return navigate("/login");

    const { data, error } = await supabase
      .from("carpool_reservations")
      .select(`*, carpools!inner(user_id, origin, destination, datetime, price, car_image), users:user_id(full_name, phone, image_url)`)
      .eq("carpools.user_id", user.id)
      .order("reserved_at", { ascending: false });

    if (!error) setReservations(data);
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

  const closeAndNavigate = async (path, logout = false) => {
    setSlideDirection("slide-up");
    setTimeout(async () => {
      setMobileNavVisible(false);
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
            <FaBars className="postgig-mobile-hamburger" onClick={handleHamburgerClick} />
          </div>
          <div className="postgig-mobile-title">Inbox</div>
          <NotificationBell />
        </div>

        <div className="postgig-hero-content">
          <h1 className="postgig-hero-title">Carpool Inbox</h1>
          <p className="postgig-hero-subtitle">See who reserved your rides</p>
        </div>

        {mobileNavVisible && (
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
          <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>People Who Reserved</h2>
          {reservations.length > 0 ? (
            reservations.map((res) => (
              <div key={res.id} className="inbox-card">
                {res.carpools?.car_image && (
                  <img
                    src={res.carpools.car_image}
                    alt="car"
                    style={{ width: "100%", borderRadius: "12px", marginBottom: "0.5rem" }}
                  />
                )}
                <p><strong>From:</strong> {res.carpools?.origin}</p>
                <p><strong>To:</strong> {res.carpools?.destination}</p>
                <p><strong>Date:</strong> {new Date(res.carpools?.datetime).toLocaleString()}</p>
                <p><strong>Price:</strong> {res.carpools?.price} Frw</p>
                <p><strong>Reserved By:</strong> {res.users?.full_name}</p>
                <p><strong>Phone:</strong> {res.users?.phone}</p>
                <p><strong>Seats Reserved:</strong> {res.seats_reserved}</p>
                <p><strong>Reserved At:</strong> {new Date(res.reserved_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="inbox-empty">No reservations yet.</p>
          )}
        </div>

        <div className="postgig-sticker-card">
          <div className="postgig-info-card-content">
            <h3>Stay Organized</h3>
            <p>Review and manage who’s riding with you. Communicate with ease.</p>
            <img src={inboxSticker} alt="Inbox Sticker" className="postgig-info-card-image" />
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

export default CarpoolInbox;
