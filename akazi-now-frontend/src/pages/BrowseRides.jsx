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
  const [reservationCounts, setReservationCounts] = useState({});
  const [userId, setUserId] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const lastScrollY = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentUser();
    fetchRides();
  }, []);

  useEffect(() => {
    let touchStartY = 0;
    const handleScroll = () => {
      const currentY = window.scrollY;
      if (currentY < lastScrollY.current - 10 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
      lastScrollY.current = currentY;
    };
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchEndY = e.touches[0].clientY;
      if (touchStartY - touchEndY > 50 && mobileNavOpen) {
        setSlideDirection("slide-up");
        setTimeout(() => setMobileNavOpen(false), 300);
      }
    };
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [mobileNavOpen]);

  const getCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    if (user?.id) {
      const { data: profile } = await supabase
        .from("users")
        .select("image_url")
        .eq("auth_user_id", user.id)
        .single();
      setUserProfile(profile);
    }
  };

  const fetchRides = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("carpools")
      .select(`
        *,
        driver:user_id(full_name, phone, image_url),
        reservations:carpool_reservations(user_id, seats_reserved)
      `)
      .order("datetime", { ascending: false });

    if (!error) {
      setRides(data || []);
    } else {
      console.error("Error fetching rides:", error.message);
    }
    setLoading(false);
  };

  const handleSeatChange = (carpoolId, value) => {
    const numericValue = parseInt(value);
    setReservationCounts((prev) => ({
      ...prev,
      [carpoolId]: isNaN(numericValue) || numericValue <= 0 ? "" : numericValue,
    }));
  };

  const reserveSeat = async (ride, seatsRequested) => {
    const carpoolId = ride.id;
    const reservedCount = Array.isArray(ride.reservations)
      ? ride.reservations.reduce((sum, r) => sum + (r.seats_reserved ?? 0), 0)
      : 0;
    const seatsLeft = (ride.available_seats ?? 0) - reservedCount;
    const numericSeats = parseInt(seatsRequested);
    if (!userId) {
      alert("Please login to reserve a seat.");
      navigate("/login");
      return;
    }
    if (isNaN(numericSeats) || numericSeats <= 0) {
      alert("⚠️ Please enter a valid number of seats.");
      return;
    }
    if (ride.reservations?.some((r) => r.user_id === userId)) {
      alert("⚠️ You already reserved a seat.");
      return;
    }
    if (numericSeats > seatsLeft) {
      alert("❌ Not enough seats left.");
      return;
    }
    const { error } = await supabase.from("carpool_reservations").insert([
      {
        carpool_id: carpoolId,
        user_id: userId,
        seats_reserved: numericSeats,
      },
    ]);
    if (error) {
      alert("❌ Reservation failed: " + error.message);
    } else {
      alert("✅ Reservation successful!");
      fetchRides();
    }
  };

  const cancelReservation = async (carpoolId) => {
    if (!userId) return;
    const { error } = await supabase
      .from("carpool_reservations")
      .delete()
      .match({ carpool_id: carpoolId, user_id: userId });

    if (!error) {
      alert("🗑️ Reservation cancelled.");
      fetchRides();
    } else {
      alert("❌ Failed to cancel: " + error.message);
    }
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
          <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
        </ul>
      </div>

      <div className="mobile-top-bar">
        <div className="mobile-left-group">
          <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={() => {
            setSlideDirection("slide-down");
            setMobileNavOpen(true);
          }} />
        </div>
        <h2 className="mobile-title">Browse Rides</h2>
        <NotificationBell />
      </div>

      {mobileNavOpen && (
        <div className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => { setMobileNavOpen(false); navigate("/gigs"); }}>Home</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/browse-rides"); }}>Browse Rides</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/post-ride"); }}>Post Ride</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/carpool-inbox"); }}>Carpool Inbox</li>
            <li onClick={() => { setMobileNavOpen(false); navigate("/abasare"); }}>Abasare</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      <div className="browse-hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="browse-hero-content">
          <h1 className="browse-heading">Available Rides</h1>
          <p className="browse-subheading">Find a safe and affordable ride near you</p>
        </div>
      </div>

      <section className="browse-count-section">
        <h2 className="browse-count-title">🚛 Available Rides</h2>
        <div className="browse-count">
          <FaCalendarCheck /> {rides.length} Total Rides
        </div>
      </section>

      <div className="browse-cards-section">
        {loading ? (
          <p className="browse-empty">Loading rides...</p>
        ) : rides.length === 0 ? (
          <p className="browse-empty">No rides available right now.</p>
        ) : (
          rides.map((ride) => {
            const reservedCount = Array.isArray(ride.reservations)
              ? ride.reservations.reduce((sum, r) => sum + (r.seats_reserved ?? 0), 0)
              : 0;
            const seatsLeft = Math.max(0, (ride.available_seats ?? 0) - reservedCount);
            const selectedSeats = reservationCounts[ride.id] ?? "";
            const hasReserved = ride.reservations?.some(r => r.user_id === userId);
            const rideDate = new Date(ride.datetime);
            const now = new Date();
            const timeDiff = now - rideDate;
            const isExpired = timeDiff > 24 * 60 * 60 * 1000;
            const isFullyReserved = seatsLeft === 0;

            return (
              <div className="browse-card" key={ride.id}>
                <div className="browse-card-text">
                  <h2>{ride.origin} → {ride.destination}</h2>
                  <p><strong>Seats:</strong> {ride.available_seats} | <strong>Left:</strong> {seatsLeft}</p>
                  <p><strong>Date:</strong> {rideDate.toLocaleString()}</p>
                  {ride.price && <p><strong>Price:</strong> {ride.price} RWF</p>}
                  {ride.notes && <p><strong>Note:</strong> {ride.notes}</p>}
                  <p><strong>Driver:</strong> {ride.driver?.full_name || "Unknown"}</p>
                  <p><strong>Contact:</strong> {ride.driver?.phone || "N/A"}</p>

                  {isExpired ? (
                    <p className="no-seats-text">⏰ This ride has expired. Please repost.</p>
                  ) : isFullyReserved ? (
                    <p className="no-seats-text">✅ Ride is fully reserved.</p>
                  ) : hasReserved ? (
                    <button className="cancel-btn" onClick={() => cancelReservation(ride.id)}>Cancel Reservation</button>
                  ) : (
                    <div className="reserve-row">
                      <input
                        type="number"
                        min="1"
                        value={selectedSeats}
                        onChange={(e) => handleSeatChange(ride.id, e.target.value)}
                        placeholder="Seats"
                      />
                      <button className="reserve-btn" onClick={() => reserveSeat(ride, selectedSeats)}>
                        Reserve
                      </button>
                    </div>
                  )}
                </div>
                {ride.car_image && (
                  <img src={ride.car_image} alt="Car" className="ride-car-image" />
                )}
              </div>
            );
          })
        )}
      </div>

      <footer className="public-footer">
        <p>&copy; {new Date().getFullYear()} AkaziNow. All rights reserved.</p>
        <div className="footer-links">
          <button onClick={() => navigate("/about")}>About</button>
          <button onClick={() => navigate("/help")}>Help</button>
          <button onClick={() => navigate("/contact")}>Contact</button>
        </div>
      </footer>
    </>
  );
}

export default BrowseRides;
