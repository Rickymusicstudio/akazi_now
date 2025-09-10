// Isoko.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./Isoko.css";

const ISOKO_LINKS = [
  { to: "/",                             label: "Home",        key: "home" },
  { to: "/isoko/categories/electronics", label: "Electronics", key: "electronics" },
  { to: "/isoko/categories/houses",      label: "Houses",      key: "houses" },
  { to: "/isoko/categories/cars",        label: "Cars",        key: "cars" },
  { to: "/isoko/categories/clothes",     label: "Clothes",     key: "clothes" },
  { label: "Logout", key: "logout", action: "logout", private: true },
];

function Isoko() {
  const [listings, setListings] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [authUser, setAuthUser] = useState(null);

  // mobile nav (same behavior as Gigs)
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);

  // lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.key === "logout") return false;
    if (item.key === "home") return location.pathname === "/isoko" || location.pathname === "/";
    return item.to ? location.pathname.startsWith(item.to) : false;
  };

  const sectionTitle = (() => {
    const m = location.pathname.match(/\/isoko\/categories\/([^/]+)/i);
    if (!m) return "Isoko — Buy & Sell Locally";
    const slug = m[1];
    const label = ISOKO_LINKS.find((l) => l.key === slug)?.label || slug;
    return `Isoko — ${label.charAt(0).toUpperCase() + label.slice(1)}`;
  })();

  useEffect(() => {
    fetchListings();
    fetchUserAndProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      const user = session?.user || null;
      setAuthUser(user);
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("image_url")
          .eq("auth_user_id", user.id)
          .single();
        setUserProfile(data || null);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchListings = async () => {
    // include user_id + seller name/avatar for the card & notifications
    const { data, error } = await supabase
      .from("market_listings")
      .select(`
        id, user_id, title, description, price, currency, intent,
        category, location, first_image_url, created_at,
        seller:users ( full_name, image_url, auth_user_id )
      `)
      .order("created_at", { ascending: false });

    if (!error) setListings(data || []);
  };

  const fetchUserAndProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setAuthUser(user || null);
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data || null);
  };

  // mobile overlay UX
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY; };
    const handleTouchMove = (e) => {
      if (!mobileNavVisible) return;
      const swipeDistance = touchStartY - e.touches[0].clientY;
      if (swipeDistance > 50) {
        setSlideDirection("slide-up");
        setTimeout(() => { setMobileNavVisible(false); setSlideDirection(""); }, 300);
      }
    };
    const handleScroll = () => {
      if (!mobileNavVisible) return;
      setSlideDirection("slide-up");
      setTimeout(() => { setMobileNavVisible(false); setSlideDirection(""); }, 300);
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

  const handleHamburgerClick = () => {
    if (!mobileNavVisible) {
      setSlideDirection("slide-down");
      setMobileNavVisible(true);
    } else {
      setSlideDirection("slide-up");
      setTimeout(() => setMobileNavVisible(false), 300);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileNavVisible(false);
    navigate("/");
  };

  // ====== NEW: Interested CTA ======
  const handleInterested = async (listing) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    if (user.id === listing.user_id) {
      alert("You posted this item.");
      return;
    }

    const text = prompt("Send a short message to the seller:");
    if (!text) return;

    // Insert notification WITHOUT 'type' (your table doesn't have it)
    const { error: notifError } = await supabase.from("notifications").insert([{
      recipient_id: listing.user_id,
      message: `Interest on "${listing.title}": ${text}`,
      related_listing_id: listing.id,
      read: false,
    }]);

    if (notifError) {
      console.error("notify error", notifError.message);
      alert("Couldn't send your interest. Please try again.");
      return;
    }

    alert("Your interest was sent to the seller ✅");
  };

  return (
    <div className="gigs-container">
      {/* MOBILE TOPBAR */}
      <div className="gigs-mobile-topbar">
        <div className="gigs-mobile-left">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="gigs-mobile-avatar"
          />
          <FaBars className="gigs-mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="gigs-mobile-title">Isoko</h2>
        <NotificationBell />
      </div>

      {/* MOBILE NAV OVERLAY */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`gigs-mobile-nav-overlay ${slideDirection}`}>
          <ul>
            {ISOKO_LINKS
              .filter((i) => !i.private || authUser)
              .map((item) => (
                <li
                  key={item.key}
                  onClick={() => {
                    if (item.action === "logout") { handleLogout(); return; }
                    setMobileNavVisible(false);
                    navigate(item.to);
                  }}
                >
                  {item.label}
                </li>
              ))}
            <li onClick={() => { setMobileNavVisible(false); navigate("/isoko/post-item"); }}>
              Post Item
            </li>
            {!authUser && (
              <>
                <li onClick={() => { setMobileNavVisible(false); navigate("/login"); }}>Sign In</li>
                <li onClick={() => { setMobileNavVisible(false); navigate("/signup"); }}>Sign Up</li>
              </>
            )}
          </ul>
        </div>
      )}

      {/* DESKTOP NAV */}
      <div className="gigs-desktop-nav">
        <div className="gigs-desktop-nav-inner">
          <div className="gigs-nav-left-logo" onClick={() => navigate("/")} title="AkaziNow Home">
            AkaziNow
          </div>

          <nav className="gigs-nav-center">
            <ul>
              {ISOKO_LINKS
                .filter((i) => !i.private || authUser)
                .map((item) => (
                  <li
                    key={item.key}
                    className={isActive(item) ? "active" : ""}
                    onClick={() =>
                      item.action === "logout" ? handleLogout() : navigate(item.to)
                    }
                  >
                    {item.label}
                  </li>
                ))}
            </ul>
          </nav>

          <div className="gigs-nav-right">
            <button
              className="gigs-auth-button gigs-auth-button--gold"
              onClick={() => navigate("/isoko/post-item")}
              title="Post Item"
            >
              Post Item
            </button>
            {authUser ? (
              <img
                src={userProfile?.image_url || defaultAvatar}
                alt="me"
                className="gigs-mobile-avatar"
                style={{ width: 34, height: 34, cursor: "pointer" }}
                onClick={() => navigate("/profile")}
                title="Profile"
              />
            ) : (
              <>
                <button className="gigs-auth-button" onClick={() => navigate("/login")}>
                  Sign In
                </button>
                <button className="gigs-auth-button" onClick={() => navigate("/signup")}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div className="gigs-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="gigs-topbar">
          <div className="gigs-logo">AkaziNow</div>
          {!authUser && (
            <div className="gigs-auth-buttons">
              <button onClick={() => navigate("/login")}>Sign In</button>
              <button onClick={() => navigate("/signup")}>Sign Up</button>
            </div>
          )}
        </div>

        <div className="gigs-hero-content">
          <h1 className="gigs-heading">{sectionTitle}</h1>
          <p className="gigs-subheading">
            {sectionTitle.includes("—")
              ? `Browse ${sectionTitle.split("—")[1].trim()} listings in your area.`
              : "Post what you want to sell or find what you need."}
          </p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">🛍️ Listings</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> {listings.length} Items
          </div>
        </div>
      </div>

      {/* CARDS */}
      <section className="isoko-cards">
        {listings.map((item, idx) => {
          const sellerName = item?.seller?.full_name || "Anonymous";
          const sellerAvatar = item?.seller?.image_url || defaultAvatar;

          return (
            <article
              key={item.id}
              className={`isoko-card ${idx % 2 === 0 ? "alt-a" : "alt-b"}`}
            >
              <header className="isoko-card-header">
                <img src={sellerAvatar} alt="" className="isoko-card-avatar" />
                <span className="isoko-card-seller">{sellerName}</span>
              </header>

              <div className="isoko-card-body">
                <h3 className="isoko-title">{item.title}</h3>
                <p className="isoko-desc">{item.description}</p>
                <p><strong>Price:</strong> {item.price} {item.currency}</p>
                <p><strong>Location:</strong> {item.location}</p>
                <p><strong>Category:</strong> {item.category}</p>
                <p><strong>Intent:</strong> {item.intent}</p>
              </div>

              {item.first_image_url && (
                <div className="isoko-img-wrap" onClick={() => setLightboxUrl(item.first_image_url)}>
                  <img src={item.first_image_url} alt={item.title} />
                </div>
              )}

              <footer className="isoko-card-actions">
                <button className="btn-interested" onClick={() => handleInterested(item)}>
                  Interested
                </button>
              </footer>
            </article>
          );
        })}

        {listings.length === 0 && (
          <p style={{ marginTop: "2rem", fontWeight: "bold" }}>
            No items yet. Be the first to{" "}
            <span
              style={{ textDecoration: "underline", cursor: "pointer" }}
              onClick={() => navigate("/isoko/post-item")}
            >
              post one
            </span>.
          </p>
        )}
      </section>

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div className="isoko-lightbox" onClick={() => setLightboxUrl(null)}>
          <img src={lightboxUrl} alt="Preview" />
        </div>
      )}

      {/* FOOTER */}
      <footer className="gigs-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="gigs-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </div>
  );
}

export default Isoko;
