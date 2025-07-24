import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars } from "react-icons/fa";
import defaultAvatar from "../assets/avatar.png";
import "./PostGig.css"; // Reuse styling

function AbasareTable() {
  const [abasareList, setAbasareList] = useState([]);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAbasare();
    fetchProfileImage();
  }, []);

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
    <div className="postgig-container">
      {/* Desktop Nav */}
      <div className="postgig-desktop-nav">
        <div className="postgig-nav-left-logo" onClick={() => navigate("/")}>AkaziNow</div>
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
      <div className="postgig-hero" style={{ backgroundImage: `url(${require("../assets/kcc_bg_clean.png")})` }}>
        <div className="postgig-mobile-topbar">
          <div className="postgig-mobile-left">
            <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="postgig-mobile-avatar" />
            <FaBars className="postgig-mobile-hamburger" onClick={handleMenuToggle} />
          </div>
          <div className="postgig-mobile-title">Abasare Table</div>
          <NotificationBell />
        </div>
        <div className="postgig-hero-content">
          <h1 className="postgig-hero-title">Available Drivers</h1>
          <p className="postgig-hero-subtitle">Check who is ready to help right now.</p>
        </div>
        {mobileNavOpen && (
          <div className={`postgig-mobile-nav-overlay ${slideDirection}`}>
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

      {/* Table Section */}
      <section className="postgig-services-section">
        <div className="postgig-form-card">
          <h2>All Registered Abasare</h2>
          <input
            type="text"
            placeholder="Search by name or location"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: "1rem", padding: "0.5rem", width: "100%" }}
          />
          <div className="table-wrapper" style={{ overflowX: "auto" }}>
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
                  .filter(item => {
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
                        <Link to={`/abasare/${item.user_id}`} style={{ fontWeight: "bold", color: "#000" }}>
                          {item.users?.full_name || "N/A"}
                        </Link>
                      </td>
                      <td>{item.users?.phone || "N/A"}</td>
                      <td>{item.current_location || "N/A"}</td>
                      <td style={{ color: item.is_available ? "green" : "red", fontWeight: "bold" }}>
                        {item.is_available ? "Available" : "Unavailable"}
                      </td>
                      <td>{item.average_rating ? `${item.average_rating.toFixed(1)} / 5` : "Unrated"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
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

export default AbasareTable;
 
