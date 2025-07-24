import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell";
import backgroundImage from "../assets/kcc_bg_clean.png";
import { FaBars, FaCalendarCheck } from "react-icons/fa";
import "./BrowseRides.css";

function BrowseRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
    fetchRides();
  }, []);

  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      const deltaY = touchEndY - touchStartY;
      if (deltaY < -50) {
        setSlideDirection("up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
    };
    const navRef = mobileNavRef.current;
    if (navRef) {
      navRef.addEventListener("touchstart", handleTouchStart);
      navRef.addEventListener("touchmove", handleTouchMove);
    }
    return () => {
      if (navRef) {
        navRef.removeEventListener("touchstart", handleTouchStart);
        navRef.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [mobileNavOpen]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();
      setUserProfile(profile);
    }
  };

  const fetchRides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carpools")
      .select(`*, users:user_id(full_name, phone)`)
      .order("datetime", { ascending: false });

    if (!error && data) {
      const enriched = await Promise.all(
        data.map(async (ride) => {
          const { data: reservations } = await supabase
            .from("carpool_reservations")
            .select("*")
            .eq("carpool_id", ride.id);

          return {
            ...ride,
            driver_name: ride.users?.full_name || "Unknown",
            contact_info: ride.users?.phone || "N/A",
            total_reserved: reservations?.length || 0,
            seatsRequested: ""
          };
        })
      );
      setRides(enriched);
    }

    setLoading(false);
  };

  const handleReserve = async (carpoolId, seatsRequested) => {
    if (!userId) {
      alert("Please log in to reserve a ride.");
      navigate("/login");
      return;
    }

    const seats = parseInt(seatsRequested, 10);
    if (!seats || seats < 1) {
      alert("Please enter a valid seat count.");
      return;
    }

    const { error } = await supabase.from("carpool_reservations").insert([
      {
        carpool_id: carpoolId,
        user_id: userId,
        seats_reserved: seats,
        reserved_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      alert("Reservation failed.");
    } else {
      alert("Reservation successful.");
      fetchRides();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const toggleMobileNav = () => {
    setSlideDirection("down");
    setMobileNavOpen(!mobileNavOpen);
  };

  return (
    <>
      <div className="browse-desktop-nav">
        <div className="browse-nav-left-logo" onClick={() => navigate("/gigs")}>AkaziNow</div>
        <ul>
          <li onClick={() => navigate("/gigs")}>Home</li>
          <li onClick={() => navigate("/browse-rides")}>Browse Rides</li>
          <li onClick={() => navigate("/post-ride")}>Post Ride</li>
          <li onClick={() => navigate("/carpool-inbox")}>Carpool Inbox</li>
          <li onClick={() => navigate("/abasare")}>Abasare</li>
          <li onClick={handleLogout}>Logout</li>
        </ul>
      </div>

      <div className="browse-mobile-top-bar">
        <div className="browse-mobile-left-group">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="Profile"
            className="browse-mobile-profile-pic"
          />
          <FaBars className="browse-mobile-hamburger" onClick={toggleMobileNav} />
        </div>
        <div className="browse-mobile-title">Browse Rides</div>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div
          className={`browse-mobile-nav-overlay ${slideDirection === "down" ? "browse-slide-down" : "browse-slide-up"}`}
          ref={mobileNavRef}
        >
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/gigs"); }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/browse-rides"); }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-ride"); }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox"); }}>Carpool Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare"); }}>Abasare</li>
            <li onClick={async () => { setMobileNavOpen(false); await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      <div className="browse-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="browse-hero-content">
          <h1 className="browse-heading">Available Rides</h1>
          <p className="browse-subheading">Find a safe and affordable ride near you</p>
        </div>
      </div>

      <div className="browse-count-section">
        <h2 className="browse-count-title">🚚 Available Rides</h2>
        <div className="browse-count">
          <FaCalendarCheck />
          {loading ? "Loading..." : `${rides.length} Total Rides`}
        </div>
      </div>

      <div className="browse-cards-section">
        {rides.length === 0 && !loading && (
          <div className="browse-empty">No available rides at the moment</div>
        )}

        {rides.map((ride) => {
          const totalReserved = ride.total_reserved ?? 0;
          const seats = Number(ride.available_seats || 0);
          const seatsLeft = seats - totalReserved;
          const rideDate = new Date(ride.datetime);
          const now = new Date();
          const isExpired = now - rideDate > 24 * 60 * 60 * 1000;
          const isFull = seatsLeft <= 0;
          const shouldHideDriverInfo = isExpired || isFull;

          return (
            <div key={ride.id} className="browse-card">
              <div className="browse-card-text">
                <h2>{ride.origin} → {ride.destination}</h2>
                <p><strong>Seats:</strong> {seats} | <strong>Left:</strong> {Math.max(seatsLeft, 0)}</p>
                <p><strong>Date:</strong> {rideDate.toLocaleString()}</p>
                <p><strong>Price:</strong> {ride.price} RWF</p>

                {!shouldHideDriverInfo && (
                  <>
                    <p><strong>Driver:</strong> {ride.driver_name}</p>
                    <p><strong>Phone:</strong> {ride.contact_info}</p>
                  </>
                )}

                <p><strong>Note:</strong> {ride.notes || "No notes provided."}</p>

                {isExpired && <p className="no-seats-text">This ride has expired</p>}
                {!isExpired && isFull && <p className="no-seats-text">This ride is fully reserved</p>}

                {!isExpired && !isFull && (
                  <div className="reservation-section">
                    <input
                      type="number"
                      min="1"
                      max={seatsLeft}
                      placeholder="Seats"
                      className="reserve-input"
                      value={ride.seatsRequested || ""}
                      onChange={(e) => {
                        const updatedRides = rides.map((r) =>
                          r.id === ride.id ? { ...r, seatsRequested: e.target.value } : r
                        );
                        setRides(updatedRides);
                      }}
                    />
                    <button
                      className="reserve-button"
                      onClick={() => handleReserve(ride.id, ride.seatsRequested)}
                    >
                      Reserve
                    </button>
                  </div>
                )}
              </div>
              {ride.image_url && <img src={ride.image_url} alt="Car" className="ride-car-image" />}
            </div>
          );
        })}
      </div>

      <div className="public-footer">
        <p>© 2025 AkaziNow. All rights reserved.</p>
        <div className="footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </div>
    </>
  );
}

export default BrowseRides;
