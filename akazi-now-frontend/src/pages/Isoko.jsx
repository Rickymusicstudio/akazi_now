// src/pages/Isoko.jsx
import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

import backgroundImage from "../assets/kcc_bg_clean.png";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import { FaBars, FaCalendarCheck } from "react-icons/fa";

import "./Isoko.css";

/** Links shown in the center nav / mobile overlay */
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
  const [authUser, setAuthUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Mobile nav state (exactly like Gigs)
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);

  // Lightbox for image preview
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Interest modal
  const [interestOpen, setInterestOpen] = useState(false);
  const [interestMsg, setInterestMsg] = useState("Hi! I'm interested in this item. Is it still available?");
  const [interestTarget, setInterestTarget] = useState(null); // { sellerAuthId, listingId }

  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item) => {
    if (item.key === "logout") return false;
    if (item.key === "home") {
      return location.pathname === "/isoko" || location.pathname === "/";
    }
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

    // Keep auth state in sync
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

  /** Fetch listings (flat), then pull seller profiles in a 2nd query and merge in. */
  const fetchListings = async () => {
    const { data: rows, error } = await supabase
      .from("market_listings")
      .select(
        "id,title,description,price,currency,intent,category,location,first_image_url,created_at,user_id"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("market_listings select error:", error);
      setListings([]);
      return;
    }

    const userIds = [...new Set(rows.map(r => r.user_id).filter(Boolean))];

    let sellerMap = {};
    if (userIds.length) {
      const { data: sellers, error: sellerErr } = await supabase
        .from("users")
        .select("auth_user_id, full_name, image_url")
        .in("auth_user_id", userIds);

      if (!sellerErr && sellers) {
        sellerMap = Object.fromEntries(
          sellers.map(s => [s.auth_user_id, s])
        );
      }
    }

    const merged = rows.map((r, idx) => ({
      ...r,
      seller_name: sellerMap[r.user_id]?.full_name || "Anonymous",
      seller_avatar: sellerMap[r.user_id]?.image_url || null,
      _variant: (idx % 3) + 1, // 1..3 for small accent differences
    }));

    setListings(merged);
  };

  const fetchUserAndProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setAuthUser(user || null);
    if (!user) return;
    const { data } = await supabase
      .from("users")
      .select("image_url")
      .eq("auth_user_id", user.id)
      .single();
    setUserProfile(data || null);
  };

  // Mobile overlay swipe-to-close behavior (same as Gigs)
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

  // Lightbox
  const openLightbox = (url) => setLightboxUrl(url);
  const closeLightbox = () => setLightboxUrl(null);

  // Interested flow
  const openInterest = (sellerAuthId, listingId) => {
    setInterestTarget({ sellerAuthId, listingId });
    setInterestMsg("Hi! I'm interested in this item. Is it still available?");
    setInterestOpen(true);
  };
  const closeInterest = () => {
    setInterestOpen(false);
    setInterestTarget(null);
  };

  /**
   * NEW: sendInterest sends a message (messages table you already have),
   * then creates a notification with sender name + item title,
   * and finally navigates to the chat (/messages?with=<seller>&listing=<id>)
   */
  const sendInterest = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Please sign in to send a message.");
      navigate("/login");
      return;
    }
    if (!interestTarget) return;

    const msg = (interestMsg || "").trim() || "I'm interested in your item.";
    const sellerId = interestTarget.sellerAuthId;
    const listingId = interestTarget.listingId; // market_listings.id

    // 1) Insert a chat message
    const { error: msgErr } = await supabase.from("messages").insert([{
      sender_id: user.id,
      receiver_id: sellerId,
      message: msg
    }]);

    if (msgErr) {
      console.error("Message insert error:", msgErr);
      alert("Couldn't send your message. Please try again.");
      return;
    }

    // 2) Build a richer notification "<Name>: “msg” — about <Item>"
    const [{ data: listing }, { data: me }] = await Promise.all([
      supabase.from("market_listings").select("title").eq("id", listingId).single(),
      supabase.from("users").select("full_name").eq("auth_user_id", user.id).maybeSingle(),
    ]);

    const title = listing?.title || "your item";
    const senderName = me?.full_name || "A buyer";
    const notifText = `${senderName}: “${msg}” — about ${title}`;

    // 3) Insert notification for the seller
    await supabase.from("notifications").insert([{
      recipient_id: sellerId,
      sender_id: user.id,
      related_listing_id: listingId,
      message: notifText,
      status: "unread",
    }]);

    alert("Message sent! The seller will be notified.");
    closeInterest();

    // 4) Open chat with seller; listing param is just context for future use
    navigate(`/messages?with=${sellerId}&listing=${listingId}`);
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

      {/* MOBILE OVERLAY NAV */}
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
          <div
            className="gigs-nav-left-logo"
            onClick={() => navigate("/")}
            title="AkaziNow Home"
          >
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

      {/* LISTING CARDS */}
      <section className="gigs-cards-section">
        {listings.length > 0 ? (
          listings.map((l) => (
            <article
              key={l.id}
              className={`isoko-card isoko-card--v${l._variant}`}
              style={{ background: l._variant === 2 ? "#fff8d4" : l._variant === 3 ? "#fdf2f2" : "#eef7ff" }}
            >
              {/* Seller chip */}
              <header className="isoko-seller">
                <img
                  src={l.seller_avatar || defaultAvatar}
                  alt={l.seller_name}
                  className="isoko-seller-avatar"
                />
                <span className="isoko-seller-name">{l.seller_name}</span>
              </header>

              <div className="isoko-body">
                <h3 className="isoko-title">{l.title}</h3>
                <p className="isoko-desc">{l.description}</p>

                <div className="isoko-meta">
                  {l.price != null && (
                    <div><strong>Price:</strong> {Number(l.price).toLocaleString()} {l.currency || "RWF"}</div>
                  )}
                  {l.location && (
                    <div><strong>Location:</strong> {l.location}</div>
                  )}
                  <div><strong>Category:</strong> {l.category}</div>
                  <div><strong>Intent:</strong> {l.intent}</div>
                </div>

                {l.first_image_url && (
                  <div
                    className="isoko-img-wrap"
                    onClick={() => openLightbox(l.first_image_url)}
                    title="Click to preview"
                  >
                    <img src={l.first_image_url} alt={l.title} />
                  </div>
                )}

                <div className="isoko-actions">
                  <button
                    className="isoko-btn isoko-btn--interest"
                    onClick={() => openInterest(l.user_id, l.id)}
                  >
                    Interested
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
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

      {/* FOOTER */}
      <footer className="gigs-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="gigs-footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>

      {/* LIGHTBOX */}
      {lightboxUrl && (
        <div className="isoko-lightbox" onClick={closeLightbox}>
          <img src={lightboxUrl} alt="preview" />
        </div>
      )}

      {/* INTEREST MODAL */}
      {interestOpen && (
        <div className="isoko-interest-overlay" onClick={closeInterest}>
          <div className="isoko-interest-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send a message</h3>
            <textarea
              value={interestMsg}
              onChange={(e) => setInterestMsg(e.target.value)}
              rows={4}
              placeholder="Write a short note to the seller…"
            />
            <div className="isoko-interest-actions">
              <button className="isoko-btn isoko-btn--ghost" onClick={closeInterest}>
                Cancel
              </button>
              <button className="isoko-btn isoko-btn--primary" onClick={sendInterest}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Isoko;
