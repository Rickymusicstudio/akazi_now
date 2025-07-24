// src/pages/Abasare.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaSearch } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import stickerRide from "../assets/ride.png";
import backgroundImage from "../assets/kcc_bg_clean.png";
import "./Abasare.css";

function Abasare() {
  const [form, setForm] = useState({ current_location: "", is_available: true });
  const [userId, setUserId] = useState(null);
  const [abasareList, setAbasareList] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTable, setShowTable] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUser();
    fetchAbasare();
    fetchProfileImage();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  };

  const fetchAbasare = async () => {
    const { data } = await supabase
      .from("abasare")
      .select(`id, current_location, is_available, average_rating, user_id, users:users!abasare_user_id_fkey(full_name, phone)`)
      .order("created_at", { ascending: false });
    setAbasareList(data || []);
  };

  const fetchProfileImage = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId || !form.current_location.trim()) return alert("Please fill all fields.");
    const { error } = await supabase.from("abasare").upsert([{
      user_id: userId,
      current_location: form.current_location.trim(),
      is_available: form.is_available,
    }]);
    if (!error) {
      alert("✅ Registered/Updated");
      setForm({ current_location: "", is_available: true });
      fetchAbasare();
    }
  };

  const handleRating = async (umusareId, stars) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id === umusareId) return;
    await supabase.from("ratings").insert([{ umusare_id: umusareId, rated_by: user.id, rating: stars }]);
    const { data: ratings } = await supabase.from("ratings").select("rating").eq("umusare_id", umusareId);
    const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    await supabase.from("abasare").update({ average_rating: avg }).eq("user_id", umusareId);
    fetchAbasare();
  };

  const toggleStatus = async (umusareId, currentStatus) => {
    if (!userId) return;
    await supabase.from("abasare").update({ is_available: !currentStatus }).eq("user_id", umusareId);
    fetchAbasare();
  };

  const leaveTable = async (umusareId) => {
    if (!userId) return;
    await supabase.from("abasare").delete().eq("user_id", umusareId);
    fetchAbasare();
  };

  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      if (!mobileNavOpen) return;
      if (touchStartY - e.touches[0].clientY > 50) closeMobileNav();
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
    <div className="abasare-container">
      {/* Desktop Nav */}
      <div className="abasare-desktop-nav">
        <div className="abasare-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/carpools")}>Browse Rides</li>
          <li onClick={() => navigate("/post-ride")}>Post Ride</li>
          <li onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/abasare")}>Abasare</li>
          <li onClick={() => closeAndNavigate("/", true)}>Logout</li>
        </ul>
      </div>

      {/* Hero */}
      <div className="abasare-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="abasare-mobile-topbar">
          <div className="abasare-mobile-left">
            <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="abasare-mobile-avatar" />
            <FaBars className="abasare-mobile-hamburger" onClick={handleMenuToggle} />
          </div>
          <div className="abasare-mobile-title">Abasare</div>
          <NotificationBell />
        </div>
        <div className="abasare-hero-content">
          <h1 className="abasare-hero-title">Umusare Registration</h1>
          <p className="abasare-hero-subtitle">Become a driver and help others get home safely.</p>
        </div>
        {mobileNavOpen && (
          <div ref={mobileNavRef} className={`abasare-mobile-nav-overlay ${slideDirection}`}>
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
      <section className="abasare-services-section">
        {/* Form */}
        <div className="abasare-form-card">
          <form className="abasare-form" onSubmit={handleSubmit}>
            <h2>Register as Umusare</h2>
            <label>Current Location</label>
            <input
              type="text"
              value={form.current_location}
              onChange={(e) => setForm({ ...form, current_location: e.target.value })}
              required
            />
            <label>
              <input
                type="checkbox"
                checked={form.is_available}
                onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
              />
              <span style={{ marginLeft: "0.5rem" }}>Available now</span>
            </label>
            <button type="submit">Submit</button>

            {abasareList.some((a) => a.user_id === userId) && (
              <div className="umusare-actions">
                <button
                  onClick={() => {
                    const me = abasareList.find((a) => a.user_id === userId);
                    if (me) toggleStatus(me.user_id, me.is_available);
                  }}
                >
                  Change Status
                </button>
                <button
                  className="exit-btn"
                  onClick={() => {
                    const me = abasareList.find((a) => a.user_id === userId);
                    if (me) leaveTable(me.user_id);
                  }}
                >
                  Exit Table
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Sticker Card */}
        <div className="abasare-sticker-card">
          <div className="abasare-info-card-content">
            <h3>Abasare Table</h3>
            <img src={stickerRide} alt="Umusare" className="abasare-info-card-image" />
            <p>View and rate available drivers ready to help.</p>
            <button className="abasare-show-table-btn" onClick={() => setShowTable(!showTable)}>
              {showTable ? "Hide Abasare Table" : "See Available Abasare"}
            </button>
          </div>
        </div>
      </section>

      {/* Separated Table Section */}
      {showTable && (
        <section className="abasare-table-section">
          <div className="abasare-table-container">
            <div className="search-bar">
              {!showSearch ? (
                <FaSearch className="search-icon" onClick={() => setShowSearch(true)} />
              ) : (
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name or location"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              )}
            </div>
            <div className="table-wrapper" style={{ overflowX: "auto", marginTop: "1rem" }}>
              <table className="abasare-table" style={{ minWidth: "700px" }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {abasareList
                    .filter((item) => {
                      const term = searchTerm.toLowerCase();
                      return (
                        item.users?.full_name?.toLowerCase().includes(term) ||
                        item.users?.phone?.toLowerCase().includes(term) ||
                        item.current_location?.toLowerCase().includes(term)
                      );
                    })
                    .map((item, index) => (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>
                          <Link
                            to={`/abasare/${item.user_id}`}
                            style={{ fontWeight: "bold", color: "#000" }}
                          >
                            {item.users?.full_name || "N/A"}
                          </Link>
                        </td>
                        <td>{item.users?.phone || "N/A"}</td>
                        <td>{item.current_location || "N/A"}</td>
                        <td style={{ color: item.is_available ? "green" : "red", fontWeight: "bold" }}>
                          {item.is_available ? "Available" : "Unavailable"}
                        </td>
                        <td>
                          {userId === item.user_id ? (
                            <span style={{ fontStyle: "italic", color: "gray" }}>(self)</span>
                          ) : (
                            Array.from({ length: 5 }, (_, i) => (
                              <span
                                key={i}
                                onClick={() => handleRating(item.user_id, i + 1)}
                                className={
                                  item.average_rating && i < Math.round(item.average_rating)
                                    ? "star-green"
                                    : "star-yellow"
                                }
                                style={{ cursor: "pointer" }}
                              >
                                ★
                              </span>
                            ))
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <footer className="abasare-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="abasare-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default Abasare;
