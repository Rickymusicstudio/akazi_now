import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { FaPhone, FaBars, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../assets/avatar.png";
import NotificationBell from "../components/NotificationBell.jsx";
import "./Gigs.css";

function Gigs() {
  const [jobs, setJobs] = useState([]);
  const [jobsFetched, setJobsFetched] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [slideDirection, setSlideDirection] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const mobileNavRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchJobs = async () => {
    const { data, error } = await supabase.from("jobs").select("*");
    setJobsFetched(true);
    setShowWelcome(false);
    if (error) {
      console.error("❌ Failed to fetch jobs:", error.message);
    } else {
      setJobs(data || []);
    }
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

  const handleImageClick = (url) => {
    setSelectedImage(url);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedImage(null);
  };

  const handleApply = async (jobId) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("❗Please login to apply.");
      navigate("/login");
      return;
    }

    if (!applicationMessage.trim()) {
      alert("✍️ Please enter a message before submitting.");
      return;
    }

    const { error } = await supabase.from("applications").insert([
      {
        gig_id: jobId,
        worker_id: user.id,
        message: applicationMessage,
        status: "pending",
      },
    ]);

    if (error) {
      if (error.message.includes("unique_applicant_per_gig")) {
        alert("⚠️ You have already applied for this job. Check your Inbox for updates.");
      } else {
        alert("❌ Failed to apply: " + error.message);
      }
    } else {
      alert("✅ Application submitted!");
      setApplyingJobId(null);
      setApplicationMessage("");
    }
  };

  const copyJobLink = (jobId) => {
    const jobUrl = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
      alert("🔗 Link copied!");
    });
  };

  return (
    <div className="gigs-container">
      {/* Top Bar */}
      <div className="mobile-top-bar" style={{ background: "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)" }}>
        <div className="mobile-left-group">
          <img src={userProfile?.image_url || defaultAvatar} alt="avatar" className="mobile-profile-pic" />
          <FaBars className="mobile-hamburger" onClick={handleHamburgerClick} />
        </div>
        <h2 className="mobile-title">Available Jobs</h2>
        <NotificationBell />
      </div>

      {/* Mobile Nav Overlay */}
      {mobileNavVisible && (
        <div ref={mobileNavRef} className={`mobile-nav-overlay ${slideDirection}`}>
          <ul>
            <li onClick={() => { setMobileNavVisible(false); setJobs([]); setJobsFetched(false); setShowWelcome(true); window.scrollTo(0, 0); }}>Home</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/post-job"); }}>Post a Job</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/my-jobs"); }}>My Jobs</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/profile"); }}>Profile</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/inbox"); }}>Inbox</li>
            <li onClick={() => { setMobileNavVisible(false); navigate("/carpools"); }}>Car Pooling</li>
            <li onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }}>Logout</li>
          </ul>
        </div>
      )}

      {/* Left Nav */}
      <div className="gigs-left">
        <div className="nav-buttons">
          <button onClick={() => { setJobs([]); setJobsFetched(false); setShowWelcome(true); window.scrollTo(0, 0); }}>Home</button>
          <button onClick={() => navigate("/post-job")}>Post a Job</button>
          <button onClick={() => navigate("/my-jobs")}>My Jobs</button>
          <button onClick={() => navigate("/profile")}>Profile</button>
          <button onClick={() => navigate("/inbox")}>Inbox</button>
          <button onClick={() => navigate("/carpools")}>Car Pooling</button>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/login"); }} style={{ color: "#ffcccc" }}>Logout</button>
        </div>
        <h2 style={{ fontSize: "32px", fontWeight: "bold", marginTop: "3rem" }}>Available Jobs</h2>
        <NotificationBell />
      </div>

      {/* Right Content */}
      <div className="gigs-right">
        {showWelcome && (
          <>
            <div className="welcome-card slide-in-left">
              <h3>👋 <strong>Welcome to AkaziNow!</strong></h3>
              <p>Your Smart Way to Find or Post Quick Gigs in Rwanda.</p>
              <p>💼 Whether you're looking to earn fast or need help with a task —</p>
              <p>We've got you covered.</p>
              <p>🚀 Start now. Find work. Get paid.</p>
              <button className="find-jobs-button" onClick={fetchJobs}>
                <FaSearch style={{ marginRight: "0.5rem" }} />
                Find Jobs
              </button>
            </div>

            {/* 👇 Sliding Badges */}
            <div className="badge-slider">
              <div className="badge">🎯 Fast Hiring</div>
              <div className="badge">💵 Instant Pay</div>
              <div className="badge">📍 Local Tasks</div>
              <div className="badge">⭐ Trusted Workers</div>
              <div className="badge">📅 Flexible Hours</div>
            </div>
          </>
        )}

        {!showWelcome && jobsFetched && jobs.length === 0 && (
          <p className="empty-message">No jobs available right now.</p>
        )}

        {jobs.length > 0 && (
          <div className="job-list">
            {jobs.map((job) => (
              <div key={job.id} className="job-card">
                {job.poster_image && <img src={job.poster_image} alt="Poster" className="poster-img" />}
                <div className="job-card-details">
                  <p><strong>Title:</strong> {job.title}</p>
                  <p><strong>Posted by:</strong> {job.employer_name}</p>
                  <p><strong>Address:</strong> {job.address}</p>
                  <p><strong>Description:</strong> {job.job_description}</p>
                  <p><strong>Requirement:</strong> {job.requirement || "-"}</p>
                  <p><strong>Price:</strong> {job.price ? `${Number(job.price).toLocaleString()} Frw` : "Not specified"}</p>
                  <p style={{ display: "flex", alignItems: "center", color: "#6a00ff" }}>
                    <FaPhone style={{ marginRight: "0.5rem" }} /> {job.contact_info}
                  </p>
                  <p><strong>Status:</strong> <span style={{ color: job.status === "open" ? "green" : "red" }}>{job.status}</span></p>

                  <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    <button onClick={() => copyJobLink(job.id)} title="Copy Job Link">🔗</button>
                    {job.status === "open" && (applyingJobId === job.id ? (
                      <div style={{ width: "100%" }}>
                        <textarea className="application-textarea" placeholder="Your message" rows={3}
                          value={applicationMessage} onChange={(e) => setApplicationMessage(e.target.value)} />
                        <button style={btnStyle} onClick={() => handleApply(job.id)}>Submit Application</button>
                      </div>
                    ) : (
                      <button style={btnStyle} onClick={() => setApplyingJobId(job.id)}>Apply</button>
                    ))}
                  </div>
                </div>

                {job.image_url && (
                  <img src={job.image_url} alt="Job Visual" onClick={() => handleImageClick(job.image_url)} className="job-image" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && selectedImage && (
        <div className="image-modal" onClick={closeModal}>
          <img src={selectedImage} alt="Preview" />
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  background: "linear-gradient(to right, #0f2027, #203a43, #2c5364)",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "999px",
  cursor: "pointer",
  fontWeight: "bold"
};

export default Gigs;
