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
    const { data, error } = await supabase
      .from("jobs")
      .select(`*, user:users (full_name)`);

    if (!error) setJobs(data || []);
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
    setUserProfile(data || null);
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

  const handleApply = async (job) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    const { data: existingApp } = await supabase
      .from("applications")
      .select("*")
      .eq("gig_id", job.id)
      .eq("worker_id", user.id)
      .single();

    if (existingApp) {
      alert("You have already applied for this job.");
      return;
    }

    const message = prompt("Enter a short message for the employer:");
    if (!message) return;

    const { error: appError } = await supabase.from("applications").insert([
      {
        gig_id: job.id,
        worker_id: user.id,
        message,
        status: "pending",
      },
    ]);

    if (appError) {
      alert("Failed to apply. Please try again.");
      return;
    }

    const { data: jobDetails } = await supabase
      .from("jobs")
      .select("user_id, title")
      .eq("id", job.id)
      .single();

    if (jobDetails && jobDetails.user_id !== user.id) {
      const { error: notifError } = await supabase.from("notifications").insert([
        {
          recipient_id: jobDetails.user_id,
          message: `New application received for "${jobDetails.title}"`,
          type: "application",
          related_gig_id: job.id,
          read: false,
        },
      ]);

      if (notifError) {
        console.error("❌ Notification insert failed:", notifError.message);
      }
    }

    alert("Application submitted successfully!");
  };

  return (
    <div className="gigs-container">
      {/* MOBILE NAV */}
      <div className="gigs-mobile-topbar">
        <div className="gigs-mobile-left">
          <img
            src={userProfile?.image_url || defaultAvatar}
            alt="avatar"
            className="gigs-mobile-avatar"
          />
          <FaBars
            className="gigs-mobile-hamburger"
            onClick={handleHamburgerClick}
          />
        </div>
        <h2 className="gigs-mobile-title">Gigs</h2>
        <NotificationBell />
      </div>

      {mobileNavVisible && (
        <div
          ref={mobileNavRef}
          className={`gigs-mobile-nav-overlay ${slideDirection}`}
        >
          <ul>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/");
              }}
            >
              Home
            </li>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/gigs");
              }}
            >
              Gigs
            </li>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/post-job");
              }}
            >
              Post a Job
            </li>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/my-jobs");
              }}
            >
              My Jobs
            </li>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/profile");
              }}
            >
              Profile
            </li>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/inbox");
              }}
            >
              Inbox
            </li>
            <li
              onClick={() => {
                setMobileNavVisible(false);
                navigate("/carpools");
              }}
            >
              Car Pooling
            </li>
            <li
              onClick={async () => {
                await supabase.auth.signOut();
                navigate("/");
              }}
            >
              Logout
            </li>
          </ul>
        </div>
      )}

      {/* DESKTOP NAV */}
      <div className="gigs-desktop-nav">
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => navigate("/gigs")}>Gigs</li>
          <li onClick={() => navigate("/post-job")}>Post a Job</li>
          <li onClick={() => navigate("/my-jobs")}>My Jobs</li>
          <li onClick={() => navigate("/profile")}>Profile</li>
          <li onClick={() => navigate("/inbox")}>Inbox</li>
          <li onClick={() => navigate("/carpools")}>Car Pooling</li>
          <li
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/");
            }}
          >
            Logout
          </li>
        </ul>
      </div>

      {/* HERO */}
      <div
        className="gigs-hero"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="gigs-topbar">
          <div className="gigs-logo">AkaziNow</div>
          <div className="gigs-auth-buttons">
            <button onClick={() => navigate("/login")}>Sign In</button>
            <button onClick={() => navigate("/signup")}>Sign Up</button>
          </div>
        </div>

        <div className="gigs-hero-content">
          <h1 className="gigs-heading">Explore Gigs. Earn Fast. Start Today.</h1>
          <p className="gigs-subheading">
            Discover flexible jobs available in your area now.
          </p>
        </div>

        <div className="gigs-floating-count-box">
          <h2 className="gigs-count-title">💼 Available Gigs</h2>
          <div className="gigs-count-display">
            <FaCalendarCheck /> {jobs.length} Gigs Posted
          </div>
        </div>
      </div>

      {/* JOB CARDS */}
      <section className="gigs-cards-section">
        {jobs.length > 0 ? (
          jobs.map((job) => (
            <div
              className="gigs-card"
              key={job.id}
              style={{ background: "#fff8d4" }}
            >
              <div className="gigs-card-text">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <img
                    src={job.poster_image || defaultAvatar}
                    alt="poster"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "10px",
                    }}
                  />
                  <span style={{ fontWeight: "600", fontSize: "0.95rem" }}>
                    {job.user?.full_name || "Anonymous"}
                  </span>
                </div>

                <h2>{job.title}</h2>
                <p>{job.job_description}</p>
                <p>
                  <strong>Price:</strong> {job.price} RWF
                </p>
                <p>
                  <strong>Location:</strong> {job.address}
                </p>
                <p>
                  <strong>Contact:</strong>{" "}
                  {userProfile ? job.contact_info : "Login to view"}
                </p>
                <button onClick={() => handleApply(job)}>Apply</button>
              </div>

              {job.image_url && (
                <div className="gigs-card-image-wrapper">
                  <img src={job.image_url} alt="job" />
                </div>
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

export default Gigs;
